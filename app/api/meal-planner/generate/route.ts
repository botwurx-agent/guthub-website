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
    supabase.from('profiles').select('diet_mode, health_profile').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('lab_reports').select('filename, analysis_summary').eq('user_id', user.id).not('analysis_summary', 'is', null).order('created_at', { ascending: false }).limit(3),
    supabase.from('meal_plan_slots').select('meal_name, meal_type').eq('user_id', user.id).gte('plan_date', thirtyDaysAgoStr).not('meal_name', 'is', null),
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
      if (ketoMode)           dinnerBases = `zucchini noodles, spaghetti squash, shirataki noodles, roasted broccoli, roasted asparagus, roasted Brussels sprouts, sautéed green beans, roasted cauliflower, wilted spinach`
      else if (paleoMode)     dinnerBases = `sweet potato, roasted root vegetables, butternut squash, spaghetti squash, plantain`
      else if (lowFodmapMode) dinnerBases = `white rice, quinoa, gluten-free pasta, roasted potatoes, polenta`
      else                    dinnerBases = `rice, pasta, roasted potatoes, noodles, couscous, farro, quinoa`

      // ── Diet restriction rule (what is NOT allowed) ───────────────────────
      let dietRule = ''
      if (ketoMode)             dietRule = `KETO: No grains, no bread, no rice, no pasta, no oats, no corn, no beans, no lentils, no potatoes. Every meal must be low-carb. Use meat, fish, eggs, cheese, and non-starchy vegetables.`
      else if (veganMode)       dietRule = `VEGAN: No meat, poultry, fish, dairy, or eggs. 100% plant-based only.`
      else if (vegetarianMode)  dietRule = `VEGETARIAN: No meat, poultry, or fish. Eggs and dairy are fine.`
      else if (pescatarianMode) dietRule = `PESCATARIAN: No beef, pork, chicken, turkey, or any land animal. Fish and seafood only as animal protein.`
      else if (paleoMode)       dietRule = `PALEO: No grains, no legumes, no dairy, no processed foods. Meat, fish, eggs, vegetables, fruit, nuts, seeds only.`
      else if (lowFodmapMode)   dietRule = `LOW-FODMAP: No garlic, no onion, no wheat, no apples/pears/stone fruits, no lactose. Safe: white rice, potatoes, quinoa, hard cheeses, chicken, beef, fish, eggs, carrots, zucchini, bell peppers, spinach, tomatoes.`

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
      else if (lowFodmapMode)   breakfastProteins = 'eggs, peanut butter, lactose-free yogurt, lactose-free cottage cheese'
      else                      breakfastProteins = 'eggs, Greek yogurt, cottage cheese, cheese, bacon, breakfast sausage, ham'

      // ── Breakfast format inspiration per diet ─────────────────────────────
      // Framed as examples, not assignments. AI can use these or invent its own.
      let breakfastExamples: string
      if (ketoMode) {
        // Egg preparations split into DISTINCT items so the AI sees them as
        // separate options rather than collapsing into "fried eggs" every time.
        breakfastExamples = [
          '• Scrambled eggs — soft and fluffy, with any mix-in (cheese, herbs, smoked salmon, cured meat, vegetables)',
          '• Sunny-side or fried eggs — runny yolks plated alongside bacon, sausage, ground meat patty, steak, or vegetables',
          '• Omelette — folded on the stovetop with cheese, vegetables, cured meat, or herbs',
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
      } else if (lowFodmapMode) {
        breakfastExamples = [
          '• Egg plates — scrambled, fried, or poached on gluten-free toast',
          '• Rice cakes with peanut butter and banana',
          '• Gluten-free oats with safe fruit (banana, blueberries)',
          '• Omelette with safe vegetables (spinach, peppers, zucchini — no garlic or onion)',
          '• Lactose-free yogurt parfait with safe granola and fruit',
          '• Chia pudding in lactose-free milk with safe seasonal fruit',
          '• Potato and egg hash (no garlic or onion)',
          '• Gluten-free pancakes or French toast (sweet, with safe fruit)',
          '• Smoothie — banana + lactose-free milk + peanut butter',
          '• Quinoa porridge with lactose-free milk and safe fruit',
        ].join('\n')
      } else {
        breakfastExamples = [
          '• Egg plates — scrambled, fried, poached, or baked — with any topping or side',
          '• Toast-based — avocado toast, smoked salmon toast, ricotta toast with honey, egg on toast',
          '• Sweet bowls — yogurt parfait, cottage cheese bowl, smoothie bowl, granola bowl',
          '• Hot cereals — oatmeal, overnight oats, porridge with fruit and nuts',
          '• Pancakes, waffles, or French toast (sweet)',
          '• Breakfast burritos, wraps, or sandwiches with eggs and protein',
          '• Hashes or skillets — potato or sweet potato + meat + egg, one pan',
          '• Shakshuka or baked eggs in a sauce',
          '• Omelettes or frittatas with any fillings',
          '• Chia or seed pudding with fruit',
        ].join('\n')
      }

      // ── Lunch format inspiration per diet ────────────────────────────────
      let lunchExamples: string
      if (ketoMode) {
        lunchExamples = [
          '• Protein-and-greens salad — protein over leafy greens, olive oil dressing, no croutons or grains',
          '• Lettuce wraps — spiced protein + crunchy veg wrapped in iceberg or butter lettuce',
          '• Low-carb bowl — protein + cauliflower rice or zoodles + sauce',
          '• Stuffed vegetable — bell pepper, mushroom cap, or zucchini boat filled with meat and cheese',
          '• Keto soup — creamy or broth-based, no grains or starchy vegetables',
          '• Cold plate — sliced cured meats + hard cheeses + pickles + raw veg',
          '• Egg or tuna salad in avocado halves or over greens',
          '• Bunless burger or meatball bowl over greens or cauliflower rice',
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
        lunchExamples = [
          '• Sandwiches, wraps, or rolls — any protein, any bread style',
          '• Grain or rice bowls — protein + grain + veg + sauce',
          '• Hearty salads with protein — Caesar, Cobb, grain salad, etc.',
          '• Soups or stews — noodle, bean, creamy, or broth-based',
          '• Stir-fries over rice or noodles',
          '• Flatbreads, quesadillas, or tacos',
          '• Hot protein plates — grilled or baked protein + veg side + starch',
          '• Pasta dishes with any sauce',
          '• Noodle bowls — ramen, soba, pho-style',
        ].join('\n')
      }

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

      // Cross-call variety detection — surfaces what's been overused as
      // informational feedback across the full swap history for this slot.
      const EGG_PREPS: Record<string, string[]> = {
        'fried':       ['fried egg', 'pan-fried egg'],
        'sunny-side':  ['sunny-side', 'sunny side', 'over-easy', 'over easy'],
        'scrambled':   ['scrambled egg'],
        'poached':     ['poached egg', 'eggs benedict'],
        'boiled':      ['boiled egg', 'soft-boiled', 'hard-boiled', 'soft boiled', 'hard boiled'],
        'omelette':    ['omelette', 'omelet'],
        'frittata':    ['frittata'],
        'shakshuka':   ['shakshuka'],
        'egg cups':    ['egg cup', 'egg muffin'],
        'baked eggs':  ['baked egg'],
      }
      // Broad breakfast meat tracking — covers poultry sausages and ground meats
      // not just pork, because turkey sausage/chicken sausage repeat just as badly
      const BREAKFAST_MEAT_TERMS = [
        'turkey sausage','chicken sausage','beef sausage','pork sausage','breakfast sausage',
        'bacon','pork belly','ham','chorizo','pancetta','prosciutto',
        'ground turkey','ground chicken','ground beef',
        'steak','beef patty','turkey patty','chicken patty',
        'smoked salmon',
      ]
      // Breakfast-appropriate vegetables only. Dinner veg (asparagus, broccoli,
      // cauliflower, brussels sprouts, collard greens, zucchini, kale, arugula)
      // intentionally excluded — they were bleeding into the "unused → suggest"
      // path and causing the AI to put dinner vegetables at breakfast.
      const VEG_TERMS = [
        'avocado','pepper','jalapeño','tomato',
        'mushroom','spinach','cucumber','scallion',
      ]

      const usedEggPreps = Object.entries(EGG_PREPS)
        .map(([prep, terms]) => ({ prep, count: allBfNames.filter(n => terms.some(t => n.includes(t))).length }))
        .filter(x => x.count > 0)
      const unusedEggPreps = Object.keys(EGG_PREPS).filter(p => !usedEggPreps.some(u => u.prep === p))
      const usedMeats  = BREAKFAST_MEAT_TERMS.map(p => ({ term: p, count: allBfNames.filter(n => n.includes(p)).length })).filter(x => x.count > 0)
      const usedVeg    = VEG_TERMS.map(v => ({ term: v, count: allBfNames.filter(n => n.includes(v)).length })).filter(x => x.count > 0)

      const totalBfCount = allBfNames.length
      const eggBfCount = allBfNames.filter(n => Object.values(EGG_PREPS).some(terms => terms.some(t => n.includes(t)))).length

      const varietyParts: string[] = []
      if (usedEggPreps.length > 0) {
        const used = usedEggPreps.map(p => `${p.prep} (${p.count}x)`).join(', ')
        const alts = unusedEggPreps.length > 0 ? ` — try: ${unusedEggPreps.join(', ')}` : ''
        varietyParts.push(`Egg preparations used: ${used}${alts}`)
      }
      // Soft nudge toward non-egg formats when the recent pattern is heavily egg-based.
      // Threshold: 4+ total breakfasts and 80%+ are egg-based.
      if (totalBfCount >= 4 && eggBfCount / totalBfCount >= 0.8) {
        varietyParts.push(`Recent breakfasts heavily egg-based (${eggBfCount}/${totalBfCount}) — consider a NON-EGG format this time: Greek yogurt bowl, cottage cheese bowl, smoked salmon plate, cheese and charcuterie plate, cream cheese pancakes or chaffles, chia pudding, ricotta or mascarpone bowl, or avocado boat with tuna or salmon salad`)
      }
      if (usedMeats.length > 0) {
        const overused = usedMeats.filter(p => p.count >= 2)
        if (overused.length > 0) {
          const used = overused.map(p => `${p.term} (${p.count}x)`).join(', ')
          const allMeatTerms = BREAKFAST_MEAT_TERMS.join(', ')
          varietyParts.push(`Supporting proteins overused: ${used} — pick a different meat/protein from: ${allMeatTerms}`)
        }
      }
      // Surface "never used" common proteins after a few breakfasts so the AI
      // stops skipping ground beef, steak, beef patty, smoked salmon, etc.
      if (totalBfCount >= 3) {
        const underused = ['ground beef','ground turkey','ground chicken','beef patty','steak','smoked salmon']
          .filter(t => !usedMeats.some(u => u.term === t))
        if (underused.length > 0) {
          varietyParts.push(`Proteins not yet used: ${underused.join(', ')} — consider rotating one of these in`)
        }
      }
      // Avocado: keto staple — nudge when absent from recent slots.
      // Overuse is already handled by VEG_TERMS tracking (fires at count >= 2).
      if (ketoMode && totalBfCount >= 2) {
        const avocadoUsed = allBfNames.some(n => n.includes('avocado'))
        if (!avocadoUsed) {
          varietyParts.push('Avocado not yet used — consider adding it (sliced alongside eggs, avocado boat, or as a side with feta)')
        }
      }
      // Cheese: should appear frequently in keto breakfasts but is often omitted.
      // Check meal names — if no cheese term appears, nudge the AI.
      if (ketoMode && totalBfCount >= 2) {
        const CHEESE_TERMS = ['cheddar','feta','goat cheese','cream cheese','mozzarella','parmesan','cotija','swiss','ricotta','cheese']
        const cheeseUsed = allBfNames.some(n => CHEESE_TERMS.some(c => n.includes(c)))
        if (!cheeseUsed) {
          varietyParts.push('No cheese in recent breakfasts — keto breakfasts benefit from cheddar, feta, goat cheese, or cream cheese; include it in the meal name')
        }
      }
      if (usedVeg.length > 0) {
        const overused = usedVeg.filter(v => v.count >= 2)
        if (overused.length > 0) {
          const used = overused.map(v => `${v.term} (${v.count}x)`).join(', ')
          const unused = VEG_TERMS.filter(v => !usedVeg.some(u => u.term === v))
          const altList = unused.length > 0 ? unused.slice(0, 8).join(', ') : 'avocado, bell peppers, jalapeño, cherry tomatoes, mushrooms, spinach, cucumber, scallion'
          varietyParts.push(`Vegetables overused: ${used} — pick a different vegetable: ${altList}`)
        }
      }
      const varietyContext = varietyParts.length > 0
        ? `\nVARIETY CONTEXT — breakfasts generated so far have used:\n${varietyParts.map(p => `- ${p}`).join('\n')}\nFor this breakfast, change AT LEAST ONE dimension — pick a different egg preparation, a different supporting protein, or a different vegetable. Do not rearrange the same components.\n`
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

${historyContext}${currentSlotMeals.length > 0 ? `PREVIOUSLY GENERATED FOR THIS SLOT — pick something MEANINGFULLY DIFFERENT (different protein, different style, different main ingredients):\n${currentSlotMeals.join('\n')}\n\n` : ''}${existingWeekMeals.length > 0 ? `ALREADY PLANNED THIS WEEK — do NOT repeat these meals or reuse the same main proteins:\n${existingWeekMeals.join('\n')}\n\n` : ''}${breakfastSlots.length > 0 ? `=== BREAKFAST (${breakfastSlots.length} meal${breakfastSlots.length !== 1 ? 's' : ''}) ===
Classic, recognizable morning meal — 10-15 minutes, home-cook simple.
HARD RULES:
1. Breakfast proteins: ${breakfastProteins}. NEVER use whole roasted or sliced dinner proteins at breakfast (whole roasted chicken, turkey breast slices, smoked trout, lamb chops, shrimp). Ground forms and sausages are fine — ground turkey, ground chicken, turkey sausage, chicken sausage, and beef patties are all valid breakfast proteins.
2. Maximum 3 main components. No exotic prep (no pickling, no marinating, no multi-step curing).
3. Plain, natural names: "Scrambled eggs with bacon and cheddar", not "Artisan Herb-Cured Egg Medallions."
4. Fruit and nuts belong ONLY in sweet breakfasts (yogurt bowls, cottage cheese bowls, oatmeal, chia pudding, pancakes, waffles, French toast, smoothies, granola, overnight oats). NEVER in savory breakfasts (egg + meat combos, omelettes, scrambles, shakshuka, skillets, frittatas, egg muffins, smoked salmon plates, cheese and charcuterie plates). Savory breakfasts get vegetables, herbs, or cheese — never fruit.
5. When fruit IS used (sweet types only), vary across breakfasts — no fruit repeated. Same for nuts. Fruit range: strawberries, peaches, mango, kiwi, apple, banana, pineapple, grapes, cherries, plum, papaya, pear. Nut range: walnuts, pecans, pistachios, cashews, hazelnuts, macadamia.
6. Write plain ingredient names — no diet qualifiers ("turkey bacon", not "maple-free turkey bacon").
${ketoMode ? `7. Keto breakfast vegetables — ONLY these are appropriate at breakfast: avocado, bell peppers, jalapeño, cherry tomatoes, mushrooms, spinach, scallion, cucumber. NEVER use at breakfast: asparagus, broccolini, broccoli, cauliflower, brussels sprouts, collard greens, zucchini, kale, arugula, swiss chard, green beans — those belong at lunch or dinner.
8. Cheese belongs in keto breakfasts. Almost every savory egg dish, omelette, scramble, frittata, skillet, and meat plate should include a cheese: cheddar, feta, goat cheese, cream cheese, or ricotta. Name the cheese in the meal name (e.g. "Scrambled eggs with chorizo and cheddar", "Omelette with bell peppers and feta").\n` : ''}${weekUsedFruits.length > 0 || weekUsedNuts.length > 0 ? `${ketoMode ? 9 : 7}. Already used this week — do NOT repeat:${weekUsedFruits.length > 0 ? ` Fruits: ${weekUsedFruits.join(', ')}.` : ''}${weekUsedNuts.length > 0 ? ` Nuts: ${weekUsedNuts.join(', ')}.` : ''}\n` : ''}${varietyContext}
Format inspiration — use these OR invent your own. This is not a checklist:
${breakfastExamples}

Slots:
${breakfastSlots.map(s => `- ${s.date} breakfast`).join('\n')}

` : ''}${lunchSlots.length > 0 ? `=== LUNCH (${lunchSlots.length} meal${lunchSlots.length !== 1 ? 's' : ''}) ===
Quick, filling, practical — 20 minutes or under.
HARD RULES:
1. Include a clear protein. Maximum 4 main components.
2. Each lunch must have a DIFFERENT protein AND a DIFFERENT format from every other lunch in this response.
3. Do not reuse any protein already assigned at breakfast in this response.
4. Plain, natural names — no flowery descriptions.

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
Use specific, descriptive names: "Baked Lemon-Herb Salmon with Roasted Asparagus" not "Salmon with Vegetables".

Slots:
${dinnerSlots.map(s => `- ${s.date} dinner`).join('\n')}

` : ''}Return a JSON array only — no markdown. Each object:
{"date":"YYYY-MM-DD","meal_type":"breakfast|lunch|dinner","meal_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number}`

      const saveMeal = async (meal: Record<string, unknown>) => {
        const key = `${meal.date}|${meal.meal_type}`
        if (!targetKeys.has(key)) return  // reject any extra meals the AI hallucinated
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
        if (!error) send(JSON.stringify({ ...row, plan_date: meal.date }))
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
