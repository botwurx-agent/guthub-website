import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

export const runtime = 'edge'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { mealName, ingredients } = await req.json()
  if (!mealName?.trim()) return NextResponse.json({ error: 'Meal name required' }, { status: 400 })

  const ingredientText = ingredients?.trim()
    ? `\nIngredients:\n${ingredients.trim()}`
    : ''

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Respond with ONLY a JSON object, no markdown. Keys: calories, protein_g, carbs_g, fat_g (all integers).',
      },
      {
        role: 'user',
        content: `Macros for: ${mealName}${ingredientText}`,
      },
    ],
  })

  const raw = (completion.choices[0].message.content ?? '{}').replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw)

  return NextResponse.json({
    calories:  Math.round(parsed.calories  ?? 0),
    protein_g: Math.round(parsed.protein_g ?? 0),
    carbs_g:   Math.round(parsed.carbs_g   ?? 0),
    fat_g:     Math.round(parsed.fat_g     ?? 0),
  })
}
