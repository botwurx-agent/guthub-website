import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_MODEL_VISION } from '@/lib/ai-config'

export const runtime = 'edge'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { imageBase64, imageType } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const completion = await openai.chat.completions.create({
    model: AI_MODEL_VISION,
    reasoning_effort: 'minimal',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a registered dietitian. Analyze this meal photo and respond with ONLY a raw JSON object, no markdown. Keys: meal_name (string, concise), calories (integer), protein_g (integer), carbs_g (integer), fat_g (integer). Estimate a realistic single-serving portion.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${imageType ?? 'image/jpeg'};base64,${imageBase64}` },
          },
        ],
      },
    ],
  })

  const raw = (completion.choices[0].message.content ?? '{}').replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw)

  return NextResponse.json({
    meal_name:  parsed.meal_name  ?? 'Unknown meal',
    calories:   Math.round(parsed.calories  ?? 0),
    protein_g:  Math.round(parsed.protein_g ?? 0),
    carbs_g:    Math.round(parsed.carbs_g   ?? 0),
    fat_g:      Math.round(parsed.fat_g     ?? 0),
  })
}
