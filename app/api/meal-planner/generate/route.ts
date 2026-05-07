import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL, TEMP } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart, regenerate } = await request.json()
  // regenerate: null = full week | { date: 'YYYY-MM-DD', mealType: string } = single slot

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

  // Build slot list
  const slots: { date: string; meal_type: string }[] = []
  if (regenerate) {
    slots.push({ date: regenerate.date, meal_type: regenerate.mealType })
  } else {
    const mealTypes = ['breakfast', 'lunch', 'dinner']
    for (let i = 0; i < 7; i++) {
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

Return a JSON object { "meals": [...] } where each meal has:
{
  "date": "YYYY-MM-DD",
  "meal_type": "breakfast" | "lunch" | "dinner",
  "meal_name": "short descriptive name",
  "ingredients": ["1 cup oats", "2 eggs", ...],
  "directions": "2-3 concise sentences.",
  "calories": 450,
  "protein_g": 35,
  "fat_g": 12,
  "carbs_g": 55
}

Be specific with portions. Vary the meals across the week — no repeats.`

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: TEMP.meals,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const { meals } = JSON.parse(raw)

  if (!Array.isArray(meals) || meals.length === 0) {
    return NextResponse.json({ error: 'AI returned no meals' }, { status: 500 })
  }

  await supabase.from('meal_plan_slots').upsert(
    meals.map((m: any) => ({
      user_id:     user.id,
      plan_date:   m.date,
      meal_type:   m.meal_type,
      meal_name:   m.meal_name,
      ingredients: m.ingredients ?? [],
      directions:  m.directions ?? '',
      calories:    m.calories,
      protein_g:   m.protein_g,
      fat_g:       m.fat_g,
      carbs_g:     m.carbs_g,
      accepted:    false,
    })),
    { onConflict: 'user_id,plan_date,meal_type' }
  )

  return NextResponse.json({ meals })
}
