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

      // Always fetch the full week context so the AI can avoid repeats.
      // Two buckets:
      // - existingWeekMeals: meals on OTHER slots (don't repeat these)
      // - currentSlotMeals:  the CURRENT meal already in the slot being
      //   swapped/regenerated — the AI needs to see this so it picks
      //   something meaningfully different (without this, it can generate
      //   the same meal twice in a row when the user swaps the same slot).
      // Hoist targetKeys so it's available for both the fetch filter and saveMeal
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
        currentSlotMeals = rawWeekMeals
          .filter(m => targetKeys.has(`${m.plan_date}|${m.meal_type}`))
          .map(m => m.meal_name)
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
        breakfastTypes = [
          'Eggs + cured meat: eggs any style + bacon/sausage/ham, optional leafy green',
          'Omelette or scramble with cheese and vegetables: eggs + cheese + 1-2 common veg (spinach, peppers, mushrooms, tomatoes)',
          'Greek yogurt bowl: full-fat plain Greek yogurt + fresh seasonal fruit + nuts or granola — no vegetables, no savory ingredients',
          'Cottage cheese bowl: cottage cheese + fruit or berries + nuts or seeds — no vegetables, no savory ingredients',
          'Eggs with avocado: fried or poached eggs alongside sliced avocado, optional bacon or hot sauce — 3 components max',
          'Baked egg muffins or egg cups: eggs + cheese + 1-2 mix-ins (peppers, bacon, spinach), baked in muffin tin',
          'Smoked salmon plate: smoked salmon + cream cheese or eggs + cucumber or capers — 3 components max',
          'Steak and eggs: pan-seared steak strips or skirt steak + fried or scrambled eggs — no bread, no grains',
          'Frittata with vegetables and cheese: eggs + cheese + 1-2 veg, baked',
          'Egg salad: chopped eggs + mayo or avocado, served on greens, in avocado halves, or stuffed in a pepper',
          'Chorizo and eggs: crumbled Mexican chorizo + scrambled or fried eggs, optional cheese',
          'Cream cheese pancakes: cream cheese and eggs blended into pancake batter, topped with fresh fruit — no ricotta',
          'Breakfast skillet: ground sausage + eggs + peppers, one pan',
          'Cheese and cured meat plate: hard cheeses + cured meats + nuts or olives — assembly only, no cooking',
          'Stuffed avocado boats: halved avocado filled with egg, salmon, or tuna salad',
          'Ground beef and egg hash: ground beef + diced bell pepper + fried or scrambled egg, one pan',
          'Shakshuka: eggs poached in tomato and bell pepper sauce',
          'Pork belly and fried eggs: pan-crisped pork belly slices + fried eggs, optional greens',
          'Ricotta or mascarpone bowl: with fresh seasonal fruit and nuts — no vegetables, no savory ingredients',
          'Breakfast sandwich on lettuce wrap or chaffle: eggs + cheese + meat',
        ].join(' | ')
        breakfastProteins = 'eggs, bacon, breakfast sausage, ham, steak, ground beef, chorizo, pork belly, smoked salmon, Greek yogurt, cottage cheese, ricotta'
      } else if (veganMode) {
        breakfastTypes = [
          'Oatmeal with fruit and nuts: rolled oats + fruit + nut butter or nuts',
          'Smoothie or smoothie bowl: blended fruit + plant milk + protein (nut butter, seeds)',
          'Tofu scramble with vegetables: crumbled tofu + turmeric + 1-2 veg, optional toast',
          'Chia pudding: chia seeds in plant milk + fruit + optional nuts',
          'Avocado toast: smashed avocado on toast + optional toppings (tomato, seeds)',
          'Granola with plant milk and fruit: simple granola + plant milk + fresh fruit',
          'Nut butter toast with banana or fruit: peanut or almond butter on toast + fruit',
          'Overnight oats: rolled oats soaked in plant milk + fruit and nuts',
          'Açaí or pitaya bowl: blended frozen fruit + toppings (granola, coconut, fruit)',
          'Coconut or almond yogurt parfait: plant yogurt + granola + fresh fruit',
          'Tofu breakfast burrito or wrap: scrambled tofu + beans + veg in tortilla',
          'Vegan pancakes: banana or flax-based batter + maple syrup or fruit',
          'Quinoa breakfast porridge: cooked quinoa + plant milk + fruit and nuts',
          'Buckwheat porridge with fresh fruit: cooked buckwheat + plant milk + fresh seasonal fruit',
          'Polenta breakfast bowl: cooked polenta + maple syrup or savory toppings',
          'Vegan French toast: chickpea-flour batter on bread + maple syrup',
          'Potato hash with tempeh: diced potatoes + crumbled tempeh + veg',
          'Fruit and seed bowl: mixed fresh fruit + seeds + nuts — no dairy',
          'Tofu and avocado savory bowl: pan-seared tofu + avocado + greens',
          'Hemp or flax breakfast pudding: hemp or flax seeds in plant milk + fruit',
        ].join(' | ')
        breakfastProteins = 'tofu, tempeh, nut butter, plant-based yogurt, oats, hemp/flax seeds, chia seeds'
      } else if (vegetarianMode) {
        breakfastTypes = [
          'Scrambled or fried eggs on toast: eggs + toast + optional cheese or avocado',
          'Yogurt parfait with granola: Greek yogurt + granola + fresh fruit — no savory ingredients',
          'Oatmeal with fruit and nuts: oats + fruit + nut butter or nuts',
          'Avocado toast with egg: toast + smashed avocado + fried or poached egg',
          'Smoothie with fruit and yogurt: blended fruit + yogurt or milk + optional extras',
          'Pancakes or waffles: classic batter + fresh fruit or maple syrup',
          'Frittata or egg bake: eggs + cheese + 1-2 veg, baked',
          'Omelette with cheese and vegetables: eggs + cheese + common veg',
          'Cottage cheese bowl with fruit and nuts: cottage cheese + fruit + nuts — no vegetables, no savory',
          'Chia pudding with fruit: chia seeds in milk + fruit + optional nuts',
          'French toast with fruit: classic French toast + maple syrup and fruit',
          'Eggs Benedict: poached eggs on English muffin + hollandaise',
          'Breakfast burrito with eggs and cheese: scrambled eggs + cheese + veg in tortilla',
          'Shakshuka: eggs poached in tomato sauce',
          'Yogurt smoothie bowl: blended yogurt + fruit + toppings',
          'Ricotta toast with honey and fruit: ricotta on toast + honey + fresh fruit',
          'Breakfast sandwich (egg + cheese): eggs + cheese on muffin or bread',
          'Quiche slice with fruit: pre-baked quiche slice + side fruit',
          'Overnight oats with yogurt: rolled oats + yogurt + fruit and nuts',
          'Cheesy baked egg muffins: eggs + cheese + veg, baked in muffin tin',
        ].join(' | ')
        breakfastProteins = 'eggs, Greek yogurt, cottage cheese, cheese, ricotta'
      } else if (pescatarianMode) {
        breakfastTypes = [
          'Scrambled or fried eggs on toast: eggs + toast + optional cheese or veg',
          'Smoked salmon on toast or bagel: smoked salmon + cream cheese or avocado on bread',
          'Yogurt parfait with granola: Greek yogurt + granola + fresh fruit',
          'Oatmeal with fruit and nuts: oats + fruit + nut butter',
          'Avocado toast with egg: toast + avocado + fried egg',
          'Smoothie with fruit: blended fruit + yogurt or milk',
          'Pancakes or waffles: classic batter + fruit or syrup',
          'Frittata with vegetables and cheese: eggs + cheese + veg, baked',
          'Omelette with cheese and vegetables: eggs + cheese + common veg',
          'Cottage cheese bowl with fruit and nuts: cottage cheese + fruit + nuts — no vegetables',
          'Chia pudding with fruit: chia seeds in milk + fruit + optional nuts',
          'Eggs Benedict with smoked salmon: poached eggs + smoked salmon on muffin',
          'Tuna or salmon salad on toast: tuna or salmon with mayo on toast',
          'Smoked salmon and cream cheese bagel: bagel + cream cheese + smoked salmon',
          'Baked egg muffins with cheese: eggs + cheese + veg, baked',
          'Breakfast burrito with eggs: scrambled eggs + cheese + veg in tortilla',
          'Shakshuka: eggs poached in tomato sauce',
          'Ricotta toast with honey and fruit: ricotta on toast + honey + fruit',
          'French toast with fruit: classic French toast + syrup and fruit',
          'Smoked salmon avocado bowl: smoked salmon + avocado + greens or rice',
        ].join(' | ')
        breakfastProteins = 'eggs, smoked salmon, tuna, Greek yogurt, cottage cheese, cheese'
      } else if (paleoMode) {
        breakfastTypes = [
          'Scrambled or fried eggs with bacon or sausage: eggs + breakfast meat',
          'Sweet potato hash with egg: diced sweet potato + egg fried on top',
          'Fruit and nut bowl: mixed fresh fruit + nuts + seeds — no dairy',
          'Omelette with vegetables: eggs + 1-2 veg — no cheese, no dairy',
          'Paleo pancakes: almond or coconut flour batter + fresh fruit',
          'Breakfast skillet: ground sausage + eggs + peppers',
          'Egg muffins with vegetables and bacon: eggs + veg + bacon, baked',
          'Smoked salmon plate: smoked salmon + cucumber + greens — no cream cheese',
          'Paleo smoothie: fruit + nut milk + nut butter',
          'Chia pudding: chia seeds in coconut milk + fresh seasonal fruit',
          'Paleo breakfast bowl: eggs + avocado + bacon or sausage',
          'Plantain or banana pancakes: blended batter + fresh fruit',
          'Coconut yogurt parfait: coconut yogurt + fruit + grain-free granola',
          'Avocado boats with eggs: halved avocado + baked egg in the well',
          'Baked eggs over greens: eggs baked over sautéed spinach or kale',
          'Grain-free granola with coconut milk: nuts + seeds + coconut milk + fruit',
          'Mushroom and spinach scramble: eggs + sautéed mushrooms + spinach',
          'Paleo waffles: almond or coconut flour batter + fresh fruit',
          'Sausage and egg patties: breakfast sausage + fried egg, plated',
          'Salmon and avocado breakfast plate: fresh or smoked salmon + avocado + greens',
        ].join(' | ')
        breakfastProteins = 'eggs, bacon, breakfast sausage, salmon'
      } else if (lowFodmapMode) {
        breakfastTypes = [
          'Scrambled or fried eggs on gluten-free toast: eggs + GF toast',
          'Rice cakes with peanut butter and banana: simple assembly',
          'Gluten-free oats with safe fruit: GF oats + banana or blueberries + nuts',
          'Fried egg with roasted tomatoes: simple eggs + safe veg',
          'Smoothie: banana + lactose-free milk + peanut butter',
          'Omelette with safe vegetables: eggs + spinach, peppers, or zucchini — no garlic or onion',
          'Lactose-free yogurt parfait: lactose-free yogurt + safe granola + fruit',
          'Chia pudding: chia in lactose-free milk + fresh seasonal fruit',
          'Eggs Benedict on gluten-free muffin: poached eggs on GF muffin',
          'Potato and egg breakfast hash: diced potato + egg — no onion or garlic',
          'Quinoa breakfast porridge: cooked quinoa + lactose-free milk + fresh seasonal fruit',
          'Lactose-free cottage cheese bowl: cottage cheese + safe fruit + nuts',
          'Peanut butter and banana toast (GF): GF bread + peanut butter + banana',
          'Egg muffins with safe vegetables: eggs + spinach or peppers, baked',
          'Gluten-free pancakes with fruit: GF pancakes + maple syrup + fruit',
          'Polenta breakfast bowl with maple: cooked polenta + maple syrup + fruit',
          'Low-FODMAP smoothie bowl: blended safe fruit + lactose-free milk + toppings',
          'Baked eggs with spinach and tomato: eggs baked on spinach + tomato',
          'Rice porridge: cooked rice + lactose-free milk, sweet or savory',
          'Gluten-free French toast with fresh fruit: GF bread + egg dip + fresh seasonal fruit',
        ].join(' | ')
        breakfastProteins = 'eggs, peanut butter, lactose-free yogurt, lactose-free cottage cheese'
      } else {
        breakfastTypes = [
          'Scrambled or fried eggs on toast: eggs + toast + optional cheese or veg',
          'Oatmeal with fruit and nuts: oats + fruit + nut butter',
          'Yogurt parfait with granola: yogurt + granola + fresh fruit — no savory',
          'Avocado toast with egg: toast + avocado + fried or poached egg',
          'Smoothie with fruit: blended fruit + yogurt or milk',
          'Pancakes or waffles: classic batter + fruit or syrup',
          'Breakfast burrito: scrambled eggs + cheese + meat in tortilla',
          'Omelette with cheese and vegetables: eggs + cheese + common veg',
          'Cottage cheese bowl with fruit and nuts: cottage cheese + fruit + nuts — no vegetables',
          'Chia pudding with fruit: chia + milk + fruit + optional nuts',
          'French toast with fruit and syrup: classic French toast',
          'Eggs Benedict: poached eggs on English muffin + hollandaise',
          'Breakfast sandwich: eggs + cheese + meat on bread or muffin',
          'Shakshuka: eggs poached in tomato sauce',
          'Frittata or quiche: eggs + cheese + veg, baked',
          'Granola bowl with milk and fruit: granola + milk + fresh fruit',
          'Egg muffins with cheese and vegetables: eggs + cheese + veg, baked',
          'Breakfast hash: diced potato + breakfast meat + egg',
          'Ricotta toast with honey and fruit: ricotta on toast + honey + fruit',
          'Overnight oats with fruit and nuts: oats + milk + fruit + nuts',
        ].join(' | ')
        breakfastProteins = 'eggs, Greek yogurt, cottage cheese, cheese, bacon, breakfast sausage, ham'
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

      // Exclude breakfast types already assigned to other slots this week so
      // the same type never appears twice. Falls back to full list if we've
      // cycled through all 20 types.
      const usedBreakfastCategories = new Set(
        rawWeekMeals
          .filter(m => !targetKeys.has(`${m.plan_date}|${m.meal_type}`) && m.meal_type === 'breakfast' && m.meal_category)
          .map(m => m.meal_category as string)
      )
      const availableBreakfastTypes = breakfastTypeList.filter(t => !usedBreakfastCategories.has(t))
      const bfTypeSource = availableBreakfastTypes.length >= Math.max(breakfastSlots.length, 1)
        ? availableBreakfastTypes
        : breakfastTypeList

      const breakfastTypePool = shuffle(bfTypeSource).slice(0, Math.max(breakfastSlots.length, 1))
      const lunchTypePool     = shuffle(lunchTypeList).slice(0, Math.max(lunchSlots.length, 1))

      // Remember which type was assigned to each slot so we can persist it
      const slotTypeMap = new Map<string, string>()
      breakfastSlots.forEach((s, i) => slotTypeMap.set(`${s.date}|${s.meal_type}`, breakfastTypePool[i % breakfastTypePool.length]))
      lunchSlots.forEach((s, i) => slotTypeMap.set(`${s.date}|${s.meal_type}`, lunchTypePool[i % lunchTypePool.length]))
      dinnerSlots.forEach((s, i) => slotTypeMap.set(`${s.date}|${s.meal_type}`, cuisinePool[i % cuisinePool.length]))

      // Scan existing week breakfast names for already-used fruits/nuts so we
      // can ban them in the prompt. Each swap is a separate API call, so the
      // "vary fruit and nuts" hard rule only applies within one response —
      // this makes it span the whole week. Includes the slot being swapped
      // so cycling the same slot keeps pushing toward fresh ingredients.
      const FRUIT_TERMS = ['raspberry','raspberries','blueberry','blueberries','strawberry','strawberries','mango','kiwi','apple','peach','peaches','pear','pineapple','banana','cherry','cherries','plum','grape','grapes','papaya','melon','fig','pomegranate']
      const NUT_TERMS   = ['almond','almonds','walnut','walnuts','pecan','pecans','pistachio','pistachios','cashew','cashews','hazelnut','hazelnuts','macadamia','pine nut','pine nuts']

      const allBfNames = rawWeekMeals
        .filter(m => m.meal_type === 'breakfast')
        .map(m => m.meal_name.toLowerCase())

      const weekUsedFruits = FRUIT_TERMS.filter(f => allBfNames.some(n => n.includes(f)))
      const weekUsedNuts   = NUT_TERMS.filter(n  => allBfNames.some(name => name.includes(n)))

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

${currentSlotMeals.length > 0 ? `PREVIOUSLY GENERATED FOR THIS SLOT — you must pick something MEANINGFULLY DIFFERENT (different type, different protein, different main ingredients):\n${currentSlotMeals.join('\n')}\n` : ''}${existingWeekMeals.length > 0 ? `ALREADY PLANNED THIS WEEK — do NOT repeat these meals, do NOT reuse the same main proteins or ingredient combinations:\n${existingWeekMeals.join('\n')}\n` : ''}
${breakfastSlots.length > 0 ? `
=== BREAKFAST (${breakfastSlots.length} meal${breakfastSlots.length !== 1 ? 's' : ''}) ===
Breakfast must be a CLASSIC, RECOGNIZABLE morning meal — what a home cook makes in 10-15 minutes on a weekday.
HARD RULES:
1. Proteins allowed at breakfast: ${breakfastProteins}. Do NOT use dinner proteins (turkey breast, ground beef, roasted meats, trout, steak) at breakfast.
2. Maximum 3 main components. No exotic techniques — no pickling, no marinating, no multi-step prep.
3. Name meals plainly: "Scrambled eggs with bacon and cheddar" not "Artisan Herb-Cured Egg Medallions with Crispy Pancetta".
4. Each slot has a PRE-ASSIGNED breakfast type below. Build the meal within that type — be creative with the specific ingredients but stay in the assigned type. Do NOT substitute a different type.
5. Fruit and nuts ONLY belong in sweet breakfast types — yogurt bowls, cottage cheese bowls, ricotta/mascarpone bowls, chia pudding, pancakes, waffles, French toast, smoothie/açaí bowls, granola bowls, overnight oats, oatmeal/porridge. Do NOT add fruit, berries, or nuts to savory types: eggs + cured meat, omelettes/scrambles, shakshuka, steak and eggs, chorizo and eggs, ground beef hash, pork belly, breakfast skillets, frittatas, egg salad, egg muffins/cups, smoked salmon plates, breakfast sandwiches, cheese plates, stuffed avocado boats (savory fillings only). Savory breakfasts get vegetables, herbs, or cheese — never fruit.
6. When fruit IS used (sweet types only), never repeat the same fruit across multiple breakfasts. Same for nuts. Fruit range: strawberries, peaches, mango, kiwi, apple, banana, pineapple, grapes, cherries, plum, papaya, pear. Nut range: walnuts, pecans, pistachios, cashews, hazelnuts, macadamia.
7. Ingredient naming: do not prefix ingredients with "maple-free", "sugar-free", "unsweetened", or other diet qualifiers — just write the plain ingredient name (e.g., "turkey bacon", not "maple-free turkey bacon").
${weekUsedFruits.length > 0 || weekUsedNuts.length > 0 ? `8. ALREADY USED THIS WEEK — do NOT repeat these in any breakfast:${weekUsedFruits.length > 0 ? ` Fruits: ${weekUsedFruits.join(', ')}.` : ''}${weekUsedNuts.length > 0 ? ` Nuts: ${weekUsedNuts.join(', ')}.` : ''}` : ''}

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

      const saveMeal = async (meal: Record<string, unknown>) => {
        const key = `${meal.date}|${meal.meal_type}`
        if (!targetKeys.has(key)) return  // reject any extra meals the AI hallucinated
        const row = {
          user_id:       user.id,
          plan_date:     meal.date as string,
          meal_type:     meal.meal_type as string,
          meal_name:     meal.meal_name as string,
          meal_category: slotTypeMap.get(key) ?? null,
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
