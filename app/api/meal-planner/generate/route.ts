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

      // Always fetch the rest of the week so the AI knows what's already
      // planned and can avoid repeating proteins, formats, and dishes.
      // Critical for single-slot and single-day generation where the AI
      // would otherwise default to the same safe meals every call.
      let existingWeekMeals: string[] = []
      if (weekStart) {
        const weekEnd = new Date(weekStart)
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
        const targetKeys = new Set(slots.map(s => `${s.date}|${s.meal_type}`))
        const { data: weekMeals } = await supabase
          .from('meal_plan_slots')
          .select('meal_name, meal_type, plan_date')
          .eq('user_id', user.id)
          .gte('plan_date', weekStart)
          .lte('plan_date', weekEnd.toISOString().split('T')[0])
        existingWeekMeals = (weekMeals ?? [])
          .filter(m => !targetKeys.has(`${m.plan_date}|${m.meal_type}`))
          .map(m => `${m.plan_date} ${m.meal_type}: ${m.meal_name}`)
      }

      // Cuisine + method rotation for dinner — shuffled server-side so every
      // generation call gets a fresh ordering. Forces real variety without
      // pre-assigning specific meals.
      const DINNER_CUISINES = [
        'Italian', 'Mexican', 'Japanese', 'Thai', 'Indian', 'Middle Eastern',
        'Greek', 'Vietnamese', 'Korean', 'Moroccan', 'Spanish', 'Caribbean',
        'French bistro', 'American comfort (elevated)', 'Ethiopian', 'Turkish',
        'Peruvian', 'Lebanese', 'Malaysian', 'Portuguese',
      ]
      const SIMPLE_METHODS   = ['baked', 'grilled', 'sautéed', 'stir-fried', 'roasted', 'broiled']
      const WEEKEND_METHODS  = ['slow-braised', 'slow-roasted', 'poached', 'roasted', 'grilled', 'baked', 'broiled']

      function shuffle<T>(arr: T[]): T[] {
        const a = [...arr]
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[a[i], a[j]] = [a[j], a[i]]
        }
        return a
      }

      const isDinnerOnly = slots.every(s => s.meal_type === 'dinner')
      const dinnerSlotsCount = slots.filter(s => s.meal_type === 'dinner').length
      const shuffledCuisines = shuffle(DINNER_CUISINES)
      const cuisinePool = shuffledCuisines.slice(0, Math.max(dinnerSlotsCount, 1))
      const methodPool = complexity === 'weekend' ? WEEKEND_METHODS : SIMPLE_METHODS
      // For single-slot swap, pre-select one cuisine + method so the AI commits to a specific direction
      const randomCuisine = (regenerate && isDinnerOnly) ? shuffledCuisines[0] : null
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

      // ── Breakfast types per diet ──────────────────────────────────────────
      // Concrete breakfast TYPES, not specific meals. The AI picks the dish
      // within the type. Types are grounded in real morning foods so the AI
      // stays in breakfast territory and doesn't drift into dinner proteins.
      let breakfastTypes: string
      let breakfastProteins: string
      if (ketoMode) {
        breakfastTypes    = `eggs + cured meat (scrambled/fried/poached eggs with bacon or breakfast sausage) | omelette or egg scramble with cheese and vegetables | Greek yogurt bowl with nuts and low-carb berries | cottage cheese bowl with nuts or seeds | fried or poached eggs with avocado | egg muffins or baked egg cups | smoked salmon with eggs or cream cheese (simple plate)`
        breakfastProteins = `eggs, bacon, breakfast sausage, ham, smoked salmon, Greek yogurt, cottage cheese`
      } else if (veganMode) {
        breakfastTypes    = `oatmeal or porridge with fruit and nuts | smoothie or smoothie bowl | tofu scramble with vegetables | chia pudding with fruit | avocado toast | granola with plant milk and fruit | peanut or almond butter toast with banana`
        breakfastProteins = `tofu, tempeh, nut butter, plant-based yogurt, oats`
      } else if (vegetarianMode) {
        breakfastTypes    = `scrambled or fried eggs on toast | yogurt parfait with granola and fruit | oatmeal with fruit and nuts | avocado toast with egg | smoothie with protein | pancakes or waffles | frittata or egg bake with vegetables`
        breakfastProteins = `eggs, Greek yogurt, cottage cheese, cheese`
      } else if (pescatarianMode) {
        breakfastTypes    = `scrambled or fried eggs on toast | smoked salmon on toast or bagel | yogurt parfait with granola and fruit | oatmeal with fruit | avocado toast with egg | smoothie`
        breakfastProteins = `eggs, smoked salmon, Greek yogurt, cottage cheese`
      } else if (paleoMode) {
        breakfastTypes    = `scrambled or fried eggs with bacon or sausage | sweet potato hash with egg | fruit and nut bowl | omelette with vegetables | paleo pancakes (almond or coconut flour)`
        breakfastProteins = `eggs, bacon, breakfast sausage`
      } else if (lowFodmapMode) {
        breakfastTypes    = `scrambled or fried eggs on gluten-free toast | rice cakes with peanut butter and banana | gluten-free oats with safe fruit | fried egg with roasted tomatoes | smoothie with safe ingredients`
        breakfastProteins = `eggs, peanut butter, lactose-free yogurt`
      } else {
        breakfastTypes    = `scrambled or fried eggs on toast | oatmeal with fruit and nuts | yogurt parfait with granola | avocado toast with egg | smoothie with protein | pancakes or waffles | breakfast burrito with eggs`
        breakfastProteins = `eggs, Greek yogurt, cottage cheese, cheese, bacon, breakfast sausage`
      }

      // ── Lunch format CATEGORIES per diet ─────────────────────────────────
      let lunchCategories: string
      if (ketoMode)            lunchCategories = `protein-and-greens salad | lettuce wrap | protein bowl over cauliflower rice or zoodles | hearty soup (no grains) | stuffed vegetable (bell pepper, mushroom) | cold plate (deli meats, cheese, veg)`
      else if (veganMode)      lunchCategories = `grain bowl | bean or lentil soup | wrap or sandwich | hearty salad with plant protein | stir-fry over grain | stuffed vegetable`
      else if (vegetarianMode) lunchCategories = `sandwich or wrap | grain bowl | soup | salad with cheese or egg | quesadilla or flatbread | stir-fry`
      else if (pescatarianMode) lunchCategories = `fish sandwich or wrap | grain bowl with fish | salad with fish | seafood soup | fish tacos | poke-style bowl`
      else if (paleoMode)      lunchCategories = `protein-and-vegetables salad | lettuce wrap | broth-based soup | hash or skillet | grilled protein plate with vegetables`
      else if (lowFodmapMode)  lunchCategories = `protein-and-vegetables salad | rice bowl | gluten-free wrap or sandwich | safe broth-based soup | rice noodle bowl`
      else                     lunchCategories = `sandwich or wrap | grain bowl | hearty salad with protein | soup | stir-fry | quesadilla or flatbread | hot plate (protein + grain + veg)`

      // ── Slot lists ────────────────────────────────────────────────────────
      const breakfastSlots = slots.filter(s => s.meal_type === 'breakfast')
      const lunchSlots     = slots.filter(s => s.meal_type === 'lunch')
      const dinnerSlots    = slots.filter(s => s.meal_type === 'dinner')
      const totalSlots     = slots.length

      // ── Per-slot type pools ──────────────────────────────────────────────
      // Same pattern as dinner cuisines: shuffle the type list, slice to the
      // slot count, and assign one type per slot. Prevents the AI from
      // defaulting to the same 1-2 safest options (eggs+bacon, yogurt+nuts)
      // every call. Each generation gets a different randomized assignment.
      const breakfastTypeList = breakfastTypes.split(' | ')
      const lunchTypeList     = lunchCategories.split(' | ')
      const breakfastTypePool = shuffle(breakfastTypeList).slice(0, Math.max(breakfastSlots.length, 1))
      const lunchTypePool     = shuffle(lunchTypeList).slice(0, Math.max(lunchSlots.length, 1))

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
${dietRule ? `\nDIET RULE — STRICT: ${dietRule}` : ''}

VARIETY RULES — MANDATORY (${totalSlots} meal${totalSlots !== 1 ? 's' : ''} in this response):
- Every meal name must be unique. No duplicates, no near-duplicates.
- Each main protein source appears AT MOST ONCE across ALL meals in this response.
- Each cooking method (baked, grilled, pan-seared, etc.) AT MOST TWICE.
- Within each meal type (breakfast, lunch, dinner), each format CATEGORY is used AT MOST ONCE — never two egg-based breakfasts, never two salad lunches, etc.
- ONLY generate meals for the slots listed. Do not add extras.

GUT HEALTH: Whole foods, anti-inflammatory, varied vegetables. Avoid heavily processed ingredients.

${existingWeekMeals.length > 0 ? `ALREADY PLANNED THIS WEEK — do NOT repeat these meals, do NOT use the same main proteins or ingredient combinations:\n${existingWeekMeals.join('\n')}\n` : ''}
${breakfastSlots.length > 0 ? `
=== BREAKFAST (${breakfastSlots.length} meal${breakfastSlots.length !== 1 ? 's' : ''}) ===
Breakfast must be a CLASSIC, RECOGNIZABLE morning meal — what a home cook makes in 10-15 minutes on a weekday.
HARD RULES:
1. Proteins allowed at breakfast: ${breakfastProteins}. Do NOT use dinner proteins (turkey breast, ground beef, roasted meats, trout, steak) at breakfast.
2. Maximum 3 main components. No exotic techniques — no pickling, no marinating, no multi-step prep.
3. Name meals plainly: "Scrambled eggs with bacon and cheddar" not "Artisan Herb-Cured Egg Medallions with Crispy Pancetta".
4. Each slot has a PRE-ASSIGNED breakfast type below. Build the meal within that type — be creative with the specific ingredients but stay in the assigned type. Do NOT substitute a different type.

Slots (use the assigned type for each):
${breakfastSlots.map((s, i) => `- ${s.date} breakfast — type: ${breakfastTypePool[i % breakfastTypePool.length]}`).join('\n')}` : ''}
${lunchSlots.length > 0 ? `
=== LUNCH (${lunchSlots.length} meal${lunchSlots.length !== 1 ? 's' : ''}) ===
Lunch must be quick, filling, and practical — 20 minutes or under. Standard everyday meals.
HARD RULES:
1. Each slot has a PRE-ASSIGNED lunch format below. Build the meal within that format — vary the specific protein and ingredients but stay in the assigned format.
2. Include a clear protein source. Maximum 4 main components.
3. Name meals plainly: "Grilled chicken Caesar wrap" not "Pan-Seared Herb Chicken with Ancient Grain Medley".

Slots (use the assigned format for each):
${lunchSlots.map((s, i) => `- ${s.date} lunch — format: ${lunchTypePool[i % lunchTypePool.length]}`).join('\n')}` : ''}
${dinnerSlots.length > 0 ? `
=== DINNER (${dinnerSlots.length} meal${dinnerSlots.length !== 1 ? 's' : ''}) ===
${complexityNote}
${randomCuisine
  ? `Cuisine for this dinner: ${randomCuisine}. Cooking method: ${randomMethod}.`
  : `Cuisines to use — pick one per dinner from this list, each cuisine at most once: ${cuisinePool.join(', ')}. These have been pre-shuffled; use them in any order, but every dinner must come from a different cuisine.`}
Protein options to rotate (each at most once across all dinners): ${proteins}${dinnerOnlyProteins}
Side / base options: ${dinnerBases}
Use specific, descriptive names: "Baked Lemon-Herb Salmon with Roasted Asparagus" not "Salmon with Vegetables".

Slots:
${dinnerSlots.map(s => `- ${s.date} dinner`).join('\n')}` : ''}

Return a JSON array only — no markdown. Each object:
{"date":"YYYY-MM-DD","meal_type":"breakfast|lunch|dinner","meal_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}`

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
