import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL_VISION } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { restaurant, imageBase64, imageMime, mode } = await req.json()
  if (mode === 'photo' && !imageBase64) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
  }
  if (mode === 'search' && !restaurant?.trim()) {
    return NextResponse.json({ error: 'Provide a restaurant name.' }, { status: 400 })
  }

  // Fetch user's trigger profile
  const [{ data: profile }, { data: correlations }] = await Promise.all([
    supabase.from('profiles').select('health_profile, diet_mode').eq('id', user.id).single(),
    supabase.from('correlations')
      .select('food_item, symptom_type, correlation_score, llm_synthesis')
      .eq('user_id', user.id)
      .gte('correlation_score', 0.3)
      .order('correlation_score', { ascending: false })
      .limit(15),
  ])

  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}
  const allergens = Array.isArray(hp.allergens)
    ? (hp.allergens as string[]).join(', ')
    : (hp.allergens as string | null) ?? 'none'
  const conditions = hp.medical_conditions as string | null
  const dietMode = profile?.diet_mode ?? 'default'
  const dietLabel = dietMode !== 'default' ? dietMode.replace(/_/g, ' ') : 'balanced (no specific diet restriction)'
  const eatingStyle = Array.isArray(hp.eating_style)
    ? (hp.eating_style as string[]).join(', ')
    : (hp.eating_style as string | null) ?? ''

  const triggerLines = (correlations ?? [])
    .map(c => `- ${c.food_item} → ${c.symptom_type} (${Math.round(c.correlation_score * 100)}% correlation)`)
    .join('\n') || '- No correlations logged yet (use general gut-health caution)'

  const systemPrompt = `You are a gut health nutrition expert. A user with gut health issues wants personalized menu recommendations based on their specific trigger history.

USER PROFILE:
- Primary diet: ${dietLabel}${eatingStyle ? `\n- Eating preferences: ${eatingStyle}` : ''}
- Known allergens / must avoid: ${allergens || 'none'}
- Medical conditions: ${conditions || 'none specified'}
- Confirmed food triggers from their logged data:
${triggerLines}

IMPORTANT: Filter ALL recommendations through the user's primary diet first. A keto user must not receive high-carb items as "safe". A low-FODMAP user must not receive high-FODMAP items. A vegan user must not receive animal products. Apply diet rules strictly before applying trigger history.

TASK:
1. Identify 3-6 SAFE menu items (unlikely to trigger symptoms)
2. Identify 2-4 CAUTION items (possible triggers, manageable with modifications)
3. Identify 2-4 AVOID items (high risk given their specific triggers)
4. Give 2-3 ORDERING TIPS specific to this restaurant/cuisine

For each item include a brief reason tied to their personal triggers, not generic nutrition advice.
For CAUTION items include a specific modification (e.g. "ask for no onion", "get sauce on the side").

Respond ONLY with this JSON structure:
{
  "restaurant_name": "string (infer from menu/context or use what's provided)",
  "cuisine_type": "string",
  "safe": [{ "item": "string", "reason": "string", "calories_estimate": number | null }],
  "caution": [{ "item": "string", "reason": "string", "modification": "string" }],
  "avoid": [{ "item": "string", "reason": "string" }],
  "tips": ["string", "string"],
  "overall_verdict": "great" | "okay" | "tricky",
  "verdict_summary": "1 sentence summary of how gut-friendly this restaurant is for this user"
}`

  try {
    let messages: OpenAI.Chat.ChatCompletionMessageParam[]

    if (mode === 'photo') {
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${imageMime ?? 'image/jpeg'};base64,${imageBase64}`, detail: 'high' },
          },
          {
            type: 'text',
            text: `This is a photo of a restaurant menu${restaurant ? ` from ${restaurant}` : ''}. Read every item visible in the image and provide personalized recommendations based on my gut health profile above.`,
          },
        ],
      }]
    } else {
      messages = [{
        role: 'user',
        content: `Restaurant: ${restaurant}. Use your knowledge of this restaurant's typical menu to provide personalized recommendations.`,
      }]
    }

    const completion = await openai.chat.completions.create({
      model: AI_MODEL_VISION,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
