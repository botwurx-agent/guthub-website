'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Save profile step data ────────────────────────────────────────────────
export async function saveProfileStep(step: number, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ ...data, onboarding_step: step })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Complete onboarding: calculate macros + goal weight, then redirect ────
export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found.' }

  // Calculate macros
  const macroResult = await calculateMacros(profile)
  if (macroResult.error) return { error: macroResult.error }

  // Calculate goal weight
  const goalResult = await calculateGoalWeight(profile)
  if (goalResult.error) return { error: goalResult.error }

  const today = new Date().toISOString().split('T')[0]
  const service = await createServiceClient()

  // Save macro targets
  if (macroResult.macros) {
    const m = macroResult.macros
    await service.from('macro_targets').upsert({
      user_id: user.id,
      target_date: today,
      total_calories: m.total_calories,
      carbs_pct: m.macronutrients.carbohydrates.percentage,
      carbs_g: m.macronutrients.carbohydrates.grams,
      protein_pct: m.macronutrients.protein.percentage,
      protein_g: m.macronutrients.protein.grams,
      fat_pct: m.macronutrients.fat.percentage,
      fat_g: m.macronutrients.fat.grams,
    }, { onConflict: 'user_id,target_date' })
  }

  // Save daily record with starting weight + goal weight
  await service.from('daily_records').upsert({
    user_id: user.id,
    record_date: today,
    current_weight_kg: profile.weight_kg,
    goal_weight_kg: goalResult.goal_weight_kg ?? null,
  }, { onConflict: 'user_id,record_date' })

  // Mark onboarding complete and start the 7-day trial clock
  await service.from('profiles').update({
    onboarding_completed: true,
    profile_completed: true,
    onboarding_step: 6,
    starting_weight_kg: profile.weight_kg,
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq('id', user.id)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ─── Mifflin-St Jeor macro calculation (preserved from Flask) ─────────────
async function calculateMacros(profile: Record<string, unknown>) {
  const weightLbs = kgToLbs(profile.weight_kg as number)
  const heightIn = cmToIn(profile.height_cm as number)
  const healthProfile = (profile.health_profile as Record<string, unknown>) ?? {}
  const gender = profile.gender as string
  const dob = profile.dob as string
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : 30
  const activity = (healthProfile.activity_level as string) ?? 'moderate'
  const diet = (profile.diet_mode as string) ?? 'default'

  // Resolve goals — stored as array; map weight-related chips to macro intent
  const goalsRaw = healthProfile.primary_goals as string[] | string | undefined
  const goals: string[] = Array.isArray(goalsRaw)
    ? goalsRaw
    : goalsRaw ? [goalsRaw] : []

  const WEIGHT_LOSS_GOALS = new Set([
    'support_healthy_weight', 'improve_body_composition', 'fat_loss', 'weight_loss',
  ])
  const MUSCLE_GOALS = new Set(['muscle_gain', 'feel_healthier_in_body'])
  const wantsWeightLoss = goals.some(g => WEIGHT_LOSS_GOALS.has(g))
  const wantsMuscle     = goals.some(g => MUSCLE_GOALS.has(g))
  const macroGoal = wantsWeightLoss ? 'weight_loss' : wantsMuscle ? 'muscle_gain' : 'maintenance'

  const targetWeight = healthProfile.target_weight_lbs as string | number | undefined
  const targetWeightLine = targetWeight
    ? `- Target weight: ${targetWeight} lbs (deficit should reflect distance from goal)`
    : ''

  const prompt = `Calculate TDEE and macro targets using Mifflin-St Jeor formula.

User data:
- Gender: ${gender}
- Age: ${age} years
- Current weight: ${weightLbs.toFixed(1)} lbs
- Height: ${heightIn.toFixed(1)} inches
- Activity level: ${activity}
- Goal: ${macroGoal}
${targetWeightLine}
- Diet preference: ${diet}
- All goals: ${goals.join(', ') || 'general wellness'}

Mifflin-St Jeor BMR:
- Men:   BMR = (4.536 × weight_lb) + (15.88 × height_in) - (5 × age) + 5
- Women: BMR = (4.536 × weight_lb) + (15.88 × height_in) - (5 × age) - 161
- Other: use female formula

Activity multipliers:
- sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9

Calorie target by goal:
- maintenance: TDEE
- weight_loss: TDEE minus 300-500 kcal deficit (larger deficit if target weight is far from current)
- muscle_gain: TDEE plus 200-300 kcal surplus

Macro percentages by goal:
- maintenance or muscle_gain: Carbs 40%, Protein 30%, Fat 30%
- weight_loss: Carbs 25%, Protein 40%, Fat 35%
- keto diet override: Carbs 5%, Protein 35%, Fat 60%

Gram conversion: Carbs÷4, Protein÷4, Fat÷9

Respond ONLY with JSON:
{ "total_calories": number, "macronutrients": { "carbohydrates": { "percentage": number, "grams": number }, "protein": { "percentage": number, "grams": number }, "fat": { "percentage": number, "grams": number } } }`

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    const text = response.choices[0]?.message?.content ?? '{}'
    const macros = JSON.parse(text)
    return { macros }
  } catch (e) {
    return { error: `Macro calculation failed: ${e}` }
  }
}

// ─── Goal weight calculation ───────────────────────────────────────────────
async function calculateGoalWeight(profile: Record<string, unknown>) {
  const weightKg = profile.weight_kg as number
  const heightCm = profile.height_cm as number
  const weightLbs = kgToLbs(weightKg)
  const heightIn = cmToIn(heightCm)
  const healthProfile = (profile.health_profile as Record<string, unknown>) ?? {}
  const goalsRaw = healthProfile.primary_goals as string[] | string | undefined
  const goals: string[] = Array.isArray(goalsRaw) ? goalsRaw : goalsRaw ? [goalsRaw] : []
  const goal = goals.includes('support_healthy_weight') || goals.includes('improve_body_composition')
    ? 'weight_loss'
    : goals.includes('muscle_gain') ? 'muscle_gain' : 'maintenance'
  const targetWeight = healthProfile.target_weight_lbs as string | number | undefined

  const prompt = `Calculate a safe 1-month goal weight milestone.

User:
- Current weight: ${weightLbs.toFixed(1)} lbs
- Height: ${heightIn.toFixed(1)} inches
- Primary goal: ${goal}
${targetWeight ? `- User's target weight: ${targetWeight} lbs` : ''}

Safe rates:
- Weight loss: 0.5-1.0 lb/week (2-4 lbs/month); max 1.5 lb/week if BMI > 30
- Muscle gain: 0.5-1.0 lb/month for beginners
- Maintenance: within 1-3 lbs of current weight

BMI = (weight_lbs / height_in²) × 703; healthy = 18.5-24.9

If user has a target weight, calculate a monthly milestone TOWARD it (not the final target).

Respond ONLY with JSON: { "goal_weight": <integer in lbs> }`

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    const text = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(text)
    const goalLbs = parsed.goal_weight as number
    return { goal_weight_kg: lbsToKg(goalLbs) }
  } catch (e) {
    return { error: `Goal weight calculation failed: ${e}` }
  }
}

// ─── Unit helpers ──────────────────────────────────────────────────────────
function kgToLbs(kg: number) { return kg * 2.20462 }
function lbsToKg(lbs: number) { return lbs / 2.20462 }
function cmToIn(cm: number) { return cm / 2.54 }
