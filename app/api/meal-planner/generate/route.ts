import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    weekStart,
    regenerate,
    days = 7,
    dietOverride,
    mealTypes: mealTypesFilter,     // e.g. ['breakfast'] for parallel requests
    phase = 'quick',                 // 'quick' = name+macros only | 'recipe' = ingredients+directions
    existingMeal,                    // { name, date, meal_type } for recipe-only fetch
    complexity = 'simple',           // 'simple' = weeknight friendly | 'weekend' = ambitious dishes
  } = await request.json()

  const [{ data: profile }, { data: macroTarget }, { data: labReports }] = await Promise.all([
    supabase.from('profiles').select('diet_mode, health_profile').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('lab_reports').select('filename, analysis_summary').eq('user_id', user.id).not('analysis_summary', 'is', null).order('created_at', { ascending: false }).limit(3),
  ])

  const calories = macroTarget?.total_calories ?? 2000
  const protein  = macroTarget?.protein_g ?? 150
  const carbs    = macroTarget?.carbohydrates_g ?? 200
  const fat      = macroTarget?.fat_g ?? 65

  const hp           = profile?.health_profile ?? {}
  const allergies    = hp.allergies ?? hp.allergens ?? hp.food_allergies ?? ''
  const conditions   = hp.conditions ?? hp.health_conditions ?? hp.medical_conditions ?? ''
  const eatingStyle  = hp.eating_style ?? ''
  const resolvedDiet = dietOverride ?? profile?.diet_mode ?? 'default'
  const dietLabel    = resolvedDiet !== 'default' ? resolvedDiet.replace(/_/g, ' ') : (eatingStyle || 'balanced')
  const labContext   = labReports?.length
    ? '\n\nLAB RESULTS (advisory context only — do NOT use these to narrow food variety or override the diversity rules below):\n' + labReports.map(r => `${r.filename}: ${r.analysis_summary}`).join('\n\n')
    : ''

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: string) =>
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      // ── Phase: recipe ─────────────────────────────────────────────────────
      // Given an existing meal name, generate just ingredients + directions
      if (phase === 'recipe' && existingMeal) {
        const { name, date, meal_type } = existingMeal
        const mealCalories = macroTarget
          ? Math.round(meal_type === 'breakfast' ? calories * 0.25 : meal_type === 'lunch' ? calories * 0.35 : calories * 0.40)
          : null

        const recipePrompt = `Generate a practical, delicious recipe for: "${name}"

Context: ${meal_type} | ${dietLabel} diet${mealCalories ? ` | ~${mealCalories} kcal` : ''}
${allergies ? `Avoid: ${allergies}` : ''}

Requirements:
- Ingredients with specific quantities (e.g. "2 tbsp olive oil", "150g chicken thigh")
- Directions in 4-6 clear steps — practical, not overly technical
- Total should hit the calorie target roughly
- Gut-friendly preparation (avoid deep frying, heavy cream sauces unless the diet allows)

Return a single JSON object only — no markdown:
{
  "date": "${date}",
  "meal_type": "${meal_type}",
  "meal_name": "${name}",
  "ingredients": ["quantity + ingredient", ...],
  "directions": "Step 1. ... Step 2. ..."
}`

        try {
          const stream = await openai.chat.completions.create({
            model: AI_MODEL,
            stream: true,
            messages: [{ role: 'user', content: recipePrompt }],
          })

          let accumulated = ''
          let depth = 0, inString = false, escaped = false, objStart = -1

          const processChar = async (ch: string, idx: number) => {
            if (escaped) { escaped = false; return }
            if (ch === '\\' && inString) { escaped = true; return }
            if (ch === '"') { inString = !inString; return }
            if (inString) return
            if (ch === '{') { if (depth === 0) objStart = idx; depth++ }
            else if (ch === '}') {
              depth--
              if (depth === 0 && objStart >= 0) {
                const candidate = accumulated.slice(objStart, idx + 1)
                objStart = -1
                try {
                  const parsed = JSON.parse(candidate)
                  if (parsed.ingredients || parsed.directions) {
                    // Upsert only the recipe fields
                    await supabase.from('meal_plan_slots')
                      .update({
                        ingredients: parsed.ingredients ?? [],
                        directions: parsed.directions ?? '',
                      })
                      .eq('user_id', user.id)
                      .eq('plan_date', date)
                      .eq('meal_type', meal_type)
                    send(JSON.stringify({ ...parsed, plan_date: date }))
                  }
                } catch { /* skip */ }
              }
            }
          }

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            const prevLen = accumulated.length
            accumulated += delta
            for (let i = prevLen; i < accumulated.length; i++) await processChar(accumulated[i], i)
          }
        } catch (err) {
          send(JSON.stringify({ error: String(err) }))
        }

        send('[DONE]')
        controller.close()
        return
      }

      // ── Phase: quick ──────────────────────────────────────────────────────
      // Generate meal names + macros only (no ingredients or directions)
      const allMealTypes = ['breakfast', 'lunch', 'dinner']
      const activeMealTypes = mealTypesFilter ?? allMealTypes

      const slots: { date: string; meal_type: string }[] = []
      if (regenerate) {
        slots.push({ date: regenerate.date, meal_type: regenerate.mealType })
      } else {
        const numDays = Math.min(Math.max(Number(days) || 7, 1), 7)
        for (let i = 0; i < numDays; i++) {
          const d = new Date(weekStart)
          d.setUTCDate(d.getUTCDate() + i)
          const dateStr = d.toISOString().split('T')[0]
          for (const mt of activeMealTypes) slots.push({ date: dateStr, meal_type: mt })
        }
      }

      // For single-slot swaps, fetch the rest of the week so the AI can avoid repeating proteins/cuisines
      let existingWeekMeals: string[] = []
      if (regenerate && weekStart) {
        const weekEnd = new Date(weekStart)
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
        const { data: weekMeals } = await supabase
          .from('meal_plan_slots')
          .select('meal_name, meal_type, plan_date')
          .eq('user_id', user.id)
          .gte('plan_date', weekStart)
          .lte('plan_date', weekEnd.toISOString().split('T')[0])
          .neq('plan_date', regenerate.date)
        existingWeekMeals = (weekMeals ?? []).map(m => `${m.plan_date} ${m.meal_type}: ${m.meal_name}`)
      }

      // Cuisine + method rotation for dinner single-slot swaps
      const DINNER_CUISINES = [
        'Italian', 'Mexican', 'Japanese', 'Thai', 'Indian', 'Middle Eastern',
        'Greek', 'Vietnamese', 'Korean', 'Moroccan', 'Spanish', 'Caribbean',
        'French bistro', 'American comfort (elevated)', 'Ethiopian', 'Turkish',
        'Peruvian', 'Lebanese', 'Malaysian', 'Portuguese',
      ]
      const SIMPLE_METHODS   = ['baked', 'grilled', 'sautéed', 'stir-fried', 'roasted', 'broiled']
      const WEEKEND_METHODS  = ['slow-braised', 'slow-roasted', 'poached', 'roasted', 'grilled', 'baked', 'broiled']

      const isDinnerOnly = slots.every(s => s.meal_type === 'dinner')
      const randomCuisine = (regenerate && isDinnerOnly)
        ? DINNER_CUISINES[Math.floor(Math.random() * DINNER_CUISINES.length)]
        : null
      const methodPool = complexity === 'weekend' ? WEEKEND_METHODS : SIMPLE_METHODS
      const randomMethod = (regenerate && isDinnerOnly)
        ? methodPool[Math.floor(Math.random() * methodPool.length)]
        : null

      // Split slots by meal type for tailored instructions
      const breakfastLunchSlots = slots.filter(s => s.meal_type !== 'dinner')
      const dinnerSlots = slots.filter(s => s.meal_type === 'dinner')

      const commonProfile = `USER PROFILE:
- Diet style: ${dietLabel}
- Daily targets: ${calories} kcal | Protein ${protein}g | Carbs ${carbs}g | Fat ${fat}g
- Macro split: breakfast 25% · lunch 35% · dinner 40% of daily targets
${allergies ? `- Allergies / avoid: ${allergies}` : ''}
${conditions ? `- Health conditions: ${conditions}` : ''}${labContext}`

      const ketoMode        = resolvedDiet === 'keto'      || dietLabel.toLowerCase().includes('keto')
      const veganMode       = resolvedDiet === 'vegan'      || dietLabel.toLowerCase().includes('vegan')
      const vegetarianMode  = veganMode                     || dietLabel.toLowerCase().includes('vegetarian')
      const pescatarianMode = dietLabel.toLowerCase().includes('pescatarian')
      const paleoMode       = resolvedDiet === 'paleo'      || dietLabel.toLowerCase().includes('paleo')
      const lowFodmapMode   = resolvedDiet === 'low_fodmap' || dietLabel.toLowerCase().includes('fodmap')

      // ── Per-diet protein + carb lists ─────────────────────────────────────
      let commonProteins: string
      let dinnerExtraProteins: string
      if (veganMode) {
        commonProteins      = `tofu, tempeh, lentils, chickpeas, black beans, edamame`
        dinnerExtraProteins = `, seitan, white beans`
      } else if (vegetarianMode) {
        commonProteins      = `eggs, Greek yogurt, cottage cheese, tofu, tempeh, lentils, chickpeas`
        dinnerExtraProteins = `, black beans, halloumi, paneer`
      } else if (pescatarianMode) {
        commonProteins      = `fish (cod, tilapia, or salmon), shrimp, eggs, tofu`
        dinnerExtraProteins = `, tuna, crab, scallops`
      } else if (paleoMode) {
        commonProteins      = `chicken breast, chicken thighs, steak, ground beef, ground turkey, pork chops, fish (cod, tilapia, or similar)`
        dinnerExtraProteins = `, lamb, shrimp, venison`
      } else {
        commonProteins      = `chicken breast, chicken thighs, steak, fish (cod, tilapia, or similar), ground beef, ground turkey, ground chicken, pork chops`
        dinnerExtraProteins = `, lamb, shrimp, lentils, chickpeas`
      }

      let commonGrains: string
      let dinnerExtraGrains: string
      if (ketoMode) {
        commonGrains      = `zucchini noodles, spaghetti squash, roasted broccoli and peppers, roasted asparagus and mushrooms, sautéed spinach and zucchini, shirataki noodles`
        dinnerExtraGrains = `, cauliflower mash, roasted cabbage`
      } else if (paleoMode) {
        commonGrains      = `sweet potato, butternut squash, roasted root vegetables, plantain`
        dinnerExtraGrains = `, spaghetti squash, roasted beets`
      } else if (lowFodmapMode) {
        commonGrains      = `white rice, quinoa, gluten-free oats, potatoes, gluten-free pasta`
        dinnerExtraGrains = `, polenta, rice noodles`
      } else {
        commonGrains      = `rice, pasta, bread/toast, potatoes, oats, corn tortillas, noodles`
        dinnerExtraGrains = `, couscous, farro, barley, quinoa`
      }

      // ── Per-diet rule blocks (injected prominently into prompt) ───────────
      const ketoRule = ketoMode
        ? `KETO STRICT: All meals must be low-carb/high-fat. NO rice, pasta, bread, oats, corn, beans, lentils, potatoes, tortillas, or any grain. Use cauliflower rice, zucchini noodles, lettuce wraps, or serve without a carb base. Prioritize: meat, fish, eggs, cheese, non-starchy vegetables (broccoli, spinach, zucchini, green beans, asparagus, mushrooms, peppers), healthy fats (olive oil, butter, avocado).`
        : ''

      const veganRule = veganMode
        ? `VEGAN STRICT: Absolutely NO meat, poultry, fish, seafood, dairy, eggs, honey, or any animal product. Every meal must be 100% plant-based. Proteins: tofu, tempeh, seitan, legumes (lentils, chickpeas, black beans, edamame). No butter, cheese, or yogurt — use olive oil, coconut milk, oat milk, or plant-based alternatives only.`
        : ''

      const vegetarianRule = (!veganMode && vegetarianMode)
        ? `VEGETARIAN STRICT: NO meat, poultry, fish, or seafood of any kind. Eggs and dairy are allowed. Proteins: eggs, Greek yogurt, cottage cheese, tofu, tempeh, lentils, chickpeas, black beans, halloumi, paneer.`
        : ''

      const pescatarianRule = pescatarianMode
        ? `PESCATARIAN STRICT: NO beef, pork, chicken, turkey, lamb, duck, game, or any land animal meat. Fish and seafood are fully allowed. Proteins: fish (cod, tilapia, salmon, tuna), shrimp, crab, scallops, eggs, tofu. Do NOT generate any meal with chicken, steak, ground beef, ground turkey, pork chops, or similar.`
        : ''

      const paleoRule = paleoMode
        ? `PALEO STRICT: NO grains (no rice, pasta, bread, oats, corn, quinoa, tortillas), NO legumes (no beans, lentils, chickpeas, peanuts), NO dairy (no cheese, milk, yogurt, butter — use ghee or coconut oil). No processed foods. Use sweet potato, butternut squash, or roasted vegetables as the carb base. Any unprocessed meat, poultry, fish, eggs, nuts, and seeds are fine.`
        : ''

      const lowFodmapRule = lowFodmapMode
        ? `LOW-FODMAP STRICT: Avoid all high-FODMAP ingredients. NO garlic or onion (garlic-infused oil is safe), NO wheat, rye, or barley, NO apples, pears, mangoes, peaches, or stone fruits, NO regular lentils or chickpeas (small portions of canned well-rinsed chickpeas only), NO lactose (use hard cheeses like cheddar/parmesan, or lactose-free dairy). Safe starches: white rice, potatoes, gluten-free oats, quinoa. Safe proteins: chicken, beef, pork, fish, eggs, firm tofu. Safe vegetables: carrots, zucchini, bell peppers, spinach, kale, green beans, bok choy, tomatoes, cucumber.`
        : ''

      const dietRules = [ketoRule, veganRule, vegetarianRule, pescatarianRule, paleoRule, lowFodmapRule].filter(Boolean).join('\n\n')

      // ── Diet-aware breakfast/lunch hints ─────────────────────────────────
      let breakfastHint: string
      let lunchHint: string
      if (ketoMode) {
        breakfastHint = 'Keto breakfast formats — pick a DIFFERENT FORMAT each day, never the same format twice: (1) Scrambled eggs with cheese and sautéed spinach, (2) Bacon and fried eggs, (3) Greek yogurt (full-fat) with mixed nuts and a few berries, (4) Smoked salmon with cucumber slices and cream cheese, (5) Cottage cheese with walnuts and cinnamon, (6) Cheese and turkey roll-ups with sliced bell pepper, (7) Soft-boiled eggs with sautéed mushrooms. NO boiled/hard-boiled eggs + avocado — this is too boring and repetitive.'
        lunchHint     = 'Keto lunches — VARY the format every day: (1) Tuna or chicken lettuce wraps, (2) Egg salad stuffed into bell pepper halves, (3) Grilled chicken Caesar salad (no croutons), (4) Zucchini noodle soup with ground turkey, (5) Steak salad with mixed greens and olive oil, (6) BLT salad (bacon, tomato, lettuce, avocado), (7) Shrimp and avocado salad. NO cauliflower rice at lunch — use salad greens, lettuce cups, or vegetables as the base instead.'
      } else if (veganMode) {
        breakfastHint = 'Vegan breakfasts (simple): oatmeal with banana, avocado toast, chia pudding, smoothie, peanut butter toast, granola with plant milk. Each meal = one or two components MAX.'
        lunchHint     = 'Vegan lunches: lentil soup, grain bowl with roasted vegetables and chickpeas, vegetable wrap, black bean salad.'
      } else if (vegetarianMode) {
        breakfastHint = 'Vegetarian breakfasts (simple): scrambled eggs on toast, fried egg and avocado, oatmeal with fruit, yogurt parfait, smoothie. Each meal = one protein + one or two simple sides MAX.'
        lunchHint     = 'Vegetarian lunches: caprese salad, egg salad sandwich, lentil soup, grilled cheese, veggie wrap.'
      } else if (pescatarianMode) {
        breakfastHint = 'Breakfasts (simple): scrambled eggs on toast, fried egg with avocado, yogurt parfait, oatmeal, smoked salmon on toast (just salmon + toast, nothing else added). Each meal = one or two components MAX.'
        lunchHint     = 'Pescatarian lunches: tuna salad sandwich, salmon wrap, shrimp salad, fish tacos.'
      } else if (paleoMode) {
        breakfastHint = 'Paleo breakfasts (simple): scrambled eggs, fried eggs with bacon, sweet potato hash with egg, fruit bowl with nuts. Each meal = one protein + one or two simple sides MAX.'
        lunchHint     = 'Paleo lunches: large salad with grilled chicken, lettuce-wrap burger, chicken and vegetable soup.'
      } else if (lowFodmapMode) {
        breakfastHint = 'Low-FODMAP breakfasts (simple): scrambled eggs on gluten-free toast, rice cakes with peanut butter, gluten-free oats with banana. Each meal = one or two components MAX.'
        lunchHint     = 'Low-FODMAP lunches: grilled chicken salad (no croutons), rice bowl, gluten-free sandwich.'
      } else {
        breakfastHint = 'Common breakfasts (simple): scrambled eggs on toast, fried egg with avocado, oatmeal with fruit, yogurt parfait, smoothie, pancakes, avocado toast with egg. Each meal = one or two components MAX.'
        lunchHint     = 'Common lunches: sandwich, wrap, soup, simple salad with protein, quesadilla, grilled cheese, tuna melt.'
      }

      const plainLanguageRule = `PLAIN ENGLISH ONLY: Write ingredient names that any home cook would recognize. Never use French culinary terms or restaurant jargon. Examples: say "green beans" not "haricots verts", "pan sauce" not "jus", "mashed cauliflower" not "cauliflower purée", "pepper-crusted" not "au poivre". If a technique sounds fancy, simplify it.`

      // Separate breakfast and lunch slots
      const breakfastSlots = breakfastLunchSlots.filter(s => s.meal_type === 'breakfast')
      const lunchSlots     = breakfastLunchSlots.filter(s => s.meal_type === 'lunch')

      // Global variety caps (applied across ALL meal types for the full week)
      const globalVarietyRules = ketoMode
        ? `GLOBAL VARIETY RULES — enforced across EVERY meal for the entire week (breakfast + lunch + dinner combined):
- AVOCADO: use at most 3 times total across the whole week. Do NOT put avocado in every meal.
- CAULIFLOWER RICE: use at most ONCE across the whole week (dinner only). All other meals use different vegetable bases.
- EGGS: may appear at breakfast daily, but each egg FORMAT must be different (scrambled, fried, soft-boiled, omelette — not the same style twice).
- Any single protein (chicken breast, chicken thighs, steak, ground beef, etc.): at most TWICE across the whole week.
- Any single cooking method (pan-seared, baked, grilled, boiled, etc.): at most 3 times across the whole week. Vary cooking methods.
- ZERO duplicate meals: every meal name across the entire week must be completely unique.
- Lab results provide dietary context only — they do NOT override these variety requirements.`
        : `GLOBAL VARIETY RULES — enforced across EVERY meal for the entire week (breakfast + lunch + dinner combined):
- Any single protein: at most TWICE across the whole week.
- Avocado, sweet potato, quinoa: at most 3 times each across the whole week.
- Any cooking method: at most 3 times across the whole week. Vary methods.
- ZERO duplicate meals: every meal name must be completely unique.
- Lab results provide dietary context only — they do NOT override these variety requirements.`

      const breakfastBlock = breakfastSlots.length > 0 ? `
=== BREAKFAST MEALS ===
BREAKFAST RULE: Always FAST and SIMPLE — under 15 minutes, minimal prep, 2-3 components maximum. No complex combos.
- Each breakfast MUST use a completely different FORMAT from the others (e.g. one scrambled eggs, one yogurt, one bacon, one smoked salmon — never the same format twice).
- No restaurant-style multi-component builds.
- No lunch/dinner carb bases at breakfast (no cauliflower rice, no grain bowls, no zucchini noodles).
- ${breakfastHint}

Slots:
${breakfastSlots.map(s => `- ${s.date} ${s.meal_type}`).join('\n')}` : ''

      const lunchBlock = lunchSlots.length > 0 ? `
=== LUNCH MEALS ===
Quick and familiar — something a busy person can make or assemble in under 20 minutes.
- Each lunch must be a completely different dish and format from the others.
- ${lunchHint}
- Rotate proteins: each protein from [${commonProteins}] used AT MOST ONCE across all lunches.
- Be specific: "Tuna Salad Lettuce Wraps with Cucumber and Red Onion" not just "Tuna Wrap".

Slots:
${lunchSlots.map(s => `- ${s.date} ${s.meal_type}`).join('\n')}` : ''

      const complexityNote = complexity === 'simple'
        ? `COMPLEXITY — Quick & Easy: Under 30 minutes, one or two pans, common grocery store ingredients, no specialist equipment, no multi-step sauces.`
        : `COMPLEXITY — Weekend Cook: More ambitious dishes welcome. Longer cook times, marinating, multiple components, interesting techniques.`

      const dinnerBlock = dinnerSlots.length > 0 ? `
=== DINNER MEALS ===
${complexityNote}
${randomCuisine ? `THIS DINNER MUST BE: ${randomCuisine} cuisine, primary cooking method: ${randomMethod}. Do not deviate.` : 'Draw from varied world cuisine traditions — Italian, Mexican, Indian, Middle Eastern, Greek, Korean, etc. Each dinner should feel like a different country or region.'}
- Each protein AT MOST ONCE. Rotate from: ${commonProteins}${dinnerExtraProteins}.
- Carb/vegetable base: rotate through all available options [${commonGrains}${dinnerExtraGrains}] — never use the same base twice in a row.
- NO generic "bowls". Be specific: "Baked Lemon Herb Chicken Thighs with Roasted Potatoes and Green Beans" not "Chicken Bowl".
- Appetizing, specific names that include the cooking method and key flavors — in plain English.

Slots:
${dinnerSlots.map(s => `- ${s.date} ${s.meal_type}`).join('\n')}` : ''

      const prompt = `You are a gut-health nutrition planner. Generate a varied, delicious week of meals tailored to the user's profile.

${commonProfile}

${dietRules}

${globalVarietyRules}

${plainLanguageRule}

GUT-HEALTH REQUIREMENTS (all meals):
- Anti-inflammatory ingredients throughout the week
- Diverse fiber from different plant foods — not the same vegetables daily
- Avoid known gut irritants unless diet allows
- Whole, minimally processed ingredients

${existingWeekMeals.length > 0 ? `ALREADY PLANNED THIS WEEK — do NOT repeat these proteins, grains, or cuisines:
${existingWeekMeals.join('\n')}
` : ''}
${breakfastBlock}
${lunchBlock}
${dinnerBlock}

Return a JSON array only — no markdown, no explanation. Each object:
{"date":"YYYY-MM-DD","meal_type":"breakfast|lunch|dinner","meal_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}`

      const saveMeal = async (meal: Record<string, unknown>) => {
        const row = {
          user_id:     user.id,
          plan_date:   meal.date as string,
          meal_type:   meal.meal_type as string,
          meal_name:   meal.meal_name as string,
          ingredients: [],
          directions:  '',
          calories:    meal.calories as number,
          protein_g:   meal.protein_g as number,
          fat_g:       meal.fat_g as number,
          carbs_g:     meal.carbs_g as number,
          accepted:    false,
        }
        const { error } = await supabase
          .from('meal_plan_slots')
          .upsert(row, { onConflict: 'user_id,plan_date,meal_type' })
        if (!error) send(JSON.stringify({ ...row, plan_date: meal.date }))
      }

      try {
        const stream = await openai.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        })

        let accumulated = ''
        let depth = 0, inString = false, escaped = false, objStart = -1

        const processChar = async (ch: string, idx: number) => {
          if (escaped) { escaped = false; return }
          if (ch === '\\' && inString) { escaped = true; return }
          if (ch === '"') { inString = !inString; return }
          if (inString) return
          if (ch === '{') { if (depth === 0) objStart = idx; depth++ }
          else if (ch === '}') {
            depth--
            if (depth === 0 && objStart >= 0) {
              const candidate = accumulated.slice(objStart, idx + 1)
              objStart = -1
              try {
                const meal = JSON.parse(candidate)
                if (meal.meal_name && meal.date && meal.meal_type) await saveMeal(meal)
              } catch { /* skip */ }
            }
          }
        }

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          const prevLen = accumulated.length
          accumulated += delta
          for (let i = prevLen; i < accumulated.length; i++) await processChar(accumulated[i], i)
        }
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
