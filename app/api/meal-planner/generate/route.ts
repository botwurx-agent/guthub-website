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
    mealTypes: mealTypesFilter,
    phase = 'quick',
    existingMeal,
    complexity = 'simple',
    rejectedMeals = [],   // meals generated for this slot but rejected by swapping again
  } = await request.json()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const [{ data: profile }, { data: macroTarget }, { data: labReports }, { data: mealHistory }] = await Promise.all([
    supabase.from('profiles').select('diet_mode, health_profile, rejected_meals').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('lab_reports').select('filename, analysis_summary').eq('user_id', user.id).not('analysis_summary', 'is', null).order('created_at', { ascending: false }).limit(3),
    supabase.from('meal_plan_slots').select('meal_name, meal_type').eq('user_id', user.id).gte('plan_date', thirtyDaysAgoStr).not('meal_name', 'is', null),
  ])

  // Persist any newly-rejected meal names to the user's profile so future
  // generations across sessions / devices never regenerate them. Capped at
  // last 200 entries to keep prompt size manageable.
  const existingRejections: string[] = Array.isArray(profile?.rejected_meals) ? profile.rejected_meals : []
  const incomingRejections: string[] = Array.isArray(rejectedMeals) ? rejectedMeals : []
  const mergedRejections = Array.from(new Set([...existingRejections, ...incomingRejections]))
  if (mergedRejections.length !== existingRejections.length) {
    const capped = mergedRejections.slice(-200)
    await supabase.from('profiles').update({ rejected_meals: capped }).eq('id', user.id)
  }
  const persistentRejections = mergedRejections.slice(-200)

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
            reasoning_effort: 'minimal',
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

      // Always fetch the full week context so the AI can avoid repeats.
      // Two buckets:
      // - existingWeekMeals: meals on OTHER slots (don't repeat these)
      // - currentSlotMeals:  the CURRENT meal already in the slot being swapped —
      //   so the AI picks something meaningfully different on repeated swaps.
      const targetKeys = new Set(slots.map(s => `${s.date}|${s.meal_type}`))
      let existingWeekMeals: string[] = []
      let currentSlotMeals: string[] = []
      let rawWeekMeals: Array<{ meal_name: string; meal_type: string; plan_date: string; meal_category: string | null }> = []
      if (weekStart) {
        const weekEnd = new Date(weekStart)
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
        const { data: weekMeals } = await supabase
          .from('meal_plan_slots')
          .select('meal_name, meal_type, plan_date, meal_category')
          .eq('user_id', user.id)
          .gte('plan_date', weekStart)
          .lte('plan_date', weekEnd.toISOString().split('T')[0])
        rawWeekMeals = weekMeals ?? []
        existingWeekMeals = rawWeekMeals
          .filter(m => !targetKeys.has(`${m.plan_date}|${m.meal_type}`))
          .map(m => `${m.plan_date} ${m.meal_type}: ${m.meal_name}`)
        // Merge DB current-slot meals with client-passed rejection history.
        // When the user swaps the same slot multiple times, each prior attempt
        // is accumulated in rejectedMeals so the AI sees the full history and
        // cannot oscillate between the same 2-3 defaults.
        const dbCurrentSlot = rawWeekMeals
          .filter(m => targetKeys.has(`${m.plan_date}|${m.meal_type}`))
          .map(m => m.meal_name)
        currentSlotMeals = [
          ...dbCurrentSlot,
          ...(rejectedMeals as string[]).filter(r => !dbCurrentSlot.includes(r)),
        ]
      }

      // Cuisine + method rotation for dinner — shuffled server-side so every
      // generation call gets a fresh ordering.
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
      // Filter cuisines already used this week so swaps don't pick a repeat
      const usedDinnerCuisines = new Set(
        rawWeekMeals
          .filter(m => !targetKeys.has(`${m.plan_date}|${m.meal_type}`) && m.meal_type === 'dinner' && m.meal_category)
          .map(m => m.meal_category as string)
      )
      const availableCuisines = DINNER_CUISINES.filter(c => !usedDinnerCuisines.has(c))
      const cuisineSource = availableCuisines.length >= Math.max(dinnerSlotsCount, 1) ? availableCuisines : DINNER_CUISINES
      const shuffledCuisines = shuffle(cuisineSource)
      const cuisinePool = shuffledCuisines.slice(0, Math.max(dinnerSlotsCount, 1))
      const methodPool = complexity === 'weekend' ? WEEKEND_METHODS : SIMPLE_METHODS
      // For single dinner swap, pre-select one cuisine + method so the AI commits to a direction
      const randomCuisine = (regenerate && isDinnerOnly) ? shuffledCuisines[0] : null
      const randomMethod = (regenerate && isDinnerOnly)
        ? methodPool[Math.floor(Math.random() * methodPool.length)]
        : null

      const ketoMode          = resolvedDiet === 'keto'          || dietLabel.toLowerCase().includes('keto')
      const veganMode         = resolvedDiet === 'vegan'         || dietLabel.toLowerCase().includes('vegan')
      const vegetarianMode    = veganMode                        || dietLabel.toLowerCase().includes('vegetarian')
      const pescatarianMode   = dietLabel.toLowerCase().includes('pescatarian')
      const paleoMode         = resolvedDiet === 'paleo'         || dietLabel.toLowerCase().includes('paleo')
      const lowFodmapMode     = resolvedDiet === 'low_fodmap'    || dietLabel.toLowerCase().includes('fodmap')
      const mediterraneanMode = resolvedDiet === 'mediterranean' || dietLabel.toLowerCase().includes('mediterranean')
      const carnivoreMode     = resolvedDiet === 'carnivore'      || dietLabel.toLowerCase().includes('carnivore')
      const highProteinMode   = resolvedDiet === 'high_protein'   || dietLabel.toLowerCase().includes('high protein') || dietLabel.toLowerCase().includes('high-protein')

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
      } else if (mediterraneanMode) {
        proteins           = `salmon, sea bass, cod, shrimp, chicken breast, chicken thighs, eggs, lentils, chickpeas`
        dinnerOnlyProteins = `, lamb, mussels, octopus, sardines, white beans, halloumi`
      } else if (carnivoreMode) {
        proteins           = `ribeye steak, NY strip steak, ground beef, chicken thighs, pork chops, salmon, bacon, lamb chops`
        dinnerOnlyProteins = `, lamb shanks, pork ribs, chuck roast, brisket, shrimp, scallops, lobster, liver, heart, oxtail`
      } else if (highProteinMode) {
        proteins           = `chicken breast, chicken thighs, ground turkey (lean), ground beef (lean), salmon, shrimp, tuna, eggs, pork tenderloin, turkey breast`
        dinnerOnlyProteins = `, steak (sirloin, flank), cod, tilapia, bison burger, lamb chops`
      } else {
        proteins           = `chicken breast, chicken thighs, ground beef, ground turkey, steak (sirloin, flank, skirt), salmon, pork chops, shrimp, bacon, ham`
        dinnerOnlyProteins = `, lamb chops, cod, tilapia, halibut, pork tenderloin, duck breast, bison burger`
      }
      // Strip the leading ", " — used in the lunch ban rule so the AI sees a clean list
      const dinnerOnlyList = dinnerOnlyProteins.replace(/^,\s*/, '')

      // ── Dinner vegetable bases per diet ──────────────────────────────────
      let dinnerBases: string
      if (ketoMode)           dinnerBases = `roasted broccoli, roasted asparagus, roasted Brussels sprouts, sautéed green beans, roasted cauliflower florets, cauliflower mash, wilted spinach, sautéed kale, sautéed mushrooms, roasted bell peppers, sliced roasted zucchini, roasted cabbage wedge, avocado — use zucchini noodles or spaghetti squash occasionally for variety, not as the default`
      else if (paleoMode)         dinnerBases = `sweet potato, roasted root vegetables, butternut squash, spaghetti squash, plantain`
      else if (lowFodmapMode)     dinnerBases = `white rice, quinoa, gluten-free pasta, roasted potatoes, polenta`
      else if (mediterraneanMode) dinnerBases = `farro, bulgur, freekeh, brown rice, whole-wheat pasta, couscous, quinoa, roasted potatoes, lentils, chickpeas`
      else if (carnivoreMode)     dinnerBases = `butter sauce, bone marrow, pan drippings, rendered tallow — NO vegetable or grain sides; the protein IS the meal`
      else if (highProteinMode)   dinnerBases = `brown rice, quinoa, sweet potato, lentils, chickpeas, farro, roasted potatoes, whole-wheat pasta — carbs are supporting cast, not the star`
      else                        dinnerBases = `white rice, brown rice, quinoa, farro, roasted potatoes, sweet potato, pasta (any shape), noodles, couscous, roasted root vegetables, lentils`

      // ── Diet restriction rule (what is NOT allowed) ───────────────────────
      let dietRule = ''
      if (ketoMode)             dietRule = `KETO: No grains, no bread, no rice, no pasta, no oats, no corn, no beans, no lentils, no potatoes. Every meal must be low-carb. Use meat, fish, eggs, cheese, and non-starchy vegetables.`
      else if (veganMode)       dietRule = `VEGAN: No meat, poultry, fish, dairy, or eggs. 100% plant-based only.`
      else if (vegetarianMode)  dietRule = `VEGETARIAN: No meat, poultry, or fish. Eggs and dairy are fine.`
      else if (pescatarianMode) dietRule = `PESCATARIAN: No beef, pork, chicken, turkey, or any land animal. Fish and seafood only as animal protein.`
      else if (paleoMode)       dietRule = `PALEO: No grains, no legumes, no dairy, no processed foods. Meat, fish, eggs, vegetables, fruit, nuts, seeds only.`
      else if (lowFodmapMode)     dietRule = `LOW-FODMAP: No garlic, no onion, no leeks, no shallots, no wheat/rye/barley, no apples/pears/watermelon/stone fruits (peaches, plums, cherries, mangoes), no lactose (use hard cheeses or lactose-free dairy), no mushrooms, no cauliflower, no asparagus, no legumes (lentils, chickpeas, kidney beans, baked beans). Safe proteins: eggs, chicken, beef, pork, fish, shrimp, hard cheeses (cheddar, swiss, parmesan), lactose-free dairy, firm tofu, peanut butter. Safe grains: white rice, GF oats, quinoa, gluten-free pasta/bread, potatoes, polenta. Safe vegetables: bell peppers, carrots, cucumber, tomatoes, spinach, zucchini, green beans, eggplant. Safe fruits: banana, blueberries, strawberries, grapes, kiwi, pineapple, mandarin oranges.`
      else if (mediterraneanMode) dietRule = `MEDITERRANEAN: Olive oil is the primary fat. Heavy emphasis on vegetables, legumes, whole grains, fish, seafood, eggs, nuts, fresh herbs, and Mediterranean cheeses (feta, halloumi, ricotta, parmesan, manchego). Red meat occasionally only. No deep-frying, no heavy cream sauces, no processed foods. Signature ingredients: tomatoes, cucumber, olives, olive oil, lemon, garlic, fresh herbs (parsley, oregano, mint, dill, basil), feta, yogurt, tahini, hummus.`
      else if (carnivoreMode)     dietRule = `CARNIVORE: ONLY animal products. Absolutely NO vegetables, NO fruits, NO grains, NO legumes, NO nuts, NO seeds, NO plant-based ingredients of any kind — not even as garnish or seasoning (no herb leaves, no lemon wedge). Cooking fat: butter, ghee, or tallow ONLY. Allowed seasonings: salt, pepper, cumin, paprika, chili paste, garlic powder. Dairy is allowed in LIMITED amounts: cheese, heavy cream. Eggs are allowed in limited amounts — pair with meat. Organ meats (liver, heart, kidney, oxtail, tongue) are staple carnivore foods and should rotate in regularly. Every meal is pure protein and fat — no starch, no fiber.`
      else if (highProteinMode)   dietRule = `HIGH PROTEIN (athlete-focused): Every meal is built around a large, named protein serving. Target: 35–45g protein at breakfast, 45–55g at lunch, 55–65g at dinner. Prioritize lean proteins: chicken breast, ground turkey, eggs (3–4 per serving), salmon, shrimp, tuna, lean ground beef, cottage cheese, Greek yogurt. Clean carbs (brown rice, quinoa, sweet potato) are welcome as sides — they support performance, not the centerpiece. Protein-rich dairy (Greek yogurt, cottage cheese, low-fat cheese) counts toward the protein target. No empty carbs without a protein anchor.`

      // ── Slot lists ────────────────────────────────────────────────────────
      const breakfastSlots = slots.filter(s => s.meal_type === 'breakfast')
      const lunchSlots     = slots.filter(s => s.meal_type === 'lunch')
      const dinnerSlots    = slots.filter(s => s.meal_type === 'dinner')
      const totalSlots     = slots.length

      // Dinner cuisine map — tracks which cuisine was assigned to which slot
      // so saveMeal can persist it to meal_category for future dedup
      const dinnerCuisineMap = new Map<string, string>()
      dinnerSlots.forEach((s, i) => dinnerCuisineMap.set(`${s.date}|${s.meal_type}`, cuisinePool[i % cuisinePool.length]))

      // ── Breakfast proteins (guards against dinner proteins bleeding into breakfast) ─
      let breakfastProteins: string
      if (ketoMode)             breakfastProteins = 'eggs, bacon, breakfast sausage, ham, steak, ground beef, ground turkey, ground chicken, turkey sausage, chicken sausage, beef patty, chorizo, pork belly, smoked salmon, Greek yogurt, cottage cheese, ricotta'
      else if (veganMode)       breakfastProteins = 'tofu, tempeh, nut butter, plant-based yogurt, oats, hemp seeds, chia seeds'
      else if (vegetarianMode)  breakfastProteins = 'eggs, Greek yogurt, cottage cheese, cheese, ricotta'
      else if (pescatarianMode) breakfastProteins = 'eggs, smoked salmon, tuna, Greek yogurt, cottage cheese, cheese'
      else if (paleoMode)       breakfastProteins = 'eggs, bacon, breakfast sausage, salmon'
      else if (lowFodmapMode)     breakfastProteins = 'eggs, peanut butter, lactose-free yogurt, lactose-free cottage cheese, hard cheese (cheddar, swiss, parmesan), smoked salmon, chicken, ham, firm tofu'
      else if (mediterraneanMode) breakfastProteins = 'eggs, Greek yogurt, feta, halloumi, ricotta, labneh, cottage cheese, smoked salmon, tuna, hummus'
      else if (carnivoreMode)     breakfastProteins = 'eggs, bacon, steak (ribeye, NY strip, skirt), ground beef patty, breakfast sausage, pork belly, smoked salmon, liver, chorizo, prosciutto, lamb patty'
      else if (highProteinMode)   breakfastProteins = 'eggs (3-4 per serving), egg whites, chicken breast, ground turkey, turkey sausage, chicken sausage, smoked salmon, Greek yogurt (high-protein), cottage cheese, steak strips, ham, bacon'
      else                        breakfastProteins = 'eggs, Greek yogurt, cottage cheese, cheese, bacon, breakfast sausage, ham, smoked salmon, turkey sausage, chicken sausage, peanut butter, almond butter'

      // ── Breakfast format inspiration per diet ─────────────────────────────
      // Framed as examples, not assignments. AI can use these or invent its own.
      let breakfastExamples: string
      if (ketoMode) {
        // Egg preparations split into DISTINCT items so the AI sees them as
        // separate options rather than collapsing into "fried eggs" every time.
        breakfastExamples = [
          '• Scrambled eggs — soft and fluffy, cheese melted in (cheddar, feta, goat cheese, cream cheese) plus any mix-in (herbs, smoked salmon, cured meat, vegetables)',
          '• Sunny-side or fried eggs — runny yolks plated alongside bacon, sausage, ground meat patty, steak, or vegetables, often with crumbled or grated cheese on top',
          '• Omelette — folded on the stovetop with cheese ALWAYS melted INSIDE, plus any combination of vegetables, cured meat, or herbs. Many variations to rotate: Western/Denver (ham, bell peppers, cheddar), Greek (feta, spinach, tomato), French herb (gruyère and fines herbes), Spanish (chorizo, peppers, manchego), goat cheese and mushroom, three-cheese, smoked salmon and cream cheese, bacon and cheddar, sausage and feta, jalapeño popper (cream cheese, jalapeño, bacon), Mediterranean (feta, olives, tomato), mushroom and Swiss, Mexican (chorizo, jalapeño, cotija)',
          '• Frittata — open-face baked egg pie with cheese and vegetables',
          '• Poached eggs — served over greens, avocado, smoked salmon, or sautéed vegetables',
          '• Soft- or hard-boiled eggs — plated with avocado, cheese, cured meat, or vegetables',
          '• Shakshuka — eggs poached in a spiced tomato and pepper sauce',
          '• Egg cups or muffins — eggs baked in muffin tins with cheese and veg or meat mix-ins',
          '• Meat-and-eggs plate — steak strips, ground beef hash, ground turkey patty, ground chicken patty, turkey sausage, chicken sausage, chorizo, or pork belly paired with eggs',
          '• Greek yogurt bowl (sweet) — full-fat plain Greek yogurt + seasonal fruit + nuts',
          '• Cottage cheese bowl (sweet) — full-fat cottage cheese + seasonal fruit + nuts',
          '• Smoked salmon plate — smoked salmon + cream cheese + cucumber or capers',
          '• Cheese and charcuterie plate — cold assembly: hard cheeses + cured meats + olives + raw vegetables',
          '• Cream cheese pancakes or chaffles (sweet) — topped with fresh fruit',
          '• Chia pudding (sweet) — chia seeds in coconut milk or heavy cream + seasonal fruit + nuts',
          '• Ricotta or mascarpone bowl (sweet) — full-fat ricotta + seasonal fruit + nuts',
          '• Avocado boat with tuna or salmon salad — halved avocado filled with chilled fish salad',
        ].join('\n')
      } else if (veganMode) {
        breakfastExamples = [
          '• Hot cereals — oatmeal, congee, quinoa porridge, millet porridge with fruit and seeds',
          '• Smoothies or smoothie bowls — blended fruit + plant milk + nut butter or seeds',
          '• Toast-based — avocado toast, nut butter toast, banana toast, hummus toast',
          '• Tofu scramble — crumbled tofu + turmeric + vegetables, optional toast',
          '• Sweet bowls — acai bowl, pitaya bowl, overnight oats, chia pudding with fruit',
          '• Vegan pancakes, waffles, or French toast (sweet)',
          '• Grain bowls — quinoa or millet with fruit, nuts, and plant milk',
          '• Potato or tempeh hash with vegetables',
          '• Burritos or wraps — scrambled tofu + beans + veg in tortilla',
          '• Plant yogurt parfait — coconut or almond yogurt + granola + fruit',
        ].join('\n')
      } else if (vegetarianMode) {
        breakfastExamples = [
          '• Egg plates — scrambled, fried, poached, or baked eggs any style',
          '• Toast-based — avocado toast with egg, ricotta toast with honey and fruit, egg on toast with toppings',
          '• Sweet bowls — yogurt parfait, cottage cheese bowl with fruit and nuts, smoothie bowl, granola bowl',
          '• Hot cereals — oatmeal, overnight oats, porridge with fruit',
          '• Pancakes, waffles, or French toast (sweet)',
          '• Omelettes or frittatas — eggs + cheese + any vegetables',
          '• Shakshuka — eggs poached in spiced tomato sauce',
          '• Breakfast burritos or sandwiches — eggs + cheese + veg',
          '• Chia pudding with seasonal fruit',
          '• Quiche slice or savory egg bake',
        ].join('\n')
      } else if (pescatarianMode) {
        breakfastExamples = [
          '• Egg plates — scrambled, fried, poached, or baked eggs',
          '• Smoked salmon dishes — on toast, bagel, or alongside eggs',
          '• Sweet bowls — yogurt parfait with granola and fruit, cottage cheese bowl',
          '• Oatmeal or overnight oats with fruit and nuts',
          '• Avocado toast with egg or tuna',
          '• Shakshuka or baked eggs in sauce',
          '• Pancakes, French toast, or waffles (sweet)',
          '• Chia pudding with seasonal fruit',
          '• Tuna salad on toast or in avocado',
          '• Rice or grain bowl with fish, egg, or vegetables',
        ].join('\n')
      } else if (paleoMode) {
        breakfastExamples = [
          '• Egg plates — any style eggs with bacon, sausage, or vegetables',
          '• Sweet potato or root vegetable hash with fried egg on top',
          '• Fruit and nut bowl — mixed seasonal fruit + nuts + seeds (no dairy)',
          '• Paleo pancakes or waffles — almond or coconut flour batter (sweet, with fruit)',
          '• Coconut yogurt parfait — with fruit and grain-free granola',
          '• Paleo smoothie — fruit + nut milk + nut butter',
          '• Egg muffins with bacon or vegetables, baked',
          '• Plantain or banana pancakes (sweet, with fresh fruit)',
          '• Breakfast skillet — ground sausage or beef + eggs + vegetables, one pan',
          '• Smoked salmon plate with cucumber and avocado (no cream cheese)',
        ].join('\n')
      } else if (mediterraneanMode) {
        // Mediterranean format inspiration — split into DISTINCT items so the
        // AI doesn't collapse into "Greek yogurt bowl" every time. Cucumber,
        // tomato, olives, and Mediterranean cheeses are signature ingredients.
        breakfastExamples = [
          '• Scrambled eggs with feta — soft scrambled with crumbled feta, fresh herbs, optional cherry tomato or spinach',
          '• Mediterranean omelette — folded with feta plus one of: spinach and tomato, olives and sun-dried tomato, roasted peppers, mushroom, or fresh herbs. Variations: Greek (feta, spinach, tomato), Spanish (chorizo, peppers, manchego), three-cheese (feta, mozzarella, parmesan), goat cheese and herbs, smoked salmon and dill, halloumi and tomato',
          '• Sunny-side or fried eggs — over sautéed spinach with tomato and feta, or alongside halloumi and cucumber',
          '• Poached or soft-boiled eggs — over labneh with olive oil, za\'atar, and toast, or with smoked salmon and cucumber',
          '• Shakshuka — eggs poached in spiced tomato and pepper sauce, topped with feta and parsley',
          '• Frittata — baked egg pie with feta, spinach, tomato, zucchini, or herbs',
          '• Egg cups or muffins — eggs baked with feta, spinach, sun-dried tomato, or olives',
          '• Greek yogurt bowl — full-fat Greek yogurt + seasonal fruit + nuts + honey drizzle, optional seeds',
          '• Labneh toast — labneh on whole-grain toast with cucumber, tomato, olive oil, za\'atar',
          '• Ricotta toast — fresh ricotta on whole-grain toast with honey and figs, peaches, berries, or pear',
          '• Hummus toast — hummus on whole-grain toast topped with cucumber, tomato, olives, and parsley',
          '• Avocado toast Mediterranean-style — mashed avocado on whole-grain toast with feta, cherry tomato, and herbs',
          '• Smoked salmon plate — smoked salmon with cucumber, tomato, olives, soft-boiled egg, capers, lemon',
          '• Halloumi plate — pan-seared halloumi with tomato, cucumber, olives, and fresh herbs',
          '• Cottage cheese bowl — cottage cheese with seasonal fruit, nuts, and honey, or savory with cucumber and tomato',
          '• Mezze breakfast plate — feta, olives, cucumber, tomato, hard-boiled egg, hummus, pita',
          '• Savory oats — oats cooked savory with feta, herbs, and a soft-poached egg on top',
          '• Tuna salad toast — Mediterranean tuna with olives, capers, lemon, parsley on whole-grain toast',
          '• Chia pudding — chia in Greek yogurt or almond milk with seasonal fruit and honey',
          '• Spanakopita-inspired eggs — eggs scrambled with spinach, feta, and dill',
        ].join('\n')
      } else if (highProteinMode) {
        // High protein — eggs and meat are priority. Sweet formats allowed but always
        // protein-boosted (Greek yogurt, cottage cheese, peanut butter, hemp seeds added).
        breakfastExamples = [
          '── SAVORY / EGG & MEAT (priority — maximize protein) ──',
          '• 3-egg scramble — 3 eggs soft-scrambled with a meat protein (turkey sausage crumbles, chicken sausage, bacon bits, ground turkey, or diced ham) + shredded cheddar or feta + vegetables',
          '• Steak and eggs — thin-cut sirloin or skirt steak strips seared alongside 3 fried or scrambled eggs',
          '• Ground turkey and egg skillet — seasoned ground turkey cooked with peppers and onion, topped with 2-3 fried eggs',
          '• Chicken and egg hash — diced cooked chicken breast + diced potato + peppers + 2 fried eggs on top',
          '• High-protein omelette (3-4 eggs) — filled with turkey sausage or chicken, low-fat cheese, spinach, peppers. 3-4 eggs minimum.',
          '• Egg white omelette with chicken — 4-5 egg whites filled with sliced chicken breast, spinach, and low-fat cheese',
          '• Turkey sausage and eggs — turkey sausage links or patties alongside 3 scrambled or fried eggs',
          '• Smoked salmon and eggs — smoked salmon plated with 3 scrambled or poached eggs and avocado',
          '• Breakfast protein bowl — 3 scrambled eggs + ground turkey or chicken sausage + roasted sweet potato or brown rice + shredded cheese',
          '• High-protein breakfast sandwich — 2-egg patty + turkey sausage or ham + low-fat cheese on whole-grain English muffin or toast',
          '• Egg muffins (batch) — 4-6 muffin-tin baked eggs with turkey, chicken, or ham + cheese + vegetables',
          '── SWEET (allowed — but always protein-boosted, no plain versions) ──',
          '• Protein oatmeal — rolled oats cooked in milk + 1/2 cup Greek yogurt stirred in + peanut butter + hemp seeds + fruit. Protein-forward, not plain oatmeal.',
          '• High-protein Greek yogurt parfait — 200g high-protein Greek yogurt (Skyr or 2% Greek) + granola + fresh fruit + peanut butter drizzle + hemp or chia seeds',
          '• Cottage cheese bowl — 1 cup full-fat or 2% cottage cheese + fresh fruit + honey + handful of almonds or walnuts. High protein, easy prep.',
          '• Protein smoothie — Greek yogurt base + peanut butter or almond butter + banana + milk + hemp seeds or chia seeds. Thick, protein-rich.',
          '• Cottage cheese pancakes — pancakes made from blended cottage cheese + eggs + oats (naturally high protein), topped with fresh fruit',
          '• Protein overnight oats — oats + Greek yogurt + chia seeds + milk + peanut butter + banana, prepped the night before',
        ].join('\n')
      } else if (carnivoreMode) {
        // All carnivore breakfasts are savory — no plant-based sweet options exist.
        // Organ meats should appear 1-2 times across the week.
        breakfastExamples = [
          '• Steak and eggs — any cut (ribeye, NY strip, skirt, T-bone, chuck) pan-seared in butter or tallow, with any egg prep alongside',
          '• Bacon and eggs — bacon strips cooked crispy, with fried, scrambled, poached, or soft-boiled eggs',
          '• Ground beef patty with eggs — seasoned beef patty seared in tallow, paired with eggs any style',
          '• Pork belly with eggs — pan-crisped pork belly slices alongside butter-basted eggs',
          '• Breakfast sausage and eggs — pork or beef breakfast sausage patties or links with eggs',
          '• Scrambled eggs with cheese — eggs beaten with heavy cream, slow-scrambled in butter, topped with melted cheddar or gruyère',
          '• Omelette — eggs folded with cheese (cheddar, gruyère, goat cheese) and bacon or meat inside',
          '• Smoked salmon and eggs — smoked salmon served alongside soft-boiled or poached eggs, butter-finished',
          '• Liver and eggs — pan-seared chicken or beef liver with fried or scrambled eggs (organ rotation — high nutrient density)',
          '• Chorizo and eggs — ground chorizo cooked in its own fat, scrambled with eggs',
          '• Prosciutto and eggs — prosciutto briefly crisped in butter, alongside any egg prep',
          '• Lamb patty with eggs — ground lamb seasoned with salt, cumin, and paprika, fried in tallow, served with eggs',
          '• Heavy cream scrambled eggs — eggs beaten with heavy cream, slow-cooked in butter for richness, optional cheddar melted in',
          '• Bone broth and steak strips — thin steak strips in a rich reduced bone broth, alongside soft-boiled eggs',
        ].join('\n')
      } else if (lowFodmapMode) {
        // IMPORTANT: sweet and savory are MUTUALLY EXCLUSIVE for low FODMAP breakfasts.
        // Sweet formats NEVER contain eggs or meat. Savory formats NEVER contain fruit.
        breakfastExamples = [
          '── SAVORY (eggs or protein — no fruit, no sweetener) ──',
          '• Scrambled eggs — soft scrambled on GF toast with spinach, tomato, or bell pepper (no garlic, no onion)',
          '• Omelette — with bell peppers, zucchini, spinach, tomato, and hard cheese (no garlic, no onion, no mushrooms)',
          '• Fried or poached eggs — on GF toast with sliced cucumber or wilted spinach',
          '• Potato and egg hash — diced potatoes + eggs + bell peppers + fresh herbs (no garlic or onion)',
          '• Smoked salmon plate — smoked salmon + soft-boiled eggs + cucumber + capers (no garlic, no onion)',
          '• Frittata — eggs baked with safe vegetables (bell peppers, zucchini, tomato, spinach)',
          '• Tofu scramble — firm tofu + turmeric + spinach + tomato on GF toast (no garlic, no onion)',
          '── SWEET (fruit/nut-based — NO egg ever, NO meat, NO cheese) ──',
          '• GF oatmeal — GF oats + safe fruit (banana, blueberries, strawberries) + peanut butter or safe nuts. NO egg.',
          '• LF yogurt bowl — lactose-free yogurt + safe granola + safe fruit (banana, blueberries, kiwi). NO egg.',
          '• Chia pudding — chia in LF milk + safe fruit + peanut butter or nuts. NO egg.',
          '• Smoothie — banana + LF milk + peanut butter + safe fruit (blueberries, strawberries). NO egg.',
          '• GF pancakes or French toast (sweet) — safe fruit topping. NO egg in the finished dish.',
          '• Quinoa porridge — cooked in LF milk + banana + peanut butter or cinnamon. NO egg.',
          '• Rice cake plate (sweet) — rice cakes + peanut butter + banana slices. NO egg.',
          '• Rice cake plate (savory) — rice cakes + hard cheese + cucumber slices + smoked salmon.',
        ].join('\n')
      } else {
        // Balanced / default — classic American breakfast variety.
        // Sweet and savory are mutually exclusive (rule 4 enforces this globally).
        breakfastExamples = [
          '── SAVORY (eggs or protein-forward — no fruit mixed in) ──',
          '• Scrambled eggs — soft and fluffy with any mix-in: cheese (cheddar, feta, goat cheese), herbs, vegetables (spinach, peppers, tomato, mushrooms, scallion), bacon bits, or smoked salmon',
          '• Fried eggs — sunny-side or over-easy, plated alongside bacon or sausage with toast, or over avocado',
          '• Omelette — folded with cheese melted inside, plus one of: ham and cheddar, spinach and feta, mushroom and Swiss, Western (ham, peppers, onion, cheddar), bacon and goat cheese, veggie-loaded',
          '• Poached eggs — over avocado toast with everything-bagel seasoning, over sautéed spinach, or with smoked salmon on toast',
          '• Shakshuka — eggs poached in spiced tomato and pepper sauce, topped with feta and herbs',
          '• Frittata or baked eggs — oven-baked with vegetables and cheese',
          '• Egg muffins or egg cups — baked in muffin tins with cheese, vegetables, or meat',
          '• Breakfast burrito or wrap — scrambled eggs + protein (bacon, sausage, or chicken) + cheese in a flour tortilla',
          '• Breakfast sandwich — egg + cheese + protein on English muffin, brioche, or toasted bagel',
          '• Breakfast skillet or hash — diced potatoes + eggs + protein (bacon, sausage, or ground beef) + peppers and onions, one pan',
          '• Smoked salmon plate — smoked salmon + cream cheese + cucumber + capers on toast or bagel',
          '• Avocado toast with egg — mashed avocado on whole-grain toast topped with a poached or fried egg',
          '── SWEET (fruit or syrup-based — no savory protein mixed in) ──',
          '• Greek yogurt parfait — full-fat Greek yogurt layered with granola, fresh fruit (berries, banana, peach), and a drizzle of honey',
          '• Oatmeal — rolled oats with any fruit, nut butter, nuts, honey, or cinnamon (vary toppings each time)',
          '• Overnight oats — oats soaked in milk or yogurt with chia seeds, fruit, and nut butter',
          '• Cottage cheese bowl — full-fat cottage cheese with fresh fruit and honey, or with granola',
          '• Chia pudding — chia seeds in milk or coconut milk with fruit and nuts',
          '• Smoothie bowl — thick blended smoothie topped with granola, fruit, coconut flakes, and seeds',
          '• Pancakes — classic buttermilk or whole-grain, stacked with fresh fruit or maple syrup',
          '• Waffles — crispy Belgian-style with fresh berries and yogurt or maple syrup',
          '• French toast — thick-cut brioche or sourdough dipped in egg and cinnamon, with fruit or maple syrup',
          '• Açaí bowl — blended açaí base topped with granola, banana, berries, and honey',
        ].join('\n')
      }

      // ── Lunch format inspiration per diet ────────────────────────────────
      let lunchExamples: string
      if (ketoMode) {
        lunchExamples = [
          '• Protein-and-greens salad — grilled or pan-seared protein over leafy greens (romaine, arugula, spinach, mixed), olive oil and lemon dressing, no croutons or grains',
          '• Lettuce wraps — seasoned ground beef, ground turkey, or shredded chicken + crunchy veg wrapped in iceberg or butter lettuce',
          '• Stuffed bell pepper or mushroom cap — ground beef or turkey mixed with cheese and vegetables, baked',
          '• Keto soup — creamy broth-based with protein and non-starchy vegetables (no potatoes, no noodles, no grains)',
          '• Cold plate — sliced cured meats (salami, prosciutto, chorizo) + hard cheeses + olives + raw vegetables + pickles',
          '• Egg or tuna salad — mixed with mayo and celery, served in avocado halves or over mixed greens',
          '• Bunless burger or meatball plate — served over greens or alongside roasted vegetables',
          '• Protein bowl — grilled or sautéed protein over a base of roasted vegetables (broccoli, cauliflower, bell peppers, zucchini)',
          '• Chicken or steak Caesar — grilled protein over romaine, parmesan, Caesar dressing (no croutons)',
          '• Bacon and egg salad — chopped bacon, hard-boiled egg, avocado, over greens with ranch or vinaigrette',
          '• Zucchini boat or stuffed avocado — filled with seasoned ground meat and cheese (occasionally)',
        ].join('\n')
      } else if (veganMode) {
        lunchExamples = [
          '• Grain bowls — farro, quinoa, or rice + plant protein + roasted or raw veg',
          '• Bean or lentil soup or stew',
          '• Wraps or sandwiches — plant protein + veg in tortilla or bread',
          '• Hearty salads with tofu, tempeh, chickpeas, or beans',
          '• Stir-fries over rice or noodles',
          '• Stuffed vegetables — peppers or squash filled with grain and bean mix',
          '• Buddha bowls — assorted veg + grain + tahini or sauce',
          '• Noodle dishes — soba, rice noodles, or pasta with plant protein',
        ].join('\n')
      } else if (vegetarianMode) {
        lunchExamples = [
          '• Sandwiches or wraps — egg, cheese, or vegetable filling',
          '• Grain bowls — quinoa or rice + roasted veg + cheese or egg',
          '• Soups — tomato, lentil, minestrone, or creamy vegetable',
          '• Salads with cheese, egg, or legumes as the protein',
          '• Quesadillas or flatbreads with cheese and vegetables',
          '• Pasta with a vegetarian sauce',
          '• Stir-fries with tofu or tempeh over rice',
          '• Frittata or savory egg bake with salad',
        ].join('\n')
      } else if (pescatarianMode) {
        lunchExamples = [
          '• Fish sandwiches or wraps — grilled, baked, or pan-seared fish',
          '• Grain bowls with fish or shrimp over rice or farro',
          '• Salads with tuna, salmon, or shrimp',
          '• Seafood soup or chowder',
          '• Fish tacos or poke-style bowls',
          '• Pasta with seafood sauce',
          '• Sushi-style rice bowls',
          '• Smoked salmon or tuna on crackers or toast with sides',
        ].join('\n')
      } else if (paleoMode) {
        lunchExamples = [
          '• Protein-and-vegetables salad over leafy greens',
          '• Lettuce wraps with grilled or ground meat',
          '• Broth-based soups with meat and vegetables, no grains',
          '• Hash or skillet — ground meat + roasted vegetables',
          '• Grilled protein plate with two vegetable sides',
          '• Sweet potato bowl with protein on top',
          '• Cold plate — sliced meats + raw or roasted veg',
          '• Stuffed vegetables with ground meat filling',
        ].join('\n')
      } else if (mediterraneanMode) {
        lunchExamples = [
          '• Greek salad with grilled protein — feta, cucumber, tomato, olives, red onion, olive oil, with grilled chicken, fish, or shrimp',
          '• Grain bowls — farro, bulgur, freekeh, or quinoa + roasted vegetables + protein + tahini or lemon-olive-oil dressing',
          '• Pita-based — grilled chicken, falafel, or kebab pita with hummus, vegetables, tzatziki',
          '• Lentil or chickpea stew — Moroccan, Greek, or Italian style',
          '• Tabbouleh or fattoush — herb-heavy bulgur or pita salad with grilled protein',
          '• Fish plate — grilled white fish, salmon, or sardines with vegetables, lemon, herbs',
          '• Stuffed vegetables — peppers, tomatoes, or grape leaves with grain and protein filling',
          '• Mezze plate lunch — hummus, baba ganoush, tabbouleh, olives, feta, pita, grilled protein',
          '• Whole-grain pasta with seafood or beans, olive oil, herbs (no cream sauces)',
          '• Niçoise-style salad — tuna, olives, eggs, green beans, potatoes',
          '• Shawarma or souvlaki bowl with grain, salad, hummus, tzatziki',
        ].join('\n')
      } else if (highProteinMode) {
        lunchExamples = [
          '── HIGH-PROTEIN SALADS ──',
          '• Grilled chicken protein salad — large grilled chicken breast over mixed greens, chickpeas, cucumber, cherry tomato, avocado, lemon-olive oil dressing',
          '• Tuna power salad — 2 cans tuna over romaine or mixed greens with hard-boiled eggs, white beans, olives, lemon vinaigrette',
          '• Steak and arugula salad — sliced sirloin or flank steak over arugula, parmesan, cherry tomato, balsamic — protein-loaded',
          '• Shrimp salad bowl — grilled or sautéed shrimp over mixed greens with avocado, cucumber, mango, lime dressing',
          '• Cobb salad (loaded) — grilled chicken, bacon, hard-boiled egg, avocado, blue cheese, tomato, romaine — high-protein classic',
          '── HIGH-PROTEIN BOWLS ──',
          '• Chicken and brown rice bowl — large grilled or baked chicken breast over brown rice with roasted broccoli and teriyaki or garlic sauce',
          '• Ground turkey taco bowl — seasoned ground turkey over brown rice or quinoa, black beans, pico, avocado, shredded cheese — double the turkey',
          '• Salmon and quinoa bowl — baked or pan-seared salmon fillet over quinoa with roasted vegetables and lemon-dill sauce',
          '• Shrimp and rice bowl — garlic butter shrimp over brown rice with sautéed peppers and a squeeze of lime',
          '• Lean beef and rice bowl — seasoned lean ground beef or sliced flank steak over rice with cucumber, edamame, sesame-soy glaze',
          '• Cottage cheese power bowl — 1 cup cottage cheese + quinoa + cucumber + cherry tomato + hemp seeds + olive oil (savory, no cooking)',
          '── HIGH-PROTEIN WRAPS & SANDWICHES ──',
          '• Double chicken wrap — grilled chicken breast, black beans, shredded cheese, salsa, avocado in a whole-wheat tortilla',
          '• Turkey and cottage cheese wrap — sliced turkey breast, cottage cheese, spinach, cucumber, avocado in a wrap',
          '• High-protein chicken sandwich — seasoned chicken breast, avocado, lettuce, tomato on whole-grain bread',
          '• Tuna melt — tuna salad with melted cheddar on whole-grain toast, side of cottage cheese',
          '── QUICK PLATES ──',
          '• Chicken breast and sweet potato — baked chicken breast + roasted sweet potato + steamed broccoli. Simple, high protein.',
          '• Ground turkey stir-fry — seasoned ground turkey + broccoli + peppers over brown rice or quinoa',
          '• Egg and chicken fried rice — brown rice stir-fried with 3 eggs + diced chicken breast + vegetables + soy sauce',
        ].join('\n')
      } else if (carnivoreMode) {
        lunchExamples = [
          '• Burger patties — seasoned ground beef patties seared in tallow, no bun, no sides — pure protein',
          '• Sliced steak plate — thin-cut or leftover steak served simply with salt and butter',
          '• Ground beef bowl — seasoned ground beef cooked with tallow, salt, and pepper — no grain base',
          '• Pork chop plate — pan-seared or grilled pork chop, finished with butter',
          '• Chicken thighs — crispy skin-on thighs cooked in tallow or butter, nothing else',
          '• Salmon plate — pan-seared or baked salmon fillet with butter and lemon-free seasoning',
          '• Lamb mince — ground lamb seasoned with salt, cumin, paprika, cooked in tallow',
          '• Organ meat plate — pan-seared liver, heart, or kidney with butter sauce (nutrient-dense rotation)',
          '• Ground beef and bacon mix — two proteins cooked together, pure carnivore plate',
          '• Shrimp or scallop plate — pan-seared in butter with salt and pepper only',
          '• Canned tuna or salmon — packed in water or olive oil, eaten straight or mixed with butter',
        ].join('\n')
      } else if (lowFodmapMode) {
        lunchExamples = [
          '• Protein-and-safe-vegetables salad (no garlic or onion in dressing)',
          '• Rice bowl with protein and safe vegetables',
          '• Gluten-free wrap or sandwich',
          '• Safe broth-based soup with protein and vegetables',
          '• Rice noodle bowl with protein',
          '• Baked or grilled protein + potato or rice side',
          '• Quinoa bowl with protein and safe vegetables',
          '• GF pasta with safe sauce and protein',
        ].join('\n')
      } else {
        // Balanced — wide variety, practical, 20 min max, lots of salad + bowl + sandwich options
        lunchExamples = [
          '── SALADS (protein required) ──',
          '• Classic Cobb salad — grilled chicken, bacon, hard-boiled egg, avocado, tomato, blue cheese, romaine',
          '• Caesar salad — grilled or crispy chicken, romaine, parmesan, croutons, Caesar dressing',
          '• Southwest chicken salad — grilled chicken, black beans, corn, avocado, pico, shredded cheese, chipotle dressing',
          '• Greek salad with protein — chicken or shrimp over cucumber, tomato, olives, red onion, feta, olive oil',
          '• Asian sesame salad — grilled chicken or steak over shredded cabbage, edamame, cucumber, carrot, sesame ginger dressing',
          '• Steak salad — sliced flank or sirloin over arugula or mixed greens, cherry tomato, blue cheese or parmesan, balsamic',
          '• BLT salad — crumbled bacon, cherry tomatoes, romaine, avocado, creamy dressing',
          '• Salmon salad — seared or canned salmon over mixed greens with cucumber, capers, lemon vinaigrette',
          '• Tuna salad bowl — tuna mixed with celery, mayo, dijon, over greens or in an avocado half',
          '── SANDWICHES & WRAPS ──',
          '• Turkey and avocado wrap — sliced turkey, avocado, lettuce, tomato, in a whole-wheat tortilla',
          '• Chicken Caesar wrap — grilled chicken, romaine, parmesan, Caesar dressing in a flour tortilla',
          '• BLT sandwich — bacon, lettuce, tomato, mayo on toasted sourdough or brioche',
          '• Grilled chicken sandwich — seasoned chicken breast, lettuce, tomato, avocado on a bun',
          '• Club sandwich — turkey, ham, bacon, lettuce, tomato, Swiss on toasted white or wheat',
          '• Steak and cheese wrap — thin-sliced steak, peppers, onion, provolone in a flour tortilla',
          '• Tuna melt — tuna salad with melted cheddar on toasted sourdough',
          '── BOWLS & HOT PLATES ──',
          '• Burrito bowl — ground beef or chicken, cilantro-lime rice, black beans, pico, guacamole, shredded cheese',
          '• Korean BBQ bowl — ground beef or chicken with soy-sesame glaze over white rice, cucumber, shredded carrot',
          '• Chicken rice bowl — baked or pan-seared chicken thighs over rice with roasted vegetables and a sauce',
          '• Steak rice bowl — sliced sirloin or flank over rice with sautéed peppers, onion, and a chimichurri or teriyaki glaze',
          '• Ground turkey taco bowl — seasoned ground turkey, black beans, corn, pico, avocado over rice or greens',
          '• Shrimp bowl — sautéed shrimp over rice or cauliflower rice with mango salsa or garlic butter sauce',
          '• Grain bowl — farro or quinoa + roasted vegetables + a protein + tahini or vinaigrette',
          '• Pasta salad — rotini or penne with chicken or salami, olives, cherry tomato, artichoke hearts, Italian dressing',
          '• Bacon and egg fried rice — day-old rice stir-fried with eggs, bacon, scallion, soy sauce',
          '── SOUPS ──',
          '• Chicken noodle or chicken and rice soup',
          '• Turkey or beef chili — topped with shredded cheese and sour cream',
          '• Tomato soup with a grilled cheese sandwich',
          '• Black bean soup with sour cream and tortilla chips',
        ].join('\n')
      }

      // ── Lunch format tracking (mirrors breakfast varietyContext) ─────────
      // Detects which format categories keep appearing in this slot's swap
      // history so the AI is explicitly told to pick a genuinely different one.
      const LUNCH_FORMAT_TERMS: Record<string, string[]> = {
        'protein-over-greens salad': ['over arugula', 'over mixed greens', 'over baby spinach', 'over romaine', 'over greens', 'salad over', 'over leafy', 'salad with arugula', 'salad with mixed greens', 'salad with baby spinach', 'salad with spinach'],
        'Caesar salad': ['caesar'],
        'lettuce wraps': ['lettuce wrap'],
        'stuffed vegetable': ['stuffed bell pepper', 'stuffed mushroom', 'stuffed pepper', 'stuffed zucchini', 'stuffed avocado', 'zucchini boat'],
        'soup/stew/chili': [' soup', ' stew', 'chowder', 'chili'],
        'cold plate/charcuterie': ['cold plate', 'charcuterie'],
        'bunless burger/meatball': ['bunless', 'meatball plate', 'burger patty', 'meatball'],
        'protein bowl (roasted veg)': ['protein bowl', 'over roasted veg', 'over cauliflower', 'over roasted broccoli', 'veggie bowl'],
        'grain/rice bowl': ['rice bowl', 'grain bowl', 'quinoa bowl', 'farro bowl', 'burrito bowl', 'taco bowl', 'poke bowl', 'bibimbap'],
        'sandwich/wrap/pita': ['sandwich', ' wrap', ' pita', 'flatbread', 'shawarma', 'souvlaki'],
        'pasta/noodles': ['pasta', ' noodle', 'soba', 'udon'],
        'egg/tuna/chicken salad': ['egg salad', 'tuna salad in', 'chicken salad in'],
        'stir-fry': ['stir-fry', 'stir fry'],
        'hash/skillet': ['hash', 'skillet'],
      }

      // Include both current-slot swap history and other week lunches so the
      // AI sees the full recent format landscape.
      const allLunchNamesFmt = [
        ...rawWeekMeals.filter(m => m.meal_type === 'lunch').map(m => m.meal_name.toLowerCase()),
        ...currentSlotMeals.map((n: string) => n.toLowerCase()),
      ]

      const usedLunchFormats = Object.entries(LUNCH_FORMAT_TERMS)
        .map(([fmt, terms]) => ({ fmt, count: allLunchNamesFmt.filter(n => terms.some(t => n.includes(t))).length }))
        .filter(x => x.count > 0)
      const unusedLunchFormats = Object.keys(LUNCH_FORMAT_TERMS).filter(f => !usedLunchFormats.some(u => u.fmt === f))

      const lunchVarietyParts: string[] = []
      // Even 1 prior use of a format warrants steering away from it on a swap.
      if (usedLunchFormats.length > 0 && currentSlotMeals.length > 0) {
        const used = usedLunchFormats.map(f => `${f.fmt} (${f.count}x)`).join(', ')
        const alts = unusedLunchFormats.slice(0, 6).join(', ')
        lunchVarietyParts.push(`Format${usedLunchFormats.length > 1 ? 's' : ''} already used: ${used}`)
        if (alts) lunchVarietyParts.push(`Pick a DIFFERENT format from: ${alts}`)
        // Escalate to hard ban after 2+ uses of the same format
        const banned = usedLunchFormats.filter(f => f.count >= 2)
        if (banned.length > 0) {
          lunchVarietyParts.push(`BANNED (used too many times): ${banned.map(f => f.fmt).join(', ')}. Do NOT generate these again. You MUST use a format from the unused list.`)
        }
      }

      const lunchVarietyContext = lunchVarietyParts.length > 0
        ? `\nLUNCH VARIETY CONTEXT — recent swap history for this slot:\n${lunchVarietyParts.map(p => `- ${p}`).join('\n')}\nPick a format that has NOT been used yet. Do not vary the same format with different greens or dressing names — that is not variety.\n`
        : ''

      // ── 30-day meal history (prevents long-term name repetition) ─────────
      const historyByType: Record<string, string[]> = { breakfast: [], lunch: [], dinner: [] }
      for (const m of mealHistory ?? []) {
        const name = m.meal_name as string | null
        if (name && m.meal_type in historyByType && !historyByType[m.meal_type].includes(name)) {
          historyByType[m.meal_type].push(name)
        }
      }
      const historyLines: string[] = []
      for (const mt of activeMealTypes) {
        const names = historyByType[mt]
        if (names.length > 0) {
          historyLines.push(`${mt.charAt(0).toUpperCase() + mt.slice(1)}s: ${names.slice(0, 40).join(', ')}`)
        }
      }
      const historyContext = historyLines.length > 0
        ? `MEAL HISTORY — last 30 days — NEVER repeat any of these exact meal names:\n${historyLines.join('\n')}\n\n`
        : ''

      // Persistent user-wide rejection list (survives sessions and devices).
      // These are meals the user has actively swapped away from — the AI must
      // never regenerate them or close variations (different protein,
      // different format, different framing).
      const rejectionContext = persistentRejections.length > 0
        ? `BANNED MEALS — the user has REJECTED these by swapping them away. Do NOT generate any of these names again, and do NOT generate close variations (e.g. if "Greek yogurt bowl with peaches and pistachios" is banned, also avoid "Greek yogurt with peach and pistachios", "Greek yogurt parfait with peaches and pistachios", etc.). Use a different format AND different main ingredients:\n${persistentRejections.slice(-100).join('\n')}\n\n`
        : ''

      // Scan existing week breakfast names for already-used fruits/nuts.
      // Each swap is a separate API call — this makes the ban span the whole week
      // so the same fruit/nut doesn't appear in multiple sweet breakfasts.
      const FRUIT_TERMS = ['raspberry','raspberries','blueberry','blueberries','strawberry','strawberries','mango','kiwi','apple','peach','peaches','pear','pineapple','banana','cherry','cherries','plum','grape','grapes','papaya','melon','fig','pomegranate']
      const NUT_TERMS   = ['almond','almonds','walnut','walnuts','pecan','pecans','pistachio','pistachios','cashew','cashews','hazelnut','hazelnuts','macadamia','pine nut','pine nuts']

      // Include rejected meals (prior swap attempts on this slot) alongside
      // the current DB breakfasts so variety detection spans the full history.
      const allBfNames = [
        ...rawWeekMeals.filter(m => m.meal_type === 'breakfast').map(m => m.meal_name.toLowerCase()),
        ...(rejectedMeals as string[]).map((n: string) => n.toLowerCase()),
      ]

      const weekUsedFruits = FRUIT_TERMS.filter(f => allBfNames.some(n => n.includes(f)))
      const weekUsedNuts   = NUT_TERMS.filter(n  => allBfNames.some(name => name.includes(n)))

      // ── Universal breakfast format catalog ───────────────────────────────────
      // Single source for ALL diets — no more diet-specific parallel structures.
      // 'egg-cup' hyphenated + 'egg cup' spaced both included (AI uses both forms).
      const BREAKFAST_FORMAT_TERMS: Record<string, string[]> = {
        'scrambled eggs':        ['scrambled egg'],
        'fried/sunny eggs':      ['fried egg', 'pan-fried egg', 'sunny-side', 'sunny side', 'over-easy', 'over easy'],
        'poached eggs':          ['poached egg', 'eggs benedict'],
        'soft/hard-boiled eggs': ['boiled egg', 'soft-boiled', 'hard-boiled', 'soft boiled', 'hard boiled'],
        'omelette':              ['omelette', 'omelet'],
        'frittata':              ['frittata'],
        'shakshuka':             ['shakshuka'],
        'egg cups/muffins':      ['egg cup', 'egg-cup', 'egg muffin'],
        'baked eggs':            ['baked egg'],
        'Greek yogurt bowl':     ['greek yogurt'],
        'cottage cheese bowl':   ['cottage cheese'],
        'chia pudding':          ['chia pudding'],
        'oatmeal/porridge':      ['oatmeal', 'overnight oat', 'porridge', 'congee'],
        'smoothie':              ['smoothie'],
        'toast-based':           [' toast with', 'on toast', 'avocado toast', 'labneh toast', 'ricotta toast', 'hummus toast'],
        'pancakes/waffles':      ['pancake', 'waffle', 'french toast', 'chaffle'],
        'hash/skillet':          ['hash', 'skillet'],
        'cold/mezze plate':      ['charcuterie', 'mezze', 'cold plate', 'breakfast plate'],
        'smoked salmon plate':   ['smoked salmon plate', 'smoked salmon with'],
        'halloumi':              ['halloumi'],
        'burrito/wrap':          ['burrito', 'breakfast wrap'],
        'tofu scramble':         ['tofu scramble'],
        'yogurt parfait':        ['yogurt parfait', 'parfait'],
        'acai/smoothie bowl':    ['acai bowl', 'smoothie bowl', 'pitaya'],
      }
      // Fine-grained egg-prep sub-tracking (fires in addition to format tracking
      // for egg-heavy diets — prevents "all fried" even within the egg-based bucket).
      const EGG_PREPS: Record<string, string[]> = {
        'fried':       ['fried egg', 'pan-fried egg'],
        'sunny-side':  ['sunny-side', 'sunny side', 'over-easy', 'over easy'],
        'scrambled':   ['scrambled egg'],
        'poached':     ['poached egg', 'eggs benedict'],
        'boiled':      ['boiled egg', 'soft-boiled', 'hard-boiled', 'soft boiled', 'hard boiled'],
        'omelette':    ['omelette', 'omelet'],
        'frittata':    ['frittata'],
        'shakshuka':   ['shakshuka'],
        'egg cups':    ['egg cup', 'egg-cup', 'egg muffin'],
        'baked eggs':  ['baked egg'],
      }
      // Breakfast meat tracking (keto / paleo / default — not Mediterranean/vegetarian/vegan)
      const BREAKFAST_MEAT_TERMS = [
        'turkey sausage','chicken sausage','beef sausage','pork sausage','breakfast sausage',
        'bacon','pork belly','ham','chorizo','pancetta','prosciutto',
        'ground turkey','ground chicken','ground beef',
        'steak','beef patty','turkey patty','chicken patty',
        'smoked salmon',
      ]
      // Breakfast-appropriate vegetables — diet-aware.
      // Mediterranean uses olive/arugula in place of jalapeño/mushroom.
      // Dinner veg (asparagus, broccoli, cauliflower, brussels sprouts, collard
      // greens, zucchini) excluded from both lists.
      const VEG_TERMS = carnivoreMode
        ? []  // carnivore has no vegetables — skip vegetable variety tracking entirely
        : mediterraneanMode
        ? ['tomato','cucumber','spinach','pepper','olive','arugula','avocado','scallion']
        : ['avocado','pepper','jalapeño','tomato','mushroom','spinach','cucumber','scallion']
      const CHEESE_TERMS = ['cheddar','feta','goat cheese','cream cheese','mozzarella','parmesan',
        'cotija','swiss','gruyère','gruyere','manchego','ricotta','labneh','halloumi','cheese']

      // ── Compute usage counts ──────────────────────────────────────────────
      const usedFormats = Object.entries(BREAKFAST_FORMAT_TERMS)
        .map(([fmt, terms]) => ({ fmt, count: allBfNames.filter(n => terms.some(t => n.includes(t))).length }))
        .filter(x => x.count > 0)
      const unusedFormats = Object.keys(BREAKFAST_FORMAT_TERMS).filter(f => !usedFormats.some(u => u.fmt === f))
      const usedEggPreps = Object.entries(EGG_PREPS)
        .map(([prep, terms]) => ({ prep, count: allBfNames.filter(n => terms.some(t => n.includes(t))).length }))
        .filter(x => x.count > 0)
      const unusedEggPreps = Object.keys(EGG_PREPS).filter(p => !usedEggPreps.some(u => u.prep === p))
      const usedMeats = BREAKFAST_MEAT_TERMS.map(p => ({ term: p, count: allBfNames.filter(n => n.includes(p)).length })).filter(x => x.count > 0)
      const usedVeg   = VEG_TERMS.map(v => ({ term: v, count: allBfNames.filter(n => n.includes(v)).length })).filter(x => x.count > 0)

      const totalBfCount = allBfNames.length
      const eggBfCount = allBfNames.filter(n => Object.values(EGG_PREPS).some(terms => terms.some(t => n.includes(t)))).length

      const varietyParts: string[] = []

      // 1. Universal format-repeat detection (fires for every diet)
      const overusedFormats = usedFormats.filter(f => f.count >= 2)
      if (overusedFormats.length > 0) {
        const used = overusedFormats.map(f => `${f.fmt} (${f.count}x)`).join(', ')
        const alts = unusedFormats.slice(0, 8).join(', ')
        varietyParts.push(`Breakfast format overused: ${used} — pick a DIFFERENT format type: ${alts}`)
      }

      // 2. Fine-grained egg prep tracking (surfaces unused egg styles)
      if (usedEggPreps.length > 0) {
        const used = usedEggPreps.map(p => `${p.prep} (${p.count}x)`).join(', ')
        const alts = unusedEggPreps.length > 0 ? ` — try: ${unusedEggPreps.join(', ')}` : ''
        varietyParts.push(`Egg preparations used: ${used}${alts}`)
      }

      // 3. Non-egg nudge (all non-vegan diets when heavily egg-based)
      if (!veganMode && totalBfCount >= 4 && eggBfCount / totalBfCount >= 0.8) {
        const nonEggOptions = carnivoreMode
          ? 'steak plate, ground beef patties, pork belly, smoked salmon, liver plate, lamb patty, prosciutto plate, bacon-only plate'
          : highProteinMode
          ? 'protein oatmeal (Greek yogurt stirred in), cottage cheese bowl, high-protein smoothie, cottage cheese pancakes, protein overnight oats, Greek yogurt parfait with hemp seeds'
          : mediterraneanMode
          ? 'Greek yogurt bowl, labneh toast, ricotta toast, hummus toast, smoked salmon plate, halloumi plate, mezze plate, avocado toast, savory oats, chia pudding, cottage cheese bowl'
          : ketoMode
          ? 'Greek yogurt bowl, cottage cheese bowl, smoked salmon plate, charcuterie plate, cream cheese pancakes, chia pudding, avocado boat'
          : 'Greek yogurt bowl, smoothie bowl, oatmeal, toast-based, pancakes, cottage cheese bowl, chia pudding, hash'
        varietyParts.push(`Recent breakfasts heavily egg-based (${eggBfCount}/${totalBfCount}) — consider a NON-EGG format: ${nonEggOptions}`)
      }

      // 4. Meat protein overuse / underuse (keto / paleo / default — not Mediterranean)
      if (!veganMode && !vegetarianMode && !mediterraneanMode && !pescatarianMode) {
        if (usedMeats.length > 0) {
          const overused = usedMeats.filter(p => p.count >= 2)
          if (overused.length > 0) {
            const used = overused.map(p => `${p.term} (${p.count}x)`).join(', ')
            varietyParts.push(`Supporting proteins overused: ${used} — pick a different meat from: ${BREAKFAST_MEAT_TERMS.join(', ')}`)
          }
        }
        if (totalBfCount >= 3) {
          const underused = ['ground beef','ground turkey','ground chicken','beef patty','steak','smoked salmon']
            .filter(t => !usedMeats.some(u => u.term === t))
          if (underused.length > 0) {
            varietyParts.push(`Proteins not yet used: ${underused.join(', ')} — consider rotating one of these in`)
          }
        }
      }

      // 5. Mediterranean-specific protein underuse (smoked salmon, halloumi, tuna)
      if (mediterraneanMode && totalBfCount >= 3) {
        const MED_PROTEINS = ['smoked salmon','halloumi','tuna','labneh','ricotta']
        const unusedMedProteins = MED_PROTEINS.filter(p => !allBfNames.some(n => n.includes(p)))
        if (unusedMedProteins.length > 0) {
          varietyParts.push(`Mediterranean proteins not yet used: ${unusedMedProteins.join(', ')} — consider rotating one in`)
        }
      }

      // 6. Avocado nudge (keto + Mediterranean — staple ingredient, often skipped; not carnivore)
      if ((ketoMode || mediterraneanMode) && !carnivoreMode && totalBfCount >= 2) {
        if (!allBfNames.some(n => n.includes('avocado'))) {
          varietyParts.push('Avocado not yet used — it\'s a staple for this diet (avocado toast, sliced alongside eggs, in a bowl, or stuffed)')
        }
      }

      // 7. Cheese nudge (all dairy-eating diets — not vegan / paleo / carnivore)
      // Carnivore already handles dairy rotation in its hard rules
      if (!veganMode && !paleoMode && !carnivoreMode && totalBfCount >= 2) {
        if (!allBfNames.some(n => CHEESE_TERMS.some(c => n.includes(c)))) {
          const cheeseHint = mediterraneanMode
            ? 'feta, halloumi, ricotta, or labneh — melted or crumbled INTO the dish'
            : 'cheddar, feta, goat cheese, gruyère, or ricotta — include it in the meal name'
          varietyParts.push(`No cheese in recent breakfasts — include ${cheeseHint}`)
        }
      }

      // 8. Omelette nudge — escalates to "MUST" after 4+ swaps without one
      if (!veganMode && totalBfCount >= 3) {
        if (!allBfNames.some(n => n.includes('omelette') || n.includes('omelet'))) {
          const variations = mediterraneanMode
            ? 'Greek (feta + spinach + tomato), Mediterranean (feta + olives + sun-dried tomato), Spanish (chorizo + peppers + manchego), three-cheese (feta + mozzarella + parmesan), goat cheese and herbs, smoked salmon and dill, halloumi and tomato, mushroom and herbs, roasted pepper and feta'
            : ketoMode
            ? 'Western (ham + peppers + cheddar), Greek (feta + spinach), goat cheese and mushroom, Spanish (chorizo + manchego), smoked salmon and cream cheese, jalapeño popper, mushroom and Swiss'
            : 'mushroom and cheese, spinach and feta, ham and cheddar, vegetable medley, herb and goat cheese'
          const directive = totalBfCount >= 4
            ? `PRIORITIZE an omelette for this generation — zero omelettes in ${totalBfCount} attempts. Pick one of these variations:`
            : 'No omelette yet — consider one. Variations:'
          varietyParts.push(`${directive} ${variations}`)
        }
      }

      // 9. Mediterranean signature ingredients
      if (mediterraneanMode && totalBfCount >= 2) {
        if (!allBfNames.some(n => n.includes('tomato')) && !allBfNames.some(n => n.includes('cucumber'))) {
          varietyParts.push('Neither tomato nor cucumber used yet — signature Mediterranean breakfast ingredients; appear in most savory dishes')
        }
        if (totalBfCount >= 3 && !allBfNames.some(n => n.includes('olive'))) {
          varietyParts.push('Olives not yet used — signature Mediterranean ingredient (mezze plates, labneh toast, shakshuka, with eggs)')
        }
      }

      // 10. Carnivore variety nudges — organ meat rotation + cut diversity
      if (carnivoreMode && totalBfCount >= 2) {
        const ORGAN_TERMS = ['liver','heart','kidney','oxtail','tongue','cheek']
        if (!allBfNames.some(n => ORGAN_TERMS.some(t => n.includes(t)))) {
          varietyParts.push('No organ meats yet — liver and eggs or heart is a carnivore staple; consider rotating one in for nutrient density')
        }
        const CUT_TERMS = ['ribeye','ny strip','skirt','t-bone','chuck','brisket','sirloin','flank']
        if (totalBfCount >= 3 && !allBfNames.some(n => CUT_TERMS.some(t => n.includes(t)))) {
          varietyParts.push('No named steak cuts yet — rotate in a specific cut: ribeye, NY strip, skirt steak, T-bone, or chuck')
        }
      }

      // 11. High protein variety nudges
      if (highProteinMode && totalBfCount >= 2) {
        const HP_MEAT_TERMS = ['ground turkey','chicken','steak','ham','bacon','turkey sausage','chicken sausage','smoked salmon','sausage']
        const hasMeatBreakfast = allBfNames.some(n => HP_MEAT_TERMS.some(t => n.includes(t)))
        if (!hasMeatBreakfast) {
          varietyParts.push('No meat protein at breakfast yet — add a meat-forward format: steak and eggs, ground turkey skillet, turkey sausage and eggs, chicken hash, breakfast protein bowl')
        }
        const HP_SWEET_TERMS = ['oatmeal','overnight oat','yogurt','cottage cheese bowl','smoothie','pancake','chia pudding']
        const HP_SAVORY_TERMS = ['scramble','omelette','omelet','fried egg','poached egg','skillet','hash','egg white','steak and egg','sandwich','muffin']
        const hasSweetHp = allBfNames.some(n => HP_SWEET_TERMS.some(t => n.includes(t)))
        const hasSavoryHp = allBfNames.some(n => HP_SAVORY_TERMS.some(t => n.includes(t)))
        if (hasSweetHp && !hasSavoryHp) {
          varietyParts.push('Only sweet breakfasts so far — add a SAVORY high-protein format: 3-egg scramble with turkey, steak and eggs, ground turkey skillet, high-protein omelette')
        } else if (!hasSweetHp && hasSavoryHp && totalBfCount >= 3) {
          varietyParts.push('All savory so far — consider a protein-boosted SWEET format: protein oatmeal with Greek yogurt stirred in, cottage cheese bowl, high-protein smoothie, protein overnight oats')
        }
        if (totalBfCount >= 3 && !allBfNames.some(n => n.includes('cottage cheese') || n.includes('greek yogurt') || n.includes('skyr'))) {
          varietyParts.push('No high-protein dairy at breakfast yet — cottage cheese bowl or Greek yogurt parfait are fast, high-protein formats worth rotating in')
        }
      }

      // 12. Low FODMAP sweet/savory balance nudge
      if (lowFodmapMode && totalBfCount >= 2) {
        const FODMAP_SWEET_TERMS = ['oatmeal', 'overnight oat', 'chia pudding', 'smoothie', 'yogurt', 'parfait', 'pancake', 'waffle', 'french toast', 'quinoa porridge', 'rice cake', 'granola']
        const FODMAP_SAVORY_TERMS = ['scrambled egg', 'fried egg', 'poached egg', 'omelette', 'frittata', 'hash', 'skillet', 'smoked salmon', 'egg muffin', 'egg cup', 'tofu scramble']
        const hasSweetFodmap = allBfNames.some(n => FODMAP_SWEET_TERMS.some(t => n.includes(t)))
        const hasSavoryFodmap = allBfNames.some(n => FODMAP_SAVORY_TERMS.some(t => n.includes(t)))
        if (hasSweetFodmap && !hasSavoryFodmap) {
          varietyParts.push('Only sweet FODMAP breakfasts so far — add a SAVORY format: scrambled eggs on GF toast, omelette with bell peppers and spinach, potato hash, smoked salmon plate')
        } else if (!hasSweetFodmap && hasSavoryFodmap) {
          varietyParts.push('Only savory FODMAP breakfasts so far — add a SWEET format: GF oatmeal with blueberries, LF yogurt bowl with fruit, chia pudding, smoothie (NO egg added to any of these)')
        }
      }

      // 14. Vegetable overuse (universal)
      if (usedVeg.length > 0) {
        const overused = usedVeg.filter(v => v.count >= 2)
        if (overused.length > 0) {
          const used = overused.map(v => `${v.term} (${v.count}x)`).join(', ')
          const unused = VEG_TERMS.filter(v => !usedVeg.some(u => u.term === v))
          const fallback = mediterraneanMode
            ? 'tomatoes, cucumber, spinach, peppers, olives, arugula, avocado, scallion'
            : 'avocado, bell peppers, jalapeño, cherry tomatoes, mushrooms, spinach, cucumber, scallion'
          varietyParts.push(`Vegetables overused: ${used} — pick a different vegetable: ${unused.length > 0 ? unused.slice(0, 8).join(', ') : fallback}`)
        }
      }

      const varietyContext = varietyParts.length > 0
        ? `\nVARIETY CONTEXT — breakfasts generated so far:\n${varietyParts.map(p => `- ${p}`).join('\n')}\nFor this breakfast: pick a DIFFERENT format type, a different protein, and different vegetables. Do not rearrange the same components.\n`
        : ''

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
- Every meal name must be unique. No duplicates or near-duplicates.
- Each main protein used AT MOST ONCE across ALL meals in this response — no exceptions.
- Each cooking method (baked, grilled, pan-seared, stir-fried, etc.) AT MOST TWICE.
- Breakfasts should feel genuinely different from each other — different protein, different style, different format.
- Lunches should feel genuinely different from each other — different protein, different format, different flavor profile.
- ONLY generate meals for the slots listed below. Do not add extras.

GUT HEALTH: Whole foods, anti-inflammatory, varied vegetables. Avoid heavily processed ingredients.

${rejectionContext}${historyContext}${currentSlotMeals.length > 0 ? `PREVIOUSLY GENERATED FOR THIS SLOT — pick something MEANINGFULLY DIFFERENT (different protein, different style, different main ingredients):\n${currentSlotMeals.join('\n')}\n\n` : ''}${existingWeekMeals.length > 0 ? `ALREADY PLANNED THIS WEEK — do NOT repeat these meals or reuse the same main proteins:\n${existingWeekMeals.join('\n')}\n\n` : ''}${breakfastSlots.length > 0 ? `=== BREAKFAST (${breakfastSlots.length} meal${breakfastSlots.length !== 1 ? 's' : ''}) ===
Classic, recognizable morning meal — 10-15 minutes, home-cook simple.
HARD RULES:
1. Breakfast proteins: ${breakfastProteins}. NEVER use whole roasted or sliced dinner proteins at breakfast (whole roasted chicken, turkey breast slices, smoked trout, lamb chops, shrimp). Ground forms and sausages are fine — ground turkey, ground chicken, turkey sausage, chicken sausage, and beef patties are all valid breakfast proteins.
2. Maximum 3 main components. No exotic prep (no pickling, no marinating, no multi-step curing).
3. Plain, natural names: "Scrambled eggs with bacon and cheddar", not "Artisan Herb-Cured Egg Medallions."
4. Sweet and savory breakfast formats are MUTUALLY EXCLUSIVE — never combine them. Fruit and nuts belong ONLY in sweet breakfasts (yogurt bowls, cottage cheese bowls, oatmeal, chia pudding, pancakes, waffles, French toast, smoothies, granola, overnight oats). NEVER in savory breakfasts (egg + meat combos, omelettes, scrambles, shakshuka, skillets, frittatas, egg muffins, smoked salmon plates, cheese and charcuterie plates). Savory breakfasts get vegetables, herbs, or cheese — never fruit. EQUALLY: eggs are a SAVORY protein — NEVER add a fried egg, poached egg, scrambled egg, or any other egg preparation to a sweet breakfast dish (oatmeal, overnight oats, yogurt bowls, chia pudding, smoothies, granola bowls, smoothie bowls, acai bowls, pancakes, quinoa porridge). Dishes like "oatmeal with a fried egg" are incoherent and FORBIDDEN.
5. When fruit IS used (sweet types only), vary across breakfasts — no fruit repeated. Same for nuts. Fruit range: strawberries, peaches, mango, kiwi, apple, banana, pineapple, grapes, cherries, plum, papaya, pear. Nut range: almonds, walnuts, pecans, pistachios, cashews, hazelnuts, macadamia.
6. Write plain ingredient names — no diet qualifiers ("turkey bacon", not "maple-free turkey bacon").
${ketoMode ? `7. Keto breakfast vegetables — ONLY these are appropriate at breakfast: avocado, bell peppers, jalapeño, cherry tomatoes, mushrooms, spinach, scallion, cucumber. NEVER use at breakfast: asparagus, broccolini, broccoli, cauliflower, brussels sprouts, collard greens, zucchini, kale, arugula, swiss chard, green beans — those belong at lunch or dinner.
8. Cheese belongs INSIDE keto breakfast dishes — melted into scrambles, omelettes, frittatas, egg cups, shakshuka, and skillets. Not as a side cheese plate. Use cheddar, feta, goat cheese, cream cheese, gruyère, manchego, cotija, swiss, or ricotta. Name the cheese in the meal name (e.g. "Scrambled eggs with chorizo and cheddar", "Greek omelette with feta and spinach"). A cheese plate or charcuterie board is a separate format — fine occasionally, but the default is cheese cooked INTO the eggs.
9. Omelettes are a high-variety format and should appear regularly. Rotate the style each time: Western (ham, peppers, cheddar), Greek (feta, spinach, tomato), goat cheese and mushroom, Spanish (chorizo, peppers, manchego), smoked salmon and cream cheese, bacon and cheddar, three-cheese, jalapeño popper, Mediterranean (feta, olives), mushroom and Swiss, sausage and feta. Pick a different combination each time.\n` : ''}${mediterraneanMode ? `7. Mediterranean breakfast vegetables — emphasize tomatoes (cherry, sun-dried, sliced), cucumber, spinach, peppers (bell, roasted), olives, arugula, and avocado. Most savory Mediterranean breakfasts include tomato and/or cucumber. NEVER use at breakfast: asparagus, broccoli, cauliflower, brussels sprouts, collard greens, zucchini, kale (as a side) — those belong at lunch or dinner.
8. Mediterranean cheese belongs INSIDE the dish — feta crumbled into scrambled eggs, ricotta spread on toast, labneh under poached eggs, halloumi pan-seared on the plate, parmesan or mozzarella melted into a frittata. Use feta, halloumi, ricotta, labneh, parmesan, manchego, or mozzarella. Feta is the default Mediterranean cheese. Name the cheese in the meal name (e.g. "Scrambled eggs with feta and tomato", "Labneh toast with cucumber and za'atar"). Cheese is integrated into the meal, not served as a side plate.
9. Format rotation — many distinct Mediterranean breakfast formats are available: scrambled eggs with feta, Mediterranean omelette, shakshuka, frittata, sunny-side eggs over greens, poached eggs with labneh, Greek yogurt bowl, labneh toast, ricotta toast, hummus toast, avocado toast, smoked salmon plate, halloumi plate, cottage cheese bowl, mezze breakfast plate, savory oats, chia pudding, tuna salad toast, spanakopita-style eggs. Pick a DIFFERENT format type each generation — do not repeat the same format (e.g. no two Greek yogurt bowls in a row, no two toast formats in a row).
10. Mediterranean omelette variations to rotate: Greek (feta, spinach, tomato), Mediterranean (feta, olives, sun-dried tomato), Spanish (chorizo, peppers, manchego), three-cheese (feta, mozzarella, parmesan), goat cheese and herbs, smoked salmon and dill, halloumi and tomato, mushroom and herbs, roasted pepper and feta.
11. Signature Mediterranean ingredients to leverage: olive oil (primary fat), lemon, fresh herbs (parsley, oregano, mint, dill, basil), za'atar, sumac, garlic, capers, tahini, honey, figs, dates, pine nuts. Use these to elevate plain dishes.\n` : ''}${lowFodmapMode ? `7. Low-FODMAP safe vegetables ONLY at breakfast: bell peppers, carrots, cucumber, tomatoes, spinach, zucchini, green beans. NEVER at breakfast: mushrooms, garlic, onion, leeks, shallots, cauliflower, broccoli, asparagus, cabbage, brussels sprouts.
8. STRICT sweet/savory separation — these are completely separate categories, NEVER combined:
  SAVORY formats (scrambled eggs, omelette, fried/poached eggs, hash, smoked salmon plate, frittata, tofu scramble): contain vegetables, herbs, and protein ONLY — no fruit, no sweeteners, no peanut butter mixed in.
  SWEET formats (GF oatmeal, overnight oats, LF yogurt bowl, chia pudding, smoothie, GF pancakes, quinoa porridge, rice cakes with nut butter): contain safe fruit and nuts ONLY — NO egg, NO meat, NO savory cheese. A fried egg on top of oatmeal is FORBIDDEN.
9. Protein rotation: alternate between eggs, smoked salmon, lactose-free yogurt, peanut butter, hard cheese, firm tofu — do not default to eggs for every breakfast.\n` : ''}${paleoMode ? `7. Paleo breakfast vegetables allowed at breakfast: mushrooms, spinach, peppers, onion, garlic, tomatoes, avocado, scallion. No grains, no legumes, no dairy — coconut milk, almond milk, almond flour, coconut flour, or coconut yogurt are the only dairy substitutes.
8. Strict sweet/savory separation: paleo sweet formats (coconut yogurt bowls, fruit and nut bowls, almond-flour pancakes, banana pancakes, smoothies, acai bowls) contain fruit only — NO egg mixed into the sweet dish. Savory formats (egg skillets, hashes, egg plates with meat) contain meat and vegetables only — no fruit.
9. Protein rotation: eggs and bacon alone is not enough variety — rotate through: ground beef or turkey hash, steak strips with eggs, breakfast sausage patties, smoked salmon with avocado and cucumber, egg muffins with vegetables, sweet potato hash with protein, coconut yogurt with fruit and nuts.\n` : ''}${veganMode ? `7. Vegan sweet/savory separation: sweet formats (smoothies, acai bowls, smoothie bowls, oatmeal, overnight oats, chia pudding, plant yogurt parfait, vegan pancakes) are fruit-and-grain-based — no tofu, no tempeh, no savory protein mixed in. Savory formats (tofu scramble, tempeh hash, potato and vegetable hash, vegan breakfast burrito) are protein-and-vegetable-based — no fruit.
8. Protein rotation: do not default to tofu scramble every time — alternate with: tempeh hash, nut butter bowls, avocado toast with hemp seeds, savory grain bowl, vegan burrito, smoothie bowl, oatmeal, chia pudding.
9. Hot cereal variety: if generating oatmeal or porridge, vary the fruit and toppings significantly each time — mango with coconut, banana with peanut butter, mixed berry with almonds, tropical with toasted coconut, apple cinnamon (if apple is safe) with walnuts are all distinct variations.\n` : ''}${vegetarianMode && !veganMode ? `7. Vegetarian sweet/savory separation: sweet formats (yogurt parfaits, oatmeal, overnight oats, smoothie bowls, chia pudding, cottage cheese bowls with fruit, pancakes, waffles) are fruit-and-dairy-based — NO egg scrambled in or added on top. Savory formats (omelettes, scrambled eggs, shakshuka, frittatas, egg on toast, egg muffins) are egg-and-vegetable-based — no fruit.
8. Egg preparation rotation: do NOT default to fried eggs every time. Alternate: scrambled, poached, soft-boiled, baked, omelette, frittata, shakshuka, egg muffins — each is a distinct format.
9. Cheese rotation in savory dishes: vary the cheese every time — cheddar, feta, goat cheese, ricotta, cottage cheese, mozzarella, halloumi, gruyère, parmesan. Name the specific cheese in the meal name.\n` : ''}${pescatarianMode ? `7. Pescatarian sweet/savory separation: sweet formats (yogurt parfaits, oatmeal, overnight oats, smoothie bowls, chia pudding, pancakes) are fruit-and-dairy-based — no seafood mixed in. Savory formats (eggs, smoked salmon plates, tuna dishes, shrimp scrambles) are protein-and-vegetable-based — no fruit.
8. Seafood variety: do not default to smoked salmon every time — alternate with: tuna in avocado halves, sardines on toast with lemon, shrimp scramble with vegetables, canned salmon on rice cakes, smoked trout plate with cucumber.
9. Protein rotation: vary between eggs, smoked salmon, tuna, and other seafood — do not repeat the same seafood protein in adjacent breakfasts.\n` : ''}${highProteinMode ? `7. Egg quantity — egg-based breakfasts use 3–4 eggs minimum, not 2. Name the count in the meal name (e.g. "3-Egg Scramble with Turkey Sausage and Cheddar"). This is the athlete portion.
8. Sweet breakfasts are allowed but MUST be protein-boosted — no plain versions:
  Oatmeal → stir in Greek yogurt + peanut butter + hemp seeds (not just oats with fruit)
  Yogurt parfait → use high-protein Greek yogurt (Skyr or 2% Greek) + hemp/chia seeds
  Smoothie → Greek yogurt base + nut butter + hemp seeds (not just fruit + milk)
  Pancakes → cottage cheese or egg-based batter, not regular flour pancakes
  Never generate a sweet breakfast without an explicit protein booster named in the meal.
9. Protein priority — savory egg-and-meat formats (scrambles, omelettes, hashes, steak and eggs) are the preferred breakfast. Sweet formats are the minority — aim for 2 savory per 1 sweet across the week.\n` : ''}${carnivoreMode ? `7. NO plant-based ingredients of ANY kind — no vegetables, no fruit, no grains, no nuts, no seeds, no herb leaves as garnish. Even a lemon wedge, parsley sprig, or tomato slice is FORBIDDEN. Every component must be animal-based.
8. Cooking fat is butter, ghee, or tallow ONLY. Flavor comes from the cut and the cook — seasoning with salt, pepper, cumin, paprika, chili paste, or garlic powder is fine. No sauces with plant-based ingredients.
9. Name the cut specifically and the cooking method (e.g. "Pan-seared Ribeye in Tallow", "Bacon-wrapped Chicken Thigh", "Butter-basted NY Strip and Eggs"). Generic names like "Meat and Eggs" are not allowed.
10. Organ meat rotation — liver, heart, kidney, oxtail, or tongue should appear at least once across the full week. These are nutritionally dense carnivore staples and are not optional extras.
11. Egg pairing rule — when eggs appear, pair them with a meat protein (bacon, steak, sausage, liver, smoked salmon). Eggs alone without meat are not a complete carnivore meal.\n` : ''}${weekUsedFruits.length > 0 || weekUsedNuts.length > 0 ? `${ketoMode ? 10 : (mediterraneanMode ? 12 : (carnivoreMode || highProteinMode) ? 12 : (lowFodmapMode || paleoMode || veganMode || (vegetarianMode && !veganMode) || pescatarianMode) ? 10 : 7)}. Already used this week — do NOT repeat:${weekUsedFruits.length > 0 ? ` Fruits: ${weekUsedFruits.join(', ')}.` : ''}${weekUsedNuts.length > 0 ? ` Nuts: ${weekUsedNuts.join(', ')}.` : ''}\n` : ''}${varietyContext}
Format inspiration — use these OR invent your own. This is not a checklist:
${breakfastExamples}

Slots:
${breakfastSlots.map(s => `- ${s.date} breakfast`).join('\n')}

` : ''}${lunchSlots.length > 0 ? `=== LUNCH (${lunchSlots.length} meal${lunchSlots.length !== 1 ? 's' : ''}) ===
Quick, practical, home-cook realistic — 20 minutes or under, one pan or assembly only. No roasting, no slow-cooking, no specialty techniques.
HARD RULES:
1. Protein MUST come from the everyday lunch list: ${proteins}. Maximum 4 main components.
2. DINNER-ONLY proteins are STRICTLY BANNED at lunch — they require too much cooking time: ${dinnerOnlyList}. If you use any of these at lunch the meal fails.
3. Each lunch must have a DIFFERENT protein AND a DIFFERENT format from every other lunch in this response.
4. Do not reuse any protein already assigned at breakfast in this response.
5. Plain, natural names — no flowery descriptions.
${lunchVarietyContext}
Format inspiration — use these OR invent your own:
${lunchExamples}

Slots:
${lunchSlots.map(s => `- ${s.date} lunch`).join('\n')}

` : ''}${dinnerSlots.length > 0 ? `=== DINNER (${dinnerSlots.length} meal${dinnerSlots.length !== 1 ? 's' : ''}) ===
${complexityNote}
${randomCuisine
  ? `Cuisine for this dinner: ${randomCuisine}. Cooking method: ${randomMethod}.`
  : `Cuisines to use — one per dinner, each cuisine at most once: ${cuisinePool.join(', ')}.`}
Protein options to rotate (each at most once across all dinners): ${proteins}${dinnerOnlyProteins}
Side / base options: ${dinnerBases}
${ketoMode ? `KETO DINNER RULES — the assigned cuisine does NOT change these:
- ZERO rice, noodles, pasta, grains, bread, potatoes, corn, edamame, beans, or lentils. Not even in Japanese, Korean, Thai, or any Asian cuisine.
- The PROTEIN and its preparation are the star of every keto dinner. The vegetable side is a supporting component — pick a DIFFERENT one each dinner and rotate through the full base list.
- Do NOT default to zucchini noodles or cauliflower rice every dinner. These are occasional options, not defaults. Most keto dinners are protein + roasted/sautéed vegetables.
- Asian cuisine: the protein + sauce IS the dish. Soy sauce, sesame oil, ginger, miso (as a flavoring), and fish sauce are all keto-safe. Serve the protein over or alongside roasted broccoli, asparagus, sautéed bok choy, wilted spinach, or green beans — not automatically over cauliflower rice.
- Sides MUST rotate through the full base list above — broccoli, asparagus, Brussels sprouts, cauliflower florets, green beans, mushrooms, bell peppers, spinach, kale, sliced zucchini, roasted cabbage.\n` : ''}${carnivoreMode ? `CARNIVORE DINNER RULES — the assigned cuisine does NOT change these:
- ZERO vegetables, grains, or starches — not even a garnish. The protein IS the meal.
- Cooking fat is butter, tallow, or ghee. Name the cut and the method specifically.\n` : ''}${lowFodmapMode ? `LOW-FODMAP DINNER RULES — the assigned cuisine does NOT change these:
- NO garlic, NO onion, NO leeks, NO mushrooms, NO legumes (chickpeas, lentils, beans) in any dinner.
- Indian/Moroccan: safe spices (cumin, coriander, turmeric, paprika, ginger) but no garlic/onion base, no chickpeas.
- Thai: use lemongrass, ginger, fish sauce, green onion tips only — no garlic paste, no onion.
- Sides MUST come from the base list above.\n` : ''}${paleoMode ? `PALEO DINNER RULES — the assigned cuisine does NOT change these:
- NO grains (no rice, pasta, noodles, bread, couscous), NO legumes, NO dairy.
- Asian cuisine: cauliflower rice replaces rice; coconut aminos replaces soy sauce.
- Sides MUST come from the base list above.\n` : ''}${veganMode ? `VEGAN DINNER RULES — the assigned cuisine does NOT change these:
- ZERO meat, fish, dairy, or eggs. 100% plant-based every dinner.
- Italian: pasta with marinara, arrabbiata, puttanesca, or vegetable ragù.
- Japanese: tofu, tempeh, or edamame bowl with vegetables and rice.
- Indian: lentil dal, chana masala, or vegetable curry.\n` : ''}${highProteinMode ? `HIGH PROTEIN DINNER RULES:
- Protein is the centerpiece — a large, named portion (6–8 oz minimum) leads every dinner. Name it first in the meal name.
- Lean proteins preferred: chicken breast, ground turkey, salmon, shrimp, tuna, cod, pork tenderloin, lean ground beef, turkey breast. Steak and lamb on rotation.
- One clean carb side (brown rice, quinoa, sweet potato, lentils, farro) — moderate portion, supporting role only.
- Always include a vegetable component: roasted, steamed, or sautéed alongside the protein.
- Dinner format examples to draw from (use these OR invent your own):
  · Grilled or baked chicken breast + brown rice or quinoa + roasted vegetables
  · Salmon fillet (baked, pan-seared, or cedar-plank) + sweet potato + green vegetable
  · Lean ground turkey or beef bowl — seasoned meat over rice or quinoa with vegetables and a sauce
  · Shrimp stir-fry over brown rice or cauliflower rice with broccoli, peppers, snap peas
  · Pork tenderloin + roasted sweet potato + green beans or asparagus
  · Turkey meatballs + whole-wheat pasta + marinara + side salad
  · Baked cod or tilapia + roasted potatoes + steamed broccoli or zucchini
  · Steak (sirloin or flank) + farro or quinoa + roasted root vegetables
  · Bison burger bowl (no bun) + roasted potatoes + mixed greens
  · Tuna steak + brown rice + edamame + sesame-soy glaze
- When an ethnic cuisine is assigned, adapt it to high-protein: Indian → chicken tikka masala (double the chicken, light on cream); Japanese → teriyaki salmon or chicken over brown rice; Mexican → grilled chicken or beef burrito bowl; Italian → turkey bolognese or grilled chicken over whole-wheat pasta.\n` : ''}Use specific, descriptive names: "Baked Lemon-Herb Salmon with Roasted Asparagus" not "Salmon with Vegetables".

Slots:
${dinnerSlots.map(s => `- ${s.date} dinner`).join('\n')}

` : ''}Return a JSON array only — no markdown. Each object:
{"date":"YYYY-MM-DD","meal_type":"breakfast|lunch|dinner","meal_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}`

      const saveMeal = async (meal: Record<string, unknown>) => {
        const key = `${meal.date}|${meal.meal_type}`
        if (!targetKeys.has(key)) {
          console.log(`[meal-planner/generate] DROPPED meal — key "${key}" not in targetKeys ${JSON.stringify([...targetKeys])}`)
          return  // reject any extra meals the AI hallucinated
        }
        const row = {
          user_id:       user.id,
          plan_date:     meal.date as string,
          meal_type:     meal.meal_type as string,
          meal_name:     meal.meal_name as string,
          meal_category: dinnerCuisineMap.get(key) ?? null,
          ingredients:   [],
          directions:    '',
          calories:      meal.calories as number,
          protein_g:     meal.protein_g as number,
          fat_g:         meal.fat_g as number,
          carbs_g:       meal.carbs_g as number,
          accepted:      false,
        }
        const { error } = await supabase
          .from('meal_plan_slots')
          .upsert(row, { onConflict: 'user_id,plan_date,meal_type' })
        if (error) {
          console.log(`[meal-planner/generate] UPSERT ERROR for ${key}: ${error.message}`)
        } else {
          send(JSON.stringify({ ...row, plan_date: meal.date }))
        }
      }

      console.log('[meal-planner/generate] PROMPT:\n' + prompt)

      try {
        const stream = await openai.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          reasoning_effort: 'minimal',
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
                // Normalize meal_type to lowercase — the AI sometimes capitalises
                // it ("Dinner") when the section header === DINNER === is in caps,
                // causing the targetKeys case-sensitive check to silently drop it.
                if (meal.meal_type) meal.meal_type = String(meal.meal_type).toLowerCase()
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
