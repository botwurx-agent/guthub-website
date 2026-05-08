'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, RefreshCw, Check, Sparkles, UtensilsCrossed, ShoppingCart, Settings, Copy } from 'lucide-react'

type Slot = {
  id: string
  plan_date: string
  meal_type: string
  meal_name: string
  ingredients: string[]
  directions: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  accepted: boolean
}

type Profile = {
  diet_mode: string | null
  health_profile: Record<string, string> | null
}

type MacroTarget = {
  total_calories: number | null
  protein_g: number | null
  carbohydrates_g: number | null
  fat_g: number | null
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_GRADIENTS: Record<string, string> = {
  breakfast: 'linear-gradient(135deg, #fde68a, #f5c7aa)',
  lunch: 'linear-gradient(135deg, #86efac, #5eead4)',
  dinner: 'linear-gradient(135deg, #6ee7b7, #1f5441)',
}

// ─── Shopping list ingredient consolidation ────────────────────────────────

const UNIT_MAP: Record<string, string> = {
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  ml: 'ml',
  l: 'l', liter: 'l', litre: 'l', liters: 'l', litres: 'l',
  clove: 'clove', cloves: 'clove',
  slice: 'slice', slices: 'slice',
  piece: 'piece', pieces: 'piece',
  can: 'can', cans: 'can',
  scoop: 'scoop', scoops: 'scoop',
  strip: 'strip', strips: 'strip',
  bunch: 'bunch', bunches: 'bunch',
  sprig: 'sprig', sprigs: 'sprig',
}

const PLURALIZE_UNITS = new Set(['cup', 'slice', 'piece', 'clove', 'scoop', 'can', 'strip', 'bunch', 'sprig'])
const PREP_SUFFIX_RX = /,\s*(chopped|sliced|diced|minced|grated|halved|crushed|torn|wilted|cooked|baked|grilled|scrambled|hard-boiled|soft-boiled|boiled|roasted|steamed|peeled|cubed|quartered|shelled|blanched|flaked|seared|smoked|optional|cold-smoked|thawed|frozen).*$/i

function parseLeadingQty(s: string): { qty: number; rest: string } | null {
  // Normalize unicode fractions
  s = s.replace(/½/g, '0.5').replace(/¼/g, '0.25').replace(/¾/g, '0.75')
       .replace(/⅓/g, '0.333').replace(/⅔/g, '0.667').replace(/⅛/g, '0.125')
  // Match: mixed "1 1/2", fraction "1/4", decimal/integer
  const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s+/)
  if (!m) return null
  const raw = m[1].trim()
  let qty: number
  if (raw.includes(' ')) {
    const [whole, frac] = raw.split(' ')
    const [n, d] = frac.split('/')
    qty = parseInt(whole) + parseInt(n) / parseInt(d)
  } else if (raw.includes('/')) {
    const [n, d] = raw.split('/')
    qty = parseInt(n) / parseInt(d)
  } else {
    qty = parseFloat(raw)
  }
  return isNaN(qty) || qty <= 0 ? null : { qty, rest: s.slice(m[0].length) }
}

function fmtQty(n: number): string {
  if (n % 1 === 0) return String(n)
  const r = Math.round(n * 4) / 4
  const whole = Math.floor(r)
  const frac = r - whole
  const fracStr = frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : parseFloat(frac.toFixed(1)).toString()
  return whole > 0 ? `${whole} ${fracStr}` : fracStr
}

function consolidateIngredients(ingredients: string[]): string[] {
  type Entry = { qty: number; unit: string; name: string }
  const groups = new Map<string, Entry>()
  const noQty: string[] = []

  // Build unit regex (longest first to avoid prefix matches)
  const unitWords = Object.keys(UNIT_MAP).sort((a, b) => b.length - a.length)
  const unitRx = new RegExp(`^(${unitWords.join('|')})(?:\\s+of)?\\s+`, 'i')

  for (const raw of ingredients) {
    // Compounds like "1 tbsp oil & 1 tbsp lemon juice" — split and recurse
    if (/ & | \+ /.test(raw)) {
      const parts = raw.split(/ & | \+ /).map(p => p.trim()).filter(Boolean)
      const sub = consolidateIngredients(parts)
      // Merge sub results back into groups — re-run through consolidation
      for (const s of sub) {
        const inner = consolidateIngredients([s])
        // already processed; just add to noQty for simplicity if can't re-parse
        noQty.push(...inner)
      }
      continue
    }

    // Strip parenthetical alt-units/notes e.g. "(6 oz)" or "(cold-smoked)"
    const cleaned = raw.replace(/\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim()

    const parsed = parseLeadingQty(cleaned)
    if (!parsed) { noQty.push(raw); continue }

    const { qty, rest } = parsed
    const unitM = rest.match(unitRx)
    let unit = '', name = rest

    if (unitM) {
      unit = UNIT_MAP[unitM[1].toLowerCase()] ?? unitM[1].toLowerCase()
      name = rest.slice(unitM[0].length).trim()
    }

    // Normalize name: lowercase, strip prep suffixes
    name = name.toLowerCase().replace(PREP_SUFFIX_RX, '').replace(/[,.]$/, '').trim()
    if (!name) { noQty.push(raw); continue }

    const key = `${unit}|${name}`
    if (groups.has(key)) {
      groups.get(key)!.qty += qty
    } else {
      groups.set(key, { qty, unit, name })
    }
  }

  const result: string[] = []
  for (const { qty, unit, name } of groups.values()) {
    const qtyStr = fmtQty(qty)
    const displayUnit = unit
      ? (qty > 1 && PLURALIZE_UNITS.has(unit) ? unit + 's' : unit)
      : ''
    // For weight units, include the dual measurement (g + oz / kg + lb)
    let conv = ''
    if (unit === 'g')      conv = `(${trimZero((qty / 28.3495).toFixed(1))} oz)`
    else if (unit === 'oz') conv = `(${Math.round(qty * 28.3495)} g)`
    else if (unit === 'kg') conv = `(${trimZero((qty * 2.20462).toFixed(1))} lb)`
    else if (unit === 'lb') conv = `(${trimZero((qty * 0.4536).toFixed(2))} kg)`
    result.push([qtyStr, displayUnit, conv, name].filter(Boolean).join(' '))
  }

  return [...result.sort(), ...noQty.sort()]
}

function trimZero(s: string): string {
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

// Shopping list category map. Keyword match runs in order, first hit wins.
const SHOP_CATEGORIES: { key: string; label: string; emoji: string; keywords: string[] }[] = [
  { key: 'produce', label: 'Produce', emoji: '🥬',
    keywords: ['tomato','onion','garlic','shallot','lettuce','spinach','kale','arugula','broccoli','cauliflower','carrot','pepper','bell pepper','cucumber','zucchini','squash','pumpkin','mushroom','avocado','lemon','lime','orange','grapefruit','berry','blueberr','strawberr','raspberr','blackberr','apple','banana','grape','melon','pear','peach','plum','mango','pineapple','herb','parsley','cilantro','basil','dill','mint','rosemary','thyme','sage','ginger','celery','scallion','green onion','leek','asparagus','green bean','peas','corn','potato','sweet potato','yam','beet','radish','cabbage','brussels','eggplant','okra','chard','sprout','jicama','fennel','artichoke','cherry','fig','date','watermelon','kiwi','olive','salad'] },
  { key: 'protein', label: 'Proteins', emoji: '🍗',
    keywords: ['chicken','beef','steak','salmon','tuna','shrimp','prawn','turkey','pork','bacon','ham','sausage','egg','tofu','tempeh','seitan','lentil','bean','chickpea','black bean','kidney bean','pinto','meat','fish','seafood','lamb','bison','duck','crab','lobster','sardine','mackerel','cod','tilapia','halibut','trout','anchov','liver','venison','jerky'] },
  { key: 'dairy', label: 'Dairy', emoji: '🥛',
    keywords: ['milk','yogurt','yoghurt','cheese','butter','cream','cottage','kefir','ghee','whey','feta','mozzarella','cheddar','parmesan','ricotta','goat cheese','cream cheese','sour cream','half-and-half','buttermilk'] },
  { key: 'grain', label: 'Grains & Bread', emoji: '🌾',
    keywords: ['oat','rice','quinoa','bread','pasta','noodle','flour','cereal','tortilla','wrap','cracker','pita','bagel','bun','roll','barley','farro','bulgur','couscous','rye','wheat','sourdough','pancake','waffle','granola','muesli','panko','breadcrumb'] },
  { key: 'pantry', label: 'Pantry & Spices', emoji: '🧂',
    keywords: ['olive oil','coconut oil','avocado oil','sesame oil','vegetable oil','canola','salt','pepper','cumin','paprika','turmeric','cinnamon','nutmeg','clove','cardamom','curry','garam','chili','cayenne','oregano','vinegar','soy sauce','tamari','coconut amino','broth','stock','honey','maple','syrup','sugar','vanilla','cocoa','chocolate','almond butter','peanut butter','tahini','mustard','ketchup','mayo','sriracha','salsa','hummus','pesto','dressing','sauce','baking','yeast','oil','spice','seasoning','tomato paste','tomato sauce','coconut milk','almond milk','oat milk','soy milk','plant milk'] },
  { key: 'snacks', label: 'Nuts, Seeds & Snacks', emoji: '🥜',
    keywords: ['almond','cashew','walnut','pecan','pistachio','peanut','hazelnut','macadamia','brazil nut','chia','flax','hemp','pumpkin seed','sunflower seed','sesame','nut','seed','trail mix','popcorn','protein bar','energy bar','protein powder'] },
]

function categorize(ingredient: string): string {
  const lower = ingredient.toLowerCase()
  for (const cat of SHOP_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.key
    }
  }
  return 'other'
}

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatWeekEyebrow(monday: Date): string {
  return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export default function MealPlannerClient() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regeneratingSlot, setRegeneratingSlot] = useState<string | null>(null)
  const [acceptingSlot, setAcceptingSlot] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [activeMeal, setActiveMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner')
  const [planDays, setPlanDays] = useState<1 | 3 | 7>(7)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [macros, setMacros] = useState<MacroTarget | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    const startStr = toDateStr(weekStart)
    const endStr = toDateStr(addDays(weekStart, 6))
    const { data } = await supabase
      .from('meal_plan_slots')
      .select('*')
      .gte('plan_date', startStr)
      .lte('plan_date', endStr)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true })
    setSlots(data ?? [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    fetchSlots()
    setActiveDay(0)
  }, [fetchSlots])

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: mac }] = await Promise.all([
        supabase.from('profiles').select('diet_mode, health_profile').eq('id', user.id).single(),
        supabase.from('macro_targets').select('total_calories, protein_g, carbohydrates_g, fat_g').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
      ])
      if (prof) setProfile(prof as Profile)
      if (mac) setMacros(mac as MacroTarget)
    }
    fetchProfile()
  }, [])

  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)))
  const activeDateStr = weekDates[activeDay]
  const daySlots = slots.filter(s => s.plan_date === activeDateStr)
  const activeSlot = slots.find(s => s.plan_date === activeDateStr && s.meal_type === activeMeal)
  const hasAnyMeals = slots.length > 0

  const dayCalories = Math.round(daySlots.reduce((sum, s) => sum + (s.calories ?? 0), 0))
  const dayProtein = Math.round(daySlots.reduce((sum, s) => sum + (s.protein_g ?? 0), 0))

  const allIngredients = slots.flatMap(s => s.ingredients ?? [])
  const uniqueIngredients = consolidateIngredients(allIngredients)

  // Group ingredients by category for shopping list
  const groupedIngredients = (() => {
    const groups = new Map<string, string[]>()
    for (const item of uniqueIngredients) {
      const key = categorize(item)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    // Return in defined order, with 'other' last
    const ordered: { key: string; label: string; emoji: string; items: string[] }[] = []
    for (const cat of SHOP_CATEGORIES) {
      if (groups.has(cat.key)) {
        ordered.push({ key: cat.key, label: cat.label, emoji: cat.emoji, items: groups.get(cat.key)! })
      }
    }
    if (groups.has('other')) {
      ordered.push({ key: 'other', label: 'Other', emoji: '🛒', items: groups.get('other')! })
    }
    return ordered
  })()

  function toggleChecked(item: string) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  async function copyShoppingList() {
    const text = groupedIngredients
      .map(g => `${g.label}:\n${g.items.map(i => `  • ${i}`).join('\n')}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — silently noop */ }
  }

  async function generateWeek() {
    setGenerating(true)
    await fetch('/api/meal-planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart: toDateStr(weekStart), regenerate: null, days: planDays }),
    })
    await fetchSlots()
    setGenerating(false)
  }

  async function regenerateMeal(date: string, mealType: string) {
    const key = `${date}-${mealType}`
    setRegeneratingSlot(key)
    await fetch('/api/meal-planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart: toDateStr(weekStart), regenerate: { date, mealType } }),
    })
    await fetchSlots()
    setRegeneratingSlot(null)
  }

  async function toggleAccept(slot: Slot) {
    setAcceptingSlot(slot.id)
    await supabase
      .from('meal_plan_slots')
      .update({ accepted: !slot.accepted })
      .eq('id', slot.id)
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, accepted: !s.accepted } : s))
    setAcceptingSlot(null)
  }

  const dietLabel = profile?.diet_mode
    ? profile.diet_mode.replace(/_/g, ' ')
    : 'Balanced'

  const allergiesLabel = (() => {
    const h = profile?.health_profile ?? {}
    const raw = h['allergies'] ?? h['food_allergies'] ?? ''
    if (!raw) return 'None listed'
    if (Array.isArray(raw)) return (raw as string[]).join(', ')
    return String(raw)
  })()

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--terracotta-500)', display: 'block', marginBottom: 6,
            }}>
              Week of {formatWeekEyebrow(weekStart)}
            </span>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400,
              margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2,
            }}>
              A week that <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>fits you</em>.
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)', maxWidth: 520 }}>
              Built from your eating style, dietary needs, and macro targets. Swap anything you don&apos;t like.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            {/* Day count selector */}
            <div style={{ display: 'flex', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 10, padding: 3, gap: 2 }}>
              {([1, 3, 7] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setPlanDays(d)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: planDays === d ? '#fff' : 'transparent',
                    color: planDays === d ? 'var(--ink-800)' : 'var(--ink-400)',
                    boxShadow: planDays === d ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 140ms',
                  }}
                >
                  {d} {d === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
            <button
              onClick={generateWeek}
              disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: generating ? 'var(--cream-100)' : 'var(--terracotta-500)',
                border: '1px solid transparent',
                borderRadius: 10, padding: '9px 18px',
                fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
                color: generating ? 'var(--ink-400)' : '#fff', transition: 'all 160ms',
              }}
            >
              <Sparkles size={15} />
              {generating ? 'Generating…' : hasAnyMeals ? `Regenerate ${planDays === 1 ? '1 day' : `${planDays} days`}` : `Generate ${planDays === 1 ? '1 day' : `${planDays} days`}`}
            </button>
          </div>
        </div>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div style={{
          background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 16,
          padding: '40px 32px', textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--cream-200)', borderTopColor: 'var(--terracotta-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ink-700)' }}>Building your meal plan…</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>AI is crafting {planDays * 3} gut-friendly meals</p>
        </div>
      )}

      {/* Empty state */}
      {!generating && !loading && !hasAnyMeals && (
        <div style={{
          background: 'var(--cream-100)', border: '2px dashed var(--cream-200)', borderRadius: 16,
          padding: '64px 32px', textAlign: 'center',
        }}>
          <UtensilsCrossed size={44} color="var(--ink-300)" style={{ marginBottom: 20 }} />
          <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--ink-600)', margin: '0 0 8px' }}>No meals planned yet</p>
          <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 24px' }}>
            Select how many days to plan above, then click <strong>Generate</strong> to get AI-crafted meals based on your macros.
          </p>
          <button
            onClick={generateWeek}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--terracotta-500)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '11px 22px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Sparkles size={16} /> Generate week
          </button>
        </div>
      )}

      {/* Main content */}
      {!generating && hasAnyMeals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          {/* LEFT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Week strip card */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-800)' }}>This week&apos;s plan</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setWeekStart(w => addDays(w, -7))}
                    style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronLeft size={15} color="var(--ink-500)" />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', padding: '5px 4px', whiteSpace: 'nowrap' }}>
                    {formatWeekRange(weekStart)}
                  </span>
                  <button
                    onClick={() => setWeekStart(w => addDays(w, 7))}
                    style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronRight size={15} color="var(--ink-500)" />
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {weekDates.map((date, i) => {
                  const isActive = i === activeDay
                  const isToday = date === toDateStr(new Date())
                  const dayDate = new Date(date + 'T12:00:00')
                  const hasSlots = slots.some(s => s.plan_date === date)
                  return (
                    <button
                      key={date}
                      onClick={() => setActiveDay(i)}
                      style={{
                        background: isActive ? 'var(--terracotta-50)' : 'var(--cream-100)',
                        border: `1px solid ${isActive ? 'var(--terracotta-300)' : 'var(--cream-200)'}`,
                        borderRadius: 12, padding: '12px 6px',
                        cursor: 'pointer', textAlign: 'center',
                        color: isActive ? 'var(--terracotta-700)' : 'var(--ink-700)',
                        transition: 'all 140ms',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75, color: isToday ? 'var(--terracotta-500)' : undefined }}>
                        {DAY_LABELS[i]}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 4, color: isToday ? 'var(--terracotta-500)' : undefined }}>
                        {dayDate.getDate()}
                      </div>
                      {hasSlots && (
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: isActive ? 'var(--terracotta-400)' : 'var(--ink-300)',
                          margin: '5px auto 0',
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day meals card */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--ink-800)' }}>
                  {DAY_LABELS[activeDay]}, {new Date(activeDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
                {dayCalories > 0 && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>
                    ~{dayCalories.toLocaleString()} kcal · {dayProtein}g protein · tap any meal to view recipe
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MEAL_TYPES.map(meal => {
                  const slot = slots.find(s => s.plan_date === activeDateStr && s.meal_type === meal)
                  const isActive = activeMeal === meal
                  const key = `${activeDateStr}-${meal}`
                  const isRegenerating = regeneratingSlot === key
                  const isAccepting = acceptingSlot === (slot?.id ?? '')

                  if (isRegenerating) {
                    return (
                      <div key={meal} style={{
                        border: '1px solid var(--cream-200)', borderRadius: 14,
                        padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: MEAL_GRADIENTS[meal], flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', color: 'var(--ink-400)', letterSpacing: '0.06em', marginBottom: 3 }}>{meal}</div>
                          <div style={{ fontSize: 14, color: 'var(--ink-400)' }}>Regenerating…</div>
                        </div>
                      </div>
                    )
                  }

                  if (!slot) {
                    return (
                      <div key={meal} style={{
                        border: '1px dashed var(--cream-200)', borderRadius: 14,
                        padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: MEAL_GRADIENTS[meal], flexShrink: 0, opacity: 0.4 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', color: 'var(--ink-400)', letterSpacing: '0.06em', marginBottom: 3 }}>{meal}</div>
                          <div style={{ fontSize: 14, color: 'var(--ink-300)' }}>No meal planned</div>
                        </div>
                        <button
                          onClick={() => regenerateMeal(activeDateStr, meal)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
                            borderRadius: 8, padding: '7px 12px',
                            fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', cursor: 'pointer',
                          }}
                        >
                          <Sparkles size={13} /> Generate
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={meal}
                      onClick={() => setActiveMeal(meal)}
                      style={{
                        border: `1px solid ${isActive ? 'var(--terracotta-300)' : 'var(--cream-200)'}`,
                        borderRadius: 14,
                        padding: '14px 16px',
                        background: isActive ? 'var(--terracotta-50)' : '#fff',
                        boxShadow: isActive ? '0 0 0 3px rgba(217,119,87,0.1)' : 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 14,
                        transition: 'all 140ms',
                      }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: MEAL_GRADIENTS[meal], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em', color: isActive ? 'var(--terracotta-600)' : 'var(--ink-500)', marginBottom: 3 }}>
                          {meal}{isActive ? ' · viewing' : ''}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {slot.meal_name}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-400)' }}>
                          <span>{Math.round(slot.calories)} kcal</span>
                          <span>P {Math.round(slot.protein_g)}g</span>
                          <span>Gut-friendly</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); regenerateMeal(activeDateStr, meal) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
                            borderRadius: 7, padding: '5px 10px',
                            fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', cursor: 'pointer',
                          }}
                        >
                          <RefreshCw size={12} /> Swap
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleAccept(slot) }}
                          disabled={isAccepting}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: slot.accepted ? '#dcfce7' : 'var(--cream-100)',
                            border: `1px solid ${slot.accepted ? '#86efac' : 'var(--cream-200)'}`,
                            borderRadius: 7, padding: '5px 10px',
                            fontSize: 12, fontWeight: 600, color: slot.accepted ? '#16a34a' : 'var(--ink-500)', cursor: 'pointer',
                          }}
                        >
                          <Check size={12} /> {slot.accepted ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recipe detail card */}
            {activeSlot && (
              <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em', color: 'var(--terracotta-500)', marginBottom: 4 }}>
                      Recipe — {activeMeal}
                    </div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1.25 }}>
                      {activeSlot.meal_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleAccept(activeSlot)}
                    disabled={acceptingSlot === activeSlot.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: activeSlot.accepted ? '#dcfce7' : 'var(--terracotta-500)',
                      border: 'none', borderRadius: 9, padding: '9px 16px',
                      fontSize: 13, fontWeight: 600,
                      color: activeSlot.accepted ? '#16a34a' : '#fff',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 140ms',
                    }}
                  >
                    <Check size={14} /> {activeSlot.accepted ? 'Saved' : 'Save meal'}
                  </button>
                </div>

                {/* Hero: gradient image + macros side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginBottom: 24 }}>
                  <div style={{
                    borderRadius: 14, height: 200,
                    background: MEAL_GRADIENTS[activeMeal],
                    position: 'relative', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', bottom: 10, left: 10,
                      background: 'rgba(253,250,243,0.92)', backdropFilter: 'blur(8px)',
                      padding: '5px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600, color: 'var(--forest-600)',
                    }}>
                      Gut-friendly · serves 2
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {[
                        { label: 'Kcal', val: Math.round(activeSlot.calories).toString() },
                        { label: 'Protein', val: `${Math.round(activeSlot.protein_g)}g` },
                        { label: 'Carbs', val: `${Math.round(activeSlot.carbs_g)}g` },
                        { label: 'Fat', val: `${Math.round(activeSlot.fat_g)}g` },
                      ].map(m => (
                        <div key={m.label} style={{
                          background: 'var(--cream-50)', borderRadius: 10,
                          padding: '12px 8px', textAlign: 'center',
                          border: '1px solid var(--cream-200)',
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-800)', fontFamily: 'var(--font-display)' }}>{m.val}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['Low FODMAP', 'Gut-friendly', 'Anti-inflammatory'].map(tag => (
                        <span key={tag} style={{
                          fontSize: 12, fontWeight: 600,
                          background: '#f0fdf4', color: '#16a34a',
                          border: '1px solid #bbf7d0',
                          borderRadius: 999, padding: '3px 10px',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ingredients + Method side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>
                  <div>
                    <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--terracotta-600)', fontWeight: 700, margin: '0 0 12px' }}>
                      Ingredients
                    </h4>
                    {(activeSlot.ingredients ?? []).length > 0 ? (
                      <ul style={{ paddingLeft: 18, lineHeight: 1.8, color: 'var(--ink-800)', fontSize: 14, margin: 0 }}>
                        {(activeSlot.ingredients ?? []).map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>No ingredients listed.</p>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--terracotta-600)', fontWeight: 700, margin: '0 0 12px' }}>
                      Method
                    </h4>
                    {activeSlot.directions ? (
                      <ol style={{ paddingLeft: 18, lineHeight: 1.8, color: 'var(--ink-800)', fontSize: 14, margin: 0 }}>
                        {activeSlot.directions.split(/\n+/).filter(Boolean).map((step, i) => (
                          <li key={i}>{step.replace(/^\d+[\.\)]\s*/, '')}</li>
                        ))}
                      </ol>
                    ) : (
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>No directions listed.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Shopping list */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--ink-800)' }}>Shopping list</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-400)' }}>
                    {uniqueIngredients.length > 0
                      ? `${uniqueIngredients.length - checkedItems.size} of ${uniqueIngredients.length} left`
                      : 'For the week'}
                  </p>
                </div>
                {uniqueIngredients.length > 0 ? (
                  <button
                    type="button"
                    onClick={copyShoppingList}
                    title="Copy list to clipboard"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: copied ? 'var(--forest-50, #EEF3EF)' : 'var(--cream-100)',
                      border: `1px solid ${copied ? 'var(--forest-200, #C5D5C9)' : 'var(--cream-200)'}`,
                      borderRadius: 8, padding: '5px 10px',
                      fontSize: 12, fontWeight: 600,
                      color: copied ? 'var(--forest-500)' : 'var(--ink-600)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'all 160ms',
                    }}
                  >
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                ) : (
                  <ShoppingCart size={18} color="var(--ink-300)" />
                )}
              </div>

              {uniqueIngredients.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>Generate a meal plan to see your shopping list.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                  {groupedIngredients.map(group => {
                    // Sort: unchecked first, then checked at bottom; alphabetical within each.
                    const sorted = [...group.items].sort((a, b) => {
                      const ac = checkedItems.has(a) ? 1 : 0
                      const bc = checkedItems.has(b) ? 1 : 0
                      if (ac !== bc) return ac - bc
                      return a.localeCompare(b)
                    })
                    const remaining = group.items.filter(i => !checkedItems.has(i)).length
                    return (
                      <div key={group.key}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: 6, paddingBottom: 4,
                          borderBottom: '1px solid var(--cream-200)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 14 }}>{group.emoji}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-600)' }}>
                              {group.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>
                            {remaining}/{group.items.length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {sorted.map((item, i) => {
                            const checked = checkedItems.has(item)
                            return (
                              <label key={`${group.key}-${i}`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  fontSize: 13.5, padding: '4px 0',
                                  cursor: 'pointer',
                                  color: checked ? 'var(--ink-300)' : 'var(--ink-700)',
                                  textDecoration: checked ? 'line-through' : 'none',
                                  transition: 'color 160ms',
                                }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleChecked(item)}
                                  style={{ accentColor: 'var(--terracotta-400)', flexShrink: 0, cursor: 'pointer' }}
                                />
                                <span>{item}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Plan settings */}
            <div style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--terracotta-500)',
              }}>
                Plan settings
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-500)' }}>Eating style</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)', textTransform: 'capitalize' }}>{dietLabel}</span>
                </div>
                <div style={{ height: 1, background: 'var(--cream-200)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-500)' }}>Avoiding</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{allergiesLabel}</span>
                </div>
                <div style={{ height: 1, background: 'var(--cream-200)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-500)' }}>Calorie target</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>
                    {macros?.total_calories ? `${macros.total_calories.toLocaleString()} / day` : 'Not set'}
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--cream-200)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-500)' }}>Protein target</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>
                    {macros?.protein_g ? `${macros.protein_g}g / day` : 'Not set'}
                  </span>
                </div>
              </div>
              <button
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  width: '100%', marginTop: 16,
                  background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
                  borderRadius: 9, padding: '9px 0',
                  fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', cursor: 'pointer',
                }}
                onClick={() => window.location.href = '/onboarding'}
              >
                <Settings size={14} /> Adjust preferences
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
