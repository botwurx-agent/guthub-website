import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL, TEMP } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [
    { data: gutScores },
    { data: symptoms },
    { data: bms },
    { data: meals },
    { data: weights },
  ] = await Promise.all([
    supabase.from('gut_scores').select('score_date, score').eq('user_id', user.id).gte('score_date', since).order('score_date'),
    supabase.from('symptom_logs').select('log_date, symptom_type, severity, notes').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('bm_logs').select('log_date, bristol_type, urgency, pain').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('meal_logs').select('log_date, meal_name, food_items').eq('user_id', user.id).gte('log_date', since).order('log_date'),
    supabase.from('weight_logs').select('log_date, weight_kg').eq('user_id', user.id).gte('log_date', since).order('log_date'),
  ])

  const hasSufficientData = (symptoms?.length ?? 0) + (meals?.length ?? 0) >= 3

  if (!hasSufficientData) {
    return NextResponse.json({ error: 'insufficient_data' }, { status: 422 })
  }

  // Summarize for the prompt
  const gutScoreSummary = (gutScores ?? []).map(g => `${g.score_date}: ${Math.round(g.score)}`).join(', ')

  const symptomSummary = (symptoms ?? []).map(s =>
    `${s.log_date} — ${s.symptom_type} severity ${s.severity}${s.notes ? ` (${s.notes})` : ''}`
  ).join('\n')

  const bmSummary = (bms ?? []).map(b =>
    `${b.log_date} — Bristol type ${b.bristol_type}${b.urgency ? `, urgency ${b.urgency}` : ''}${b.pain ? `, pain ${b.pain}` : ''}`
  ).join('\n')

  const mealSummary = (meals ?? []).map(m => {
    const foods = Array.isArray(m.food_items)
      ? m.food_items.map((f: any) => (typeof f === 'string' ? f : f.name ?? f.food_name ?? '')).filter(Boolean).join(', ')
      : ''
    return `${m.log_date} — ${m.meal_name}${foods ? `: ${foods}` : ''}`
  }).join('\n')

  const weightSummary = (weights ?? []).map(w => `${w.log_date}: ${w.weight_kg}kg`).join(', ')

  const prompt = `Analyze 30 days of gut health data and identify patterns.

GUT SCORES (date: score):
${gutScoreSummary || 'No data'}

SYMPTOMS (date — type, severity 1-10):
${symptomSummary || 'No symptoms logged'}

BOWEL MOVEMENTS (Bristol scale 1-7, urgency/pain 1-10):
${bmSummary || 'No BM logs'}

MEALS EATEN (date — name: foods):
${mealSummary || 'No meals logged'}

WEIGHT (date: kg):
${weightSummary || 'No weight logs'}

Based on this data, identify:
1. Food-symptom correlations: which specific foods or food categories appear to precede symptoms
2. Key trends in gut score, weight, or symptom frequency
3. Observations about BM patterns or consistency
4. Any positive patterns worth reinforcing

Return JSON:
{
  "correlations": [
    {
      "food_item": "dairy" | specific food,
      "symptom_type": "bloating" | "gas" | "cramping" | "diarrhea" | "constipation" | "nausea" | "pain" | "fatigue",
      "correlation_score": 0.1-1.0,
      "occurrence_count": integer,
      "llm_synthesis": "1-2 sentence plain-English finding"
    }
  ],
  "insights": [
    {
      "insight_type": "correlation" | "trend" | "weekly_summary",
      "title": "short title (max 8 words)",
      "body": "2-3 sentence explanation with specific numbers or dates when possible"
    }
  ]
}

If data is insufficient for a meaningful correlation, omit it. Return 1-5 correlations and 2-4 insights. Be specific and actionable.`

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: TEMP.analysis,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const { correlations = [], insights = [] } = JSON.parse(raw)

  // Upsert correlations
  if (correlations.length > 0) {
    await supabase.from('correlations').upsert(
      correlations.map((c: any) => ({
        user_id:           user.id,
        food_item:         c.food_item,
        symptom_type:      c.symptom_type,
        correlation_score: c.correlation_score,
        occurrence_count:  c.occurrence_count ?? 0,
        observation_days:  30,
        llm_synthesis:     c.llm_synthesis,
        computed_at:       new Date().toISOString(),
      })),
      { onConflict: 'user_id,food_item,symptom_type' }
    )
  }

  // Insert insights (delete old auto ones first to avoid clutter)
  await supabase.from('insights').delete()
    .eq('user_id', user.id).eq('review_status', 'auto').eq('dismissed', false)

  if (insights.length > 0) {
    await supabase.from('insights').insert(
      insights.map((ins: any) => ({
        user_id:      user.id,
        insight_type: ins.insight_type,
        title:        ins.title,
        body:         ins.body,
        review_status: 'auto',
      }))
    )
  }

  return NextResponse.json({ correlations, insights })
}
