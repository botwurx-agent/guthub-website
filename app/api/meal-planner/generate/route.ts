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

      const ketoMode        = resolvedDiet === 'keto'      || dietLabel.toLowerCase().includes('keto')
      const veganMode       = resolvedDiet === 'vegan'      || dietLabel.toLowerCase().includes('vegan')
      const vegetarianMode  = veganMode                     || dietLabel.toLowerCase().includes('vegetarian')
      const pescatarianMode = dietLabel.toLowerCase().includes('pescatarian')
      const paleoMode       = resolvedDiet === 'paleo'      || dietLabel.toLowerCase().includes('paleo')
      const lowFodmapMode   = resolvedDiet === 'low_fodmap' || dietLabel.toLowerCase().includes('fodmap')

      // ── Protein options per diet ──────────────────────────────────────────
      let proteins: string
      let dinnerOnlyProteins: string
      if (veganMode) {
        proteins           = `tofu, tempeh, lentils, chickpeas, black beans, edamame`
        dinnerOnlyProteins = `, seitan, white beans`
      } else if (vegetarianMode) {
        proteins           = `eggs, Greek yogurt, cottage cheese, tofu, tempeh, lentils, chickpeas`
        dinnerOnlyProteins = `, black beans, halloumi, paneer`
      } else if (pescatarianMode) {
        proteins           = `salmon, cod, tilapia, shrimp, tuna, eggs`
        dinnerOnlyProteins = `, crab, scallops, sardines`
      } else if (ketoMode) {
        proteins           = `chicken breast, chicken thighs, ground beef, ground turkey, steak, pork chops, salmon, cod, bacon`
        dinnerOnlyProteins = `, lamb chops, shrimp, ground bison, duck breast`
      } else if (paleoMode) {
        proteins           = `chicken breast, chicken thighs, ground beef, steak, ground turkey, pork chops, salmon`
        dinnerOnlyProteins = `, lamb, shrimp, venison`
      } else {
        proteins           = `chicken breast, chicken thighs, steak, salmon, ground beef, ground turkey, pork chops, shrimp`
        dinnerOnlyProteins = `, lamb, cod, lentils, chickpeas`
      }

      // ── Dinner vegetable bases per diet ──────────────────────────────────
      let dinnerBases: string
      if (ketoMode)        dinnerBases = `zucchini noodles, spaghetti squash, shirataki noodles, roasted broccoli, roasted asparagus, roasted Brussels sprouts, sautéed green beans, roasted cauliflower, wilted spinach`
      else if (paleoMode)  dinnerBases = `sweet potato, roasted root vegetables, butternut squash, spaghetti squash, plantain`
      else if (lowFodmapMode) dinnerBases = `white rice, quinoa, gluten-free pasta, roasted potatoes, polenta`
      else                 dinnerBases = `rice, pasta, roasted potatoes, noodles, couscous, farro, quinoa`

      // ── Diet restriction rule (what is NOT allowed) ───────────────────────
      let dietRule = ''
      if (ketoMode)            dietRule = `KETO: No grains, no bread, no rice, no pasta, no oats, no corn, no beans, no lentils, no potatoes. Every meal must be low-carb. Use meat, fish, eggs, cheese, and non-starchy vegetables.`
      else if (veganMode)      dietRule = `VEGAN: No meat, poultry, fish, dairy, or eggs. 100% plant-based only.`
      else if (vegetarianMode) dietRule = `VEGETARIAN: No meat, poultry, or fish. Eggs and dairy are fine.`
      else if (pescatarianMode) dietRule = `PESCATARIAN: No beef, pork, chicken, turkey, or any land animal. Fish and seafood only as animal protein.`
      else if (paleoMode)      dietRule = `PALEO: No grains, no legumes, no dairy, no processed foods. Meat, fish, eggs, vegetables, fruit, nuts, seeds only.`
      else if (lowFodmapMode)  dietRule = `LOW-FODMAP: No garlic, no onion, no wheat, no apples/pears/stone fruits, no lactose. Safe: white rice, potatoes, quinoa, hard cheeses, chicken, beef, fish, eggs, carrots, zucchini, bell peppers, spinach, tomatoes.`

      // ── Breakfast format options per diet ────────────────────────────────
      let breakfastFormats: string
      if (ketoMode)            breakfastFormats = `scrambled eggs with cheese, fried eggs with bacon, soft-boiled eggs with sautéed mushrooms, full-fat Greek yogurt with nuts and berries, smoked salmon with cucumber and cream cheese, cottage cheese with walnuts, omelette with vegetables and cheese`
      else if (veganMode)      breakfastFormats = `oatmeal with fruit, avocado toast, chia pudding, smoothie bowl, tofu scramble, granola with plant milk, peanut butter toast`
      else if (vegetarianMode) breakfastFormats = `scrambled eggs on toast, yogurt parfait, oatmeal with fruit, avocado toast with fried egg, smoothie, pancakes, frittata`
      else if (pescatarianMode) breakfastFormats = `scrambled eggs on toast, smoked salmon on toast, yogurt parfait, oatmeal with fruit, avocado toast with egg`
      else if (paleoMode)      breakfastFormats = `scrambled eggs, fried eggs with bacon, sweet potato hash with egg, fruit bowl with nuts, omelette with vegetables`
      else if (lowFodmapMode)  breakfastFormats = `scrambled eggs on gluten-free toast, rice cakes with peanut butter, gluten-free oats with banana, fried egg with roasted tomatoes`
      else                     breakfastFormats = `scrambled eggs on toast, oatmeal with fruit, yogurt parfait, avocado toast with egg, smoothie, pancakes, breakfast burrito`

      // ── Lunch format options per diet ────────────────────────────────────
      let lunchFormats: string
      if (ketoMode)            lunchFormats = `chicken Caesar salad (no croutons), tuna lettuce wraps, steak salad with mixed greens, egg salad in bell pepper halves, ground turkey zucchini soup, BLT salad, shrimp and cucumber salad`
      else if (veganMode)      lunchFormats = `lentil soup, grain bowl with roasted vegetables, black bean wrap, chickpea salad, vegetable stir-fry, stuffed bell peppers`
      else if (vegetarianMode) lunchFormats = `caprese salad, egg salad sandwich, lentil soup, grilled cheese, veggie wrap, quesadilla`
      else if (pescatarianMode) lunchFormats = `tuna salad sandwich, salmon wrap, shrimp salad, fish tacos, tuna melt`
      else if (paleoMode)      lunchFormats = `grilled chicken salad, lettuce-wrap burger, chicken soup, steak salad`
      else if (lowFodmapMode)  lunchFormats = `grilled chicken salad, rice bowl with vegetables, gluten-free sandwich`
      else                     lunchFormats = `sandwich, wrap, soup, salad with protein, quesadilla, grilled cheese, tuna melt`

      // ── Slot lists ────────────────────────────────────────────────────────
      const breakfastSlots = slots.filter(s => s.meal_type === 'breakfast')
      const lunchSlots     = slots.filter(s => s.meal_type === 'lunch')
      const dinnerSlots    = slots.filter(s => s.meal_type === 'dinner')
      const totalSlots     = slots.length

      const complexityNote = complexity === 'simple'
        ? `Under 30 minutes. One or two pans. No specialist equipment.`
        : `More ambitious cooking welcome — longer times, marinating, multiple components.`

      const prompt = `You are a gut-health meal planner. Generate meals for the exact slots listed below.

USER PROFILE:
- Diet: ${dietLabel}
- Daily targets: ${calories} kcal | Protein ${protein}g | Carbs ${carbs}g | Fat ${fat}g
- Macro split: breakfast 25% · lunch 35% · dinner 40%
${allergies ? `- Avoid: ${allergies}` : ''}
${conditions ? `- Health conditions: ${conditions}` : ''}
${labContext ? `\nLAB RESULTS (context only — do not restrict variety based on these):\n${labContext}` : ''}
${dietRule ? `\nDIET RULE: ${dietRule}` : ''}

VARIETY RULES (${totalSlots} meal${totalSlots !== 1 ? 's' : ''} in this response — all rules apply across every meal):
- Every meal name must be unique. No duplicates, no near-duplicates.
- Each protein appears AT MOST ONCE across all meals.
- Each cooking method (baked, grilled, pan-seared, etc.) AT MOST TWICE.
- ONLY generate meals for the slots listed. No extras.

GUT HEALTH: Whole foods, anti-inflammatory, varied vegetables across meals.

${existingWeekMeals.length > 0 ? `ALREADY THIS WEEK — do not repeat these:\n${existingWeekMeals.join('\n')}\n` : ''}
${breakfastSlots.length > 0 ? `
=== BREAKFAST (${breakfastSlots.length} meals) ===
Fast and simple. 15 minutes max. 2-3 ingredients. No complex builds.
Use a DIFFERENT FORMAT for each breakfast — pick from: ${breakfastFormats}
Never repeat a format (e.g. only one scrambled eggs, only one yogurt).

Slots:
${breakfastSlots.map(s => `- ${s.date} breakfast`).join('\n')}` : ''}
${lunchSlots.length > 0 ? `
=== LUNCH (${lunchSlots.length} meals) ===
Quick, under 20 minutes. Each lunch must be a different dish and format.
Pick from: ${lunchFormats}
No two lunches share the same protein or format.

Slots:
${lunchSlots.map(s => `- ${s.date} lunch`).join('\n')}` : ''}
${dinnerSlots.length > 0 ? `
=== DINNER (${dinnerSlots.length} meals) ===
${complexityNote}
${randomCuisine ? `Cuisine: ${randomCuisine}, method: ${randomMethod}.` : 'Vary world cuisines — Italian, Mexican, Indian, Middle Eastern, Greek, Korean, Thai, etc.'}
Proteins (each at most once): ${proteins}${dinnerOnlyProteins}
Vegetable bases/sides (each at most once): ${dinnerBases}
Specific names only: "Baked Lemon-Herb Salmon with Roasted Asparagus" not "Salmon with Vegetables".

Slots:
${dinnerSlots.map(s => `- ${s.date} dinner`).join('\n')}` : ''}

Return a JSON array only — no markdown. Each object:
{"date":"YYYY-MM-DD","meal_type":"breakfast|lunch|dinner","meal_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}`

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
      } else if (ketoMode) {
        commonProteins      = `chicken breast, chicken thighs, steak, ground beef, ground turkey, pork chops, fish (cod, tilapia, or salmon)`
        dinnerExtraProteins = `, lamb, shrimp, bacon, ground bison`
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
        ? `KETO STRICT: All meals must be low-carb/high-fat. NO rice, pasta, bread, oats, corn, beans, lentils, potatoes, tortillas, or any grain. For dinner use zucchini noodles, spaghetti squash, shirataki noodles, or roasted vegetables as the base — NOT cauliflower rice (reserved for special use only). For breakfast serve without a carb base. For lunch use salad greens or lettuce cups. Prioritize: meat, fish, eggs, cheese, non-starchy vegetables (broccoli, spinach, zucchini, green beans, asparagus, mushrooms, peppers), healthy fats (olive oil, butter, coconut oil). Avocado is allowed but should appear in no more than 2 meals total — it is a garnish, not a required component.`
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


      // Whitelist: only save meals that match a slot we actually requested
      const allowedSlotKeys = new Set(slots.map(s => `${s.date}|${s.meal_type}`))

      const saveMeal = async (meal: Record<string, unknown>) => {
        const key = `${meal.date}|${meal.meal_type}`
        if (!allowedSlotKeys.has(key)) return  // reject any extra meals the AI hallucinated
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

      console.log('[meal-planner/generate] PROMPT:\n' + prompt)

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
