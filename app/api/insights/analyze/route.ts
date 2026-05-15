import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// DB-allowed insight_type values — must match insights_insight_type_check constraint
const ALLOWED_INSIGHT_TYPES = new Set([
  'correlation', 'trend', 'weekly_summary', 'goal_analysis', 'lab_finding',
  'positive', 'achievement', 'goal',
])

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [
    { data: symptoms },
    { data: bms },
    { data: meals },
    { data: weights },
    { data: waterLogs },
  ] = await Promise.all([
    supabase.from('symptom_logs').select('log_date, symptom_type, severity, notes').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('bm_logs').select('log_date, bristol_type, urgency, pain').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('meal_logs').select('log_date, meal_name, meal_type, ingredients, calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('weight_logs').select('log_date, weight_kg').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('water_logs').select('log_date, amount_ml').eq('user_id', user.id).gte('log_date', since).order('log_date'),
  ])

  const hasSufficientData = (symptoms?.length ?? 0) + (meals?.length ?? 0) >= 3
  if (!hasSufficientData) {
    return NextResponse.json({ error: 'insufficient_data' }, { status: 422 })
  }

  // Aggregate water by date (sum ml per day, convert to oz)
  const waterByDate: Record<string, number> = {}
  for (const w of waterLogs ?? []) {
    waterByDate[w.log_date] = (waterByDate[w.log_date] ?? 0) + Number(w.amount_ml ?? 0)
  }
  const waterSummary = Object.entries(waterByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ml]) => `${date}: ${Math.round(ml / 29.574)} oz (${ml} ml)`)
    .join('\n') || 'No water logs'

  const symptomSummary = (symptoms ?? []).map(s =>
    `${s.log_date} — ${s.symptom_type} severity ${s.severity}${s.notes ? ` (${s.notes})` : ''}`
  ).join('\n') || 'No symptoms logged'

  const bmSummary = (bms ?? []).map(b =>
    `${b.log_date} — Bristol type ${b.bristol_type}${b.urgency ? `, urgency ${b.urgency}` : ''}${b.pain ? `, pain ${b.pain}` : ''}`
  ).join('\n') || 'No BM logs'

  const mealSummary = (meals ?? []).map(m => {
    const foods = Array.isArray(m.ingredients)
      ? m.ingredients.map((f: any) => (typeof f === 'string' ? f : f.name ?? f.food_name ?? '')).filter(Boolean).join(', ')
      : ''
    const macros = m.calories ? ` [${m.calories} kcal, ${m.protein_g}g protein, ${m.carbs_g}g carbs, ${m.fat_g}g fat]` : ''
    return `${m.log_date} (${m.meal_type ?? 'meal'}) — ${m.meal_name}${foods ? `: ${foods}` : ''}${macros}`
  }).join('\n') || 'No meals logged'

  const weightSummary = (weights ?? [])
    .map(w => `${w.log_date}: ${w.weight_kg}kg`)
    .join(', ') || 'No weight logs'

  // Compute average daily water for the period
  const totalDaysWithWater = Object.keys(waterByDate).length
  const avgWaterOz = totalDaysWithWater > 0
    ? Math.round(Object.values(waterByDate).reduce((s, v) => s + v, 0) / totalDaysWithWater / 29.574)
    : 0
  const lowWaterDays = Object.entries(waterByDate).filter(([, ml]) => ml < 1000).map(([d]) => d)

  const prompt = `You are a gut health analyst. Analyze the following 30 days of patient data and return a JSON object with exactly two keys: "correlations" and "insights".

SYMPTOMS (date — type, severity 1-10):
${symptomSummary}

BOWEL MOVEMENTS (Bristol scale 1-7; type 1-2=constipation, 3-5=normal, 6-7=loose; urgency/pain 1-10):
${bmSummary}

MEALS EATEN (date — name: foods [macros]):
${mealSummary}

WATER INTAKE (daily total; goal is 64 oz / 1,893 ml per day):
${waterSummary}
Average: ${avgWaterOz} oz/day${lowWaterDays.length > 0 ? `\nLow-water days (<34 oz): ${lowWaterDays.join(', ')}` : ''}

WEIGHT (date: kg):
${weightSummary}

INSTRUCTIONS:
1. Cross-reference symptom dates with meal dates from 1-2 days prior to identify food triggers.
2. Cross-reference low water intake days with constipation (Bristol 1-2), bloating, or high-severity symptoms.
3. Look for patterns in BM consistency and urgency.
4. Identify any positive trends to reinforce.

Return ONLY this JSON structure, no other text:
{
  "correlations": [
    {
      "food_item": "name of food or category",
      "symptom_type": "bloating" | "gas" | "cramping" | "diarrhea" | "constipation" | "nausea" | "pain" | "fatigue",
      "correlation_score": 0.1 to 1.0,
      "occurrence_count": integer,
      "llm_synthesis": "1-2 sentence finding"
    }
  ],
  "insights": [
    {
      "insight_type": "positive" | "achievement" | "trend" | "correlation" | "weekly_summary",
      "title": "max 8 words",
      "body": "2-3 sentences with specific numbers or dates"
    }
  ]
}

Rules:
- "correlations": 1-6 items covering food AND hydration triggers (include a water/hydration correlation if low-water days coincide with symptoms).
- "insights": exactly 4-5 items. Use "positive" for improving trends. Use "achievement" for logging streaks or milestones. Use "trend" for concerning or neutral patterns. Use "weekly_summary" for one overall summary.
- Be specific: use actual dates, numbers, and food names from the data.
- If water intake is below 64 oz on days with symptoms, flag this as a correlation AND as a trend insight.`

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  console.log('[insights/analyze] raw response (first 600):', raw.slice(0, 600))

  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('[insights/analyze] JSON.parse failed:', e)
    return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }

  console.log('[insights/analyze] keys:', Object.keys(parsed))

  // Find correlations
  const correlations: any[] = (() => {
    if (Array.isArray(parsed.correlations)) return parsed.correlations
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val) && (val[0] as any)?.food_item) return val
    }
    return []
  })()

  // Find insights — try known key names, then scan for title+body arrays
  const insights: any[] = (() => {
    for (const key of ['insights', 'insight', 'key_insights', 'findings', 'analysis', 'observations', 'recommendations']) {
      const val = (parsed as any)[key]
      if (Array.isArray(val) && val.length > 0) {
        console.log('[insights/analyze] insights found under key:', key, 'count:', val.length)
        return val
      }
    }
    for (const [k, val] of Object.entries(parsed)) {
      if (k === 'correlations') continue
      if (Array.isArray(val) && val.length > 0 && (val[0] as any)?.title) {
        console.log('[insights/analyze] insights found by scan, key:', k, 'count:', val.length)
        return val as any[]
      }
    }
    console.warn('[insights/analyze] no insights array found. keys:', Object.keys(parsed))
    return []
  })()

  console.log('[insights/analyze] correlations:', correlations.length, 'insights:', insights.length)

  // Upsert correlations
  if (correlations.length > 0) {
    const { error: corrErr } = await supabase.from('correlations').upsert(
      correlations.map((c: any) => ({
        user_id:           user.id,
        food_item:         c.food_item,
        symptom_type:      c.symptom_type,
        correlation_score: Math.min(1, Math.max(0, Number(c.correlation_score) || 0.5)),
        occurrence_count:  c.occurrence_count ?? 0,
        observation_days:  30,
        llm_synthesis:     c.llm_synthesis,
        computed_at:       new Date().toISOString(),
      })),
      { onConflict: 'user_id,food_item,symptom_type' }
    )
    if (corrErr) console.error('[insights/analyze] correlations upsert error:', corrErr)
  }

  // Delete old auto insights, insert fresh ones
  await supabase.from('insights').delete()
    .eq('user_id', user.id).eq('review_status', 'auto')

  if (insights.length > 0) {
    // Sanitize insight_type to only allowed DB values
    const sanitized = insights
      .filter((ins: any) => ins.title && ins.body)
      .map((ins: any) => ({
        user_id:       user.id,
        insight_type:  ALLOWED_INSIGHT_TYPES.has(ins.insight_type) ? ins.insight_type : 'trend',
        title:         String(ins.title).slice(0, 120),
        body:          String(ins.body ?? ins.description ?? ins.text ?? ''),
        review_status: 'auto',
        dismissed:     false,
      }))

    const { error: insErr } = await supabase.from('insights').insert(sanitized)
    if (insErr) {
      console.error('[insights/analyze] insights insert error:', insErr)
    } else {
      console.log('[insights/analyze] inserted', sanitized.length, 'insights successfully')
    }
  }

  return NextResponse.json({ correlations, insights })
}
