import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { mealName, ingredients } = await req.json()
  if (!mealName?.trim()) return NextResponse.json({ error: 'Meal name required' }, { status: 400 })

  const ingredientText = ingredients?.trim()
    ? `\nIngredients:\n${ingredients.trim()}`
    : ''

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a registered dietitian estimating meal nutrition. Respond only with a JSON object containing these keys: calories (kcal, integer), protein_g (grams, integer), carbs_g (grams, integer), fat_g (grams, integer). Be realistic — use standard portion sizes if not specified.',
      },
      {
        role: 'user',
        content: `Estimate the macros for this meal:\n${mealName}${ingredientText}`,
      },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw)

  return NextResponse.json({
    calories:  Math.round(parsed.calories  ?? 0),
    protein_g: Math.round(parsed.protein_g ?? 0),
    carbs_g:   Math.round(parsed.carbs_g   ?? 0),
    fat_g:     Math.round(parsed.fat_g     ?? 0),
  })
}
