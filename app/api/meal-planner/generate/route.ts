import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { weekStart, regenerate, days = 7 } = await request.json()

  const [{ data: profile }, { data: macroTarget }] = await Promise.all([
    supabase.from('profiles').select('diet_mode, health_profile').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
  ])

  const calories = macroTarget?.total_calories ?? 2000
  const protein  = macroTarget?.protein_g ?? 150
  const carbs    = macroTarget?.carbohydrates_g ?? 200
  const fat      = macroTarget?.fat_g ?? 65

  const dietMode   = profile?.diet_mode ?? 'default'
  const healthInfo = profile?.health_profile ?? {}
  const allergies  = healthInfo.allergies ?? healthInfo.food_allergies ?? ''
  const conditions = healthInfo.conditions ?? healthInfo.health_conditions ?? ''

  const slots: { date: string; meal_type: string }[] = []
  if (regenerate) {
    slots.push({ date: regenerate.date, meal_type: regenerate.mealType })
  } else {
    const mealTypes = ['breakfast', 'lunch', 'dinner']
    const numDays = Math.min(Math.max(Number(days) || 7, 1), 7)
    for (let i = 0; i < numDays; i++) {
      const d = new Date(weekStart)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      for (const mt of mealTypes) slots.push({ date: dateStr, meal_type: mt })
    }
  }

  const dietLabel = dietMode !== 'default' ? dietMode.replace(/_/g, ' ') : 'balanced'

  const prompt = `You are a gut-friendly nutrition planner. Generate meal plans with these requirements:
- Diet style: ${dietLabel}
- Daily targets: ${calories} kcal · Protein ${protein}g · Carbs ${carbs}g · Fat ${fat}g
${allergies ? `- Allergies/foods to avoid: ${allergies}` : ''}
${conditions ? `- Health conditions to consider: ${conditions}` : ''}

Prioritize gut-friendly foods: lean proteins, fiber-rich vegetables, fermented foods (yogurt, kefir, kimchi), low-FODMAP where appropriate. Avoid processed foods, excess refined sugar, and common gut irritants.

For each day, distribute macros roughly: breakfast 25%, lunch 35%, dinner 40% of daily targets.

Generate meals for these slots:
${slots.map(s => `- ${s.date} ${s.meal_type}`).join('\n')}

Return a JSON array of meal objects. Each object must have:
{
  "date": "YYYY-MM-DD",
  "meal_type": "breakfast" | "lunch" | "dinner",
  "meal_name": "string",
  "ingredients": ["string", ...],
  "directions": "string",
  "calories": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number
}

Be specific with portions. Vary the meals — no repeats across the week.`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: string) =>
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      const saveMeal = async (meal: Record<string, unknown>) => {
        const row = {
          user_id:     user.id,
          plan_date:   meal.date as string,
          meal_type:   meal.meal_type as string,
          meal_name:   meal.meal_name as string,
          ingredients: (meal.ingredients as string[]) ?? [],
          directions:  (meal.directions as string) ?? '',
          calories:    meal.calories as number,
          protein_g:   meal.protein_g as number,
          fat_g:       meal.fat_g as number,
          carbs_g:     meal.carbs_g as number,
          accepted:    false,
        }
        const { error } = await supabase
          .from('meal_plan_slots')
          .upsert(row, { onConflict: 'user_id,plan_date,meal_type' })
        if (!error) {
          send(JSON.stringify({ ...row, plan_date: meal.date }))
        }
      }

      try {
        const stream = await openai.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        })

        let accumulated = ''

        // Brace-depth scanner: extracts complete top-level JSON objects as they stream in.
        // Handles strings correctly (ignores { } inside quoted strings, respects \").
        let depth = 0
        let inString = false
        let escaped = false
        let objStart = -1

        const processChar = async (ch: string, idx: number) => {
          if (escaped) { escaped = false; return }
          if (ch === '\\' && inString) { escaped = true; return }
          if (ch === '"') { inString = !inString; return }
          if (inString) return

          if (ch === '{') {
            if (depth === 0) objStart = idx
            depth++
          } else if (ch === '}') {
            depth--
            if (depth === 0 && objStart >= 0) {
              const candidate = accumulated.slice(objStart, idx + 1)
              objStart = -1
              try {
                const meal = JSON.parse(candidate)
                if (meal.meal_name && meal.date && meal.meal_type) {
                  await saveMeal(meal)
                }
              } catch { /* incomplete fragment — skip */ }
            }
          }
        }

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          const prevLen = accumulated.length
          accumulated += delta

          // Process only the newly added characters
          for (let i = prevLen; i < accumulated.length; i++) {
            await processChar(accumulated[i], i)
          }
        }

      } catch (err) {
        send(JSON.stringify({ error: String(err) }))
      }

      send('[DONE]')
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
