// ─────────────────────────────────────────────────────────────────────────
// Log feedback — the "coach from the sidelines" engine.
//
// Produces a short, immediate nudge after a user logs a meal or symptom, so
// the app feels responsive from day one — long before there's enough data for
// real statistical correlations.
//
// IMPORTANT framing rule: symptom signals are ALWAYS gentle hypotheses
// ("worth watching"), NEVER conclusions ("X causes your bloating"). Some users
// have a history of disordered eating, so we never tell anyone to avoid a food
// off a single data point. Keep it curious, reversible, and low-pressure.
// ─────────────────────────────────────────────────────────────────────────

export type CoachNudge = {
  text: string
  cta?: { label: string; href: string }
}

// Fermented / gut-friendly foods worth a little positive reinforcement.
const FERMENTED = ['yogurt', 'yoghurt', 'kefir', 'kimchi', 'sauerkraut', 'kombucha', 'miso', 'tempeh', 'natto', 'kvass', 'sourdough', 'pickled', 'kraut']

// High-fiber / microbiome-feeding foods.
const HIGH_FIBER = ['oats', 'oatmeal', 'chia', 'flax', 'lentil', 'bean', 'chickpea', 'quinoa', 'berries', 'raspberr', 'blueberr', 'strawberr', 'spinach', 'kale', 'broccoli', 'avocado', 'almond', 'barley', 'bran', 'artichoke', 'asparagus', 'whole grain', 'whole-grain']

// Common gut triggers → friendly label. Order matters (first match wins).
// Deliberately gentle wording in the labels themselves.
const TRIGGER_MAP: { terms: string[]; label: string }[] = [
  { terms: ['cold brew', 'espresso', 'coffee', 'latte', 'cappuccino', 'caffeine'], label: 'coffee/caffeine' },
  { terms: ['beer', 'wine', 'cocktail', 'whiskey', 'vodka', 'alcohol', 'tequila'], label: 'alcohol' },
  { terms: ['garlic', 'onion', 'leek', 'shallot'], label: 'garlic/onion' },
  { terms: ['broccoli', 'cauliflower', 'cabbage', 'brussels', 'bok choy'], label: 'cruciferous veg' },
  { terms: ['lentil', 'chickpea', 'black bean', 'kidney bean', 'baked bean', 'refried', 'beans', 'legume'], label: 'beans/legumes' },
  { terms: ['ice cream', 'milk', 'cheese', 'cream', 'butter', 'dairy'], label: 'dairy' },
  { terms: ['bread', 'pasta', 'wheat', 'gluten', 'bagel', 'cracker', 'cereal', 'noodle'], label: 'wheat/gluten' },
  { terms: ['spicy', 'chili', 'chilli', 'hot sauce', 'jalapeno', 'jalapeño', 'sriracha', 'cayenne'], label: 'spicy food' },
  { terms: ['fried', 'deep-fried', 'greasy', 'fries'], label: 'fried/greasy food' },
  { terms: ['soda', 'sparkling', 'seltzer', 'carbonated', 'cola'], label: 'carbonated drinks' },
  { terms: ['sugar-free', 'sugar free', 'sorbitol', 'xylitol', 'erythritol', 'aspartame', 'diet '], label: 'artificial sweeteners' },
  { terms: ['mango', 'watermelon', 'high-fructose', 'high fructose', 'honey'], label: 'high-fructose foods' },
]

// Fermented dairy (yogurt/kefir) is often well tolerated — don't flag those
// as a dairy trigger.
const FERMENTED_DAIRY = ['yogurt', 'yoghurt', 'kefir']

function includesAny(haystack: string, terms: string[]): boolean {
  return terms.some(t => haystack.includes(t))
}

function detectTrigger(text: string): string | null {
  const t = text.toLowerCase()
  for (const { terms, label } of TRIGGER_MAP) {
    if (label === 'dairy') {
      // Skip if the only dairy present is fermented dairy.
      if (includesAny(t, terms) && !FERMENTED_DAIRY.some(fd => t.includes(fd))) return label
      continue
    }
    if (includesAny(t, terms)) return label
  }
  return null
}

// Friendly symptom names from the stored snake_case type.
const SYMPTOM_LABELS: Record<string, string> = {
  reflux_heartburn: 'reflux',
  skin_flare_up: 'a skin flare-up',
  stomach_pain: 'stomach pain',
  brain_fog: 'brain fog',
}
function symptomLabel(type: string): string {
  return SYMPTOM_LABELS[type] ?? type.replace(/_/g, ' ')
}

function onsetPhrase(onsetMinutes: number | null, hasMeal: boolean): string {
  if (onsetMinutes != null) {
    if (onsetMinutes <= 0) return 'right after eating'
    if (onsetMinutes <= 30) return 'about half an hour after eating'
    if (onsetMinutes <= 60) return 'about an hour after eating'
    return 'a couple of hours after eating'
  }
  return hasMeal ? 'not long after your last meal' : 'today'
}

// ─── Meal acknowledgment (#3) ──────────────────────────────────────────────
export function buildMealAck({
  mealName, ingredients, mealsTodayCount,
}: {
  mealName: string
  ingredients: string[]
  mealsTodayCount: number
}): CoachNudge {
  const text = `${mealName} ${ingredients.join(' ')}`.toLowerCase()

  if (includesAny(text, FERMENTED)) {
    return { text: 'Nice pick. Fermented foods help feed the good bacteria in your gut.' }
  }
  if (includesAny(text, HIGH_FIBER)) {
    return { text: "Good fiber in there. That's great fuel for a healthy gut microbiome." }
  }
  if (mealsTodayCount >= 3) {
    return { text: `That's ${mealsTodayCount} meals logged today. A full day for me to learn your patterns from.` }
  }
  if (mealsTodayCount <= 1) {
    return { text: 'First meal of the day logged. The more you log, the sharper your insights get.' }
  }
  return { text: 'Logged. Every meal you add sharpens the patterns I can spot.' }
}

// ─── Symptom early signal (#1) ─────────────────────────────────────────────
export function buildSymptomSignal({
  symptomType, candidateMeals, onsetMinutes,
}: {
  symptomType: string
  candidateMeals: { meal_name: string; ingredients: string[] }[]
  onsetMinutes: number | null
}): CoachNudge {
  const symptom = symptomLabel(symptomType)
  const coachCta = { label: 'Talk to your coach', href: '/coach?autostart=symptoms' }

  if (candidateMeals.length === 0) {
    return {
      text: `Logged your ${symptom}. Try logging what you ate today too, and I can start connecting meals to how you feel.`,
      cta: { label: 'Log a meal', href: '/log?type=meal' },
    }
  }

  // Most recent meal before the symptom is the strongest candidate.
  const primary = candidateMeals[0]
  // Look across all candidate meals for a known trigger, preferring the primary.
  let trigger: string | null = detectTrigger(`${primary.meal_name} ${primary.ingredients.join(' ')}`)
  let triggerMealName = primary.meal_name
  if (!trigger) {
    for (const m of candidateMeals.slice(1)) {
      const t = detectTrigger(`${m.meal_name} ${m.ingredients.join(' ')}`)
      if (t) { trigger = t; triggerMealName = m.meal_name; break }
    }
  }

  const phrase = onsetPhrase(onsetMinutes, true)

  if (trigger) {
    return {
      text: `Noticed ${symptom} ${phrase}. Your ${triggerMealName} had ${trigger}, which bothers some people. Too early to be sure, but I'm watching this one. If it happens again, we'll spot the pattern fast.`,
      cta: coachCta,
    }
  }

  return {
    text: `Logged ${symptom} ${phrase} (after ${primary.meal_name}). I'll keep watching how your meals line up with how you feel, and the patterns sharpen over a few days.`,
    cta: coachCta,
  }
}
