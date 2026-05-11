'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Save profile step data ────────────────────────────────────────────────
export async function saveProfileStep(step: number, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  let updateData: Record<string, unknown> = { ...data, onboarding_step: step }

  // Merge health_profile instead of replacing — each step only sends its slice
  if (data.health_profile && typeof data.health_profile === 'object') {
    const { data: existing } = await supabase
      .from('profiles')
      .select('health_profile')
      .eq('id', user.id)
      .single()
    updateData.health_profile = {
      ...((existing?.health_profile as Record<string, unknown>) ?? {}),
      ...(data.health_profile as Record<string, unknown>),
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
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

  // Mark onboarding complete — only set trial_ends_at if card not yet collected (fallback for card-last flow)
  await service.from('profiles').update({
    onboarding_completed: true,
    profile_completed: true,
    onboarding_step: 6,
    starting_weight_kg: profile.weight_kg,
    ...(profile.trial_ends_at ? {} : { trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }),
  }).eq('id', user.id)

  // Send welcome email (non-blocking)
  if (user.email) {
    const firstName = (profile.name ?? '').split(' ')[0] || 'there'
    const healthProfile = (profile.health_profile as Record<string, unknown>) ?? {}
    const goalsRaw = healthProfile.primary_goals as string[] | string | undefined
    const goals: string[] = Array.isArray(goalsRaw) ? goalsRaw : goalsRaw ? [goalsRaw] : []
    const goalLabels: Record<string, string> = {
      improve_digestion: 'Improve digestion',
      reduce_bloating: 'Reduce bloating',
      support_healthy_weight: 'Support a healthy weight',
      increase_energy: 'Increase energy',
      improve_sleep: 'Improve sleep quality',
      manage_ibs: 'Manage IBS symptoms',
      manage_ibd: 'Manage IBD / Crohn\'s',
      reduce_inflammation: 'Reduce inflammation',
    }
    const goalList = goals.slice(0, 3).map(g => goalLabels[g] ?? g.replace(/_/g, ' ')).join(', ')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://guthub-website.vercel.app'

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to GutHub</title></head>
<body style="margin:0;padding:0;background:#FDFAF3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#22432E;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
            <img src="https://guthub-website.vercel.app/logo-dark.png" alt="GutHub" width="140" height="36" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:48px;border-left:1px solid #E0DCD2;border-right:1px solid #E0DCD2;">

            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C85A44;">Welcome</p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#1B1A17;line-height:1.25;">Hi ${firstName}, your gut health journey starts now.</h1>

            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">
              You've completed your profile and your 7-day free trial is now active. We've calculated your personalised macro targets and your AI coach is ready to help.
            </p>

            ${goalList ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A7468;">Your goals</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#1B1A17;">${goalList}</p>
                </td>
              </tr>
            </table>` : ''}

            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">Here's what to explore first:</p>

            <!-- Feature list -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #EFEBE2;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Log</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Track meals, symptoms, water and weight in seconds.</span></p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #EFEBE2;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">AI Coach</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Ask anything about your gut, food, or symptoms — it knows your profile.</span></p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #EFEBE2;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Meal Planner</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Generate a personalised gut-friendly week of meals.</span></p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Insights</span> &nbsp;—&nbsp; <span style="color:#5A564D;">See trends, identify food triggers, track your gut score over time.</span></p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/dashboard" style="display:inline-block;background:#DB6F56;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:0.02em;">Go to my dashboard →</a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/subscribe" style="font-family:Arial,sans-serif;font-size:13px;color:#7A7468;text-decoration:underline;">Or subscribe now to lock in your plan</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#7A7468;">
              Your trial runs for 7 days. If you have any questions, just reply to this email — we read every one.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FAF5EE;border-radius:0 0 16px 16px;border:1px solid #E0DCD2;border-top:none;padding:28px 48px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#9D978A;">GutHub · AI-powered gut health companion</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#C2BDB1;">You're receiving this because you created a GutHub account.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    resend.emails.send({
      from: 'GutHub <hello@guthub.ai>',
      to: user.email,
      subject: `Welcome to GutHub, ${firstName} — your 7-day trial has started`,
      html,
    }).catch(() => { /* non-blocking */ })
  }

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
