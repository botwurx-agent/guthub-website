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

Output ONLY raw NDJSON — one complete JSON object per line, no wrapping array, no markdown, no explanation.
Each line must be valid JSON with exactly these keys:
{"date":"YYYY-MM-DD","meal_type":"breakfast"|"lunch"|"dinner","meal_name":"string","ingredients":["string",...],"directions":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}

Be specific with portions. Vary the meals — no repeats across the week.`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: string) =>
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      try {
        const stream = await openai.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        })

        let textBuffer = ''

        const processLine = async (line: string) => {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('{')) return
          try {
            const meal = JSON.parse(trimmed)
            if (!meal.meal_name || !meal.date || !meal.meal_type) return

            const row = {
              user_id:     user.id,
              plan_date:   meal.date,
              meal_type:   meal.meal_type,
              meal_name:   meal.meal_name,
              ingredients: meal.ingredients ?? [],
              directions:  meal.directions ?? '',
              calories:    meal.calories,
              protein_g:   meal.protein_g,
              fat_g:       meal.fat_g,
              carbs_g:     meal.carbs_g,
              accepted:    false,
            }

            const { error } = await supabase
              .from('meal_plan_slots')
              .upsert(row, { onConflict: 'user_id,plan_date,meal_type' })

            if (!error) {
              send(JSON.stringify({
                plan_date:   meal.date,
                meal_type:   meal.meal_type,
                meal_name:   meal.meal_name,
                ingredients: meal.ingredients ?? [],
                directions:  meal.directions ?? '',
                calories:    meal.calories,
                protein_g:   meal.protein_g,
                fat_g:       meal.fat_g,
                carbs_g:     meal.carbs_g,
                accepted:    false,
              }))
            }
          } catch { /* incomplete / malformed JSON — skip */ }
        }

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          textBuffer += delta

          let newlineIdx: number
          while ((newlineIdx = textBuffer.indexOf('\n')) !== -1) {
            const line = textBuffer.slice(0, newlineIdx)
            textBuffer = textBuffer.slice(newlineIdx + 1)
            await processLine(line)
          }
        }

        // Handle any remaining content (last line without trailing newline)
        if (textBuffer.trim()) await processLine(textBuffer)

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
