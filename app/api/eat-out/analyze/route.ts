import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { restaurant, menuText, mode } = await req.json()
  if (!restaurant && !menuText) {
    return NextResponse.json({ error: 'Provide a restaurant name or menu text.' }, { status: 400 })
  }

  // Fetch user's trigger profile
  const [{ data: profile }, { data: correlations }, { data: allergyProfile }] = await Promise.all([
    supabase.from('profiles').select('health_profile').eq('id', user.id).single(),
    supabase.from('correlations')
      .select('food_item, symptom_type, correlation_score, llm_synthesis')
      .eq('user_id', user.id)
      .gte('correlation_score', 0.3)
      .order('correlation_score', { ascending: false })
      .limit(15),
    supabase.from('profiles').select('health_profile').eq('id', user.id).single(),
  ])

  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}
  const allergens = Array.isArray(hp.allergens) ? (hp.allergens as string[]).join(', ') : (hp.allergens as string | null) ?? 'none'
  const conditions = hp.medical_conditions as string | null
  const eatingStyle = Array.isArray(hp.eating_style)
    ? (hp.eating_style as string[]).join(', ')
    : (hp.eating_style as string | null) ?? 'no specific diet'

  const triggerLines = (correlations ?? [])
    .map(c => `- ${c.food_item} → ${c.symptom_type} (${Math.round(c.correlation_score * 100)}% correlation)`)
    .join('\n') || '- No correlations logged yet (use general gut-health caution)'

  const menuSection = mode === 'paste' && menuText
    ? `MENU (pasted by user):\n${menuText}`
    : `RESTAURANT: ${restaurant}\nUse your knowledge of this restaurant's typical menu items.`

  const prompt = `You are a gut health nutrition expert. A user with gut health issues is about to eat out. Analyze the menu and give personalized safe/caution/avoid recommendations based on their specific trigger history and dietary profile.

USER PROFILE:
- Known allergens: ${allergens}
- Medical conditions: ${conditions || 'none specified'}
- Eating style / diet: ${eatingStyle}
- Confirmed food triggers from their logged data:
${triggerLines}

${menuSection}

TASK:
1. Identify 3-6 SAFE menu items (unlikely to trigger symptoms based on their profile)
2. Identify 2-4 CAUTION items (possible triggers, but manageable with modifications)
3. Identify 2-4 AVOID items (high risk given their specific triggers)
4. Give 2-3 ORDERING TIPS specific to this restaurant/cuisine type

For each item include a brief reason tied to their personal triggers, not generic nutrition advice.
For CAUTION items, include a specific modification (e.g. "ask for no onion", "get sauce on the side").

If the user pasted a menu, only reference actual items from it.
If using restaurant knowledge, use realistic menu items from that specific restaurant.

Respond ONLY with this JSON structure:
{
  "restaurant_name": "string (clean name for display)",
  "cuisine_type": "string",
  "safe": [
    { "item": "string", "reason": "string", "calories_estimate": number | null }
  ],
  "caution": [
    { "item": "string", "reason": "string", "modification": "string" }
  ],
  "avoid": [
    { "item": "string", "reason": "string" }
  ],
  "tips": ["string", "string", "string"],
  "overall_verdict": "great" | "okay" | "tricky",
  "verdict_summary": "1 sentence summary of how gut-friendly this restaurant is for this user"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
