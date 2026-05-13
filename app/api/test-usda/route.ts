import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

// Temporary test route — compare AI-only vs USDA+AI macro estimation
// DELETE after testing

const USDA_API_KEY = 'DEMO_KEY'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function queryUSDA(query: string) {
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}&pageSize=1&dataType=SR+Legacy,Foundation`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const food = data.foods?.[0]
    if (!food) return null

    const nutrients = Object.fromEntries(
      (food.foodNutrients ?? []).map((n: { nutrientName: string; value: number }) => [n.nutrientName, n.value])
    )

    return {
      name: food.description,
      per100g: {
        calories:  Math.round(nutrients['Energy'] ?? 0),
        protein_g: Math.round(nutrients['Protein'] ?? 0),
        carbs_g:   Math.round(nutrients['Carbohydrate, by difference'] ?? 0),
        fat_g:     Math.round(nutrients['Total lipid (fat)'] ?? 0),
      }
    }
  } catch {
    return null
  }
}

async function testMeal(mealName: string) {
  // --- AI only ---
  const aiStart = Date.now()
  const aiCompletion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: 'Respond with ONLY a JSON object, no markdown. Keys: calories, protein_g, carbs_g, fat_g (all integers). Assume a standard single serving.' },
      { role: 'user', content: `Macros for: ${mealName}` },
    ],
  })
  const aiRaw = (aiCompletion.choices[0].message.content ?? '{}').replace(/```json|```/g, '').trim()
  const aiParsed = JSON.parse(aiRaw)
  const aiMs = Date.now() - aiStart

  // --- USDA lookup ---
  const usdaStart = Date.now()
  const usdaData = await queryUSDA(mealName)
  const usdaMs = Date.now() - usdaStart

  // --- USDA + AI ---
  let usdaAiMs = 0
  let usdaAiParsed = null
  if (usdaData) {
    const usdaAiStart = Date.now()
    const context = `USDA database: "${usdaData.name}" per 100g = ${usdaData.per100g.calories} kcal, ${usdaData.per100g.protein_g}g protein, ${usdaData.per100g.carbs_g}g carbs, ${usdaData.per100g.fat_g}g fat. Scale to a realistic serving size for the meal described.`
    const usdaAiCompletion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'Respond with ONLY a JSON object, no markdown. Keys: calories, protein_g, carbs_g, fat_g (all integers). Use the USDA data provided, scaled to a realistic serving size.' },
        { role: 'user', content: `Macros for: ${mealName}\n\n${context}` },
      ],
    })
    const usdaAiRaw = (usdaAiCompletion.choices[0].message.content ?? '{}').replace(/```json|```/g, '').trim()
    usdaAiParsed = JSON.parse(usdaAiRaw)
    usdaAiMs = Date.now() - usdaAiStart
  }

  return {
    meal: mealName,
    aiOnly: {
      ms: aiMs,
      calories:  Math.round(aiParsed.calories  ?? 0),
      protein_g: Math.round(aiParsed.protein_g ?? 0),
      carbs_g:   Math.round(aiParsed.carbs_g   ?? 0),
      fat_g:     Math.round(aiParsed.fat_g     ?? 0),
    },
    usda: {
      ms: usdaMs,
      match: usdaData?.name ?? 'No match',
      per100g: usdaData?.per100g ?? null,
    },
    usdaPlusAI: usdaAiParsed ? {
      ms: usdaMs + usdaAiMs,
      calories:  Math.round(usdaAiParsed.calories  ?? 0),
      protein_g: Math.round(usdaAiParsed.protein_g ?? 0),
      carbs_g:   Math.round(usdaAiParsed.carbs_g   ?? 0),
      fat_g:     Math.round(usdaAiParsed.fat_g     ?? 0),
    } : { ms: usdaMs, note: 'No USDA match — AI-only fallback would be used' },
  }
}

export async function GET(req: NextRequest) {
  const meals = [
    'grilled chicken breast',
    'white rice 1 cup cooked',
    'banana medium',
    'avocado toast with poached egg',
    'jollof rice with fried plantain',  // complex/regional — tests fallback
  ]

  // Run sequentially to avoid rate limits
  const results = []
  for (const meal of meals) {
    results.push(await testMeal(meal))
  }

  return NextResponse.json(results, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
