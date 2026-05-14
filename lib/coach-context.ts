import { SupabaseClient } from '@supabase/supabase-js'
import { todayInTz, daysAgoInTz } from './timezone'

// Builds the 4-layer AI context injected as a system message
// Layer 1: Profile (full intake form data)
// Layer 2: Active state (today)
// Layer 3: 14-day log patterns
// Layer 4: Historical summary cache (nightly)

export async function buildCoachContext(supabase: SupabaseClient, userId: string, tz = 'UTC'): Promise<string> {
  const today = todayInTz(tz)
  const fourteenDaysAgo = daysAgoInTz(tz, 14)

  const [
    { data: profile },
    { data: dailyRecord },
    { data: macroTarget },
    { data: gutScore },
    { data: recentSymptoms },
    { data: recentBMs },
    { data: recentWeights },
    { data: recentMeals },
    { data: recentNotes },
    { data: recentWater },
    { data: recentSupplements },
    { data: mealPlan },
    { data: historicalSummary },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('daily_records').select('*').eq('user_id', userId).eq('record_date', today).single(),
    supabase.from('macro_targets').select('*').eq('user_id', userId).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('gut_scores').select('score').eq('user_id', userId).eq('score_date', today).single(),
    supabase.from('symptom_logs')
      .select('symptom_type, severity, log_date, onset_minutes, notes')
      .eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(15),
    supabase.from('bm_logs')
      .select('bristol_type, flags, log_date, notes')
      .eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(10),
    supabase.from('weight_logs').select('weight_kg, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(14),
    supabase.from('meal_logs')
      .select('meal_name, meal_type, calories, protein_g, carbs_g, fat_g, log_date, ingredients')
      .eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(25),
    supabase.from('note_logs').select('content, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(5),
    supabase.from('water_logs').select('amount_ml, log_date').eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(14),
    supabase.from('supplement_logs').select('name, dose, with_food, log_date, notes').eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(20),
    supabase.from('meal_plan_slots')
      .select('plan_date, meal_type, meal_name, calories, protein_g, carbs_g, fat_g, accepted')
      .eq('user_id', userId).gte('plan_date', today).lte('plan_date', new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]).order('plan_date').order('meal_type').limit(21),
    supabase.from('historical_summaries').select('summary_text').eq('user_id', userId).order('summary_date', { ascending: false }).limit(1).single(),
  ])

  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10
  const cmToFtIn = (cm: number) => {
    const totalIn = cm / 2.54
    return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`
  }
  const age = profile?.dob
    ? Math.floor((Date.now() - new Date(profile.dob as string).getTime()) / 31557600000)
    : null

  const str = (v: unknown) => (v ? String(v) : null)
  const arr = (v: unknown) => Array.isArray(v) ? (v as string[]).join(', ') : str(v)

  // ── Layer 1: Full intake profile ─────────────────────────────────────────
  const profileSection = `## USER PROFILE
Name: ${str(profile?.name) ?? 'Unknown'}${hp.nickname ? ` (goes by "${hp.nickname}")` : ''}
Age: ${age ?? 'Unknown'}
Gender: ${str(profile?.gender) ?? 'Unknown'}
Current weight: ${profile?.weight_kg ? kgToLbs(profile.weight_kg as number) + ' lbs' : 'Unknown'}
Height: ${profile?.height_cm ? cmToFtIn(profile.height_cm as number) : 'Unknown'}
Starting weight: ${profile?.starting_weight_kg ? kgToLbs(profile.starting_weight_kg as number) + ' lbs' : 'Unknown'}
Target weight: ${hp.target_weight_lbs ? hp.target_weight_lbs + ' lbs' : 'Not set'}

Diet / eating style: ${arr(hp.eating_style) || str(profile?.diet_mode) || 'Default'}
How strictly they follow it: ${str(hp.eating_style_relationship) || 'Not specified'}
Cooking frequency: ${str(hp.cooking_frequency) || 'Not specified'}
Typical day of eating: ${str(hp.typical_day_meals) || 'Not described'}

Primary goals: ${arr(hp.primary_goals) || str(hp.primary_goal) || 'Unknown'}
Specific concerns: ${str(hp.specific_concerns) || 'None reported'}
Activity level: ${str(hp.activity_level) || 'Unknown'}
Has worked with RD before: ${str(hp.has_worked_with_rd) || 'Unknown'}

Medical conditions: ${arr(hp.medical_conditions) || 'None reported'}${hp.undiagnosed_symptoms ? `\nSelf-reported symptoms (undiagnosed): ${hp.undiagnosed_symptoms} — user is still figuring out what's going on; take a discovery-oriented, exploratory approach rather than assuming a specific condition` : ''}
Food allergens: ${arr(hp.allergens) || arr(hp.allergies) || 'None reported'}
Medications / supplements: ${str(hp.medications) || 'None reported'}
Is pregnant: ${hp.is_pregnant ? 'Yes' : 'No'}
ED history flag: ${hp.ed_history ? 'Yes — use conservative, non-diet language' : 'No'}
Conservative mode: ${profile?.conservative_mode ? 'YES — avoid aggressive dietary advice' : 'No'}

Sleep quality: ${str(hp.sleep_quality) || 'Unknown'}
Sleep hours: ${str(hp.sleep_hours) ? str(hp.sleep_hours) + ' hrs/night' : 'Unknown'}
Energy level: ${str(hp.energy_level) || 'Unknown'}
Stress level: ${hp.stress_level !== undefined ? String(hp.stress_level) + '/10' : 'Unknown'}
Exercise routine: ${str(hp.exercise_routine) || 'Not described'}
Additional notes: ${str(hp.additional_notes) || 'None'}`

  // ── Layer 2: Active state ─────────────────────────────────────────────────
  const gutScoreVal = gutScore?.score ?? null
  const consumed = dailyRecord
    ? `${Math.round(dailyRecord.calories_consumed ?? 0)} kcal | Protein ${Math.round(dailyRecord.protein_consumed_g ?? 0)}g | Carbs ${Math.round(dailyRecord.carbs_consumed_g ?? 0)}g | Fat ${Math.round(dailyRecord.fat_consumed_g ?? 0)}g`
    : 'No data yet today'
  const targets = macroTarget
    ? `${Math.round(macroTarget.total_calories)} kcal | Protein ${Math.round(macroTarget.protein_g)}g | Carbs ${Math.round(macroTarget.carbs_g)}g | Fat ${Math.round(macroTarget.fat_g)}g`
    : 'Not calculated yet'
  const goalWeight = dailyRecord?.goal_weight_kg ? kgToLbs(dailyRecord.goal_weight_kg as number) + ' lbs' : 'Not set'

  const waterToday = recentWater?.filter(w => w.log_date === today).reduce((s, w) => s + (w.amount_ml ?? 0), 0) ?? 0

  const activeSection = `## TODAY (${today}, user's local date)
Gut score: ${gutScoreVal !== null ? Math.round(gutScoreVal as number) + '/100' : 'Not yet calculated'}
Goal weight (this month): ${goalWeight}
Consumed: ${consumed}
Targets: ${targets}
Water intake today: ${waterToday > 0 ? Math.round(waterToday) + ' ml (' + (waterToday / 240).toFixed(1) + ' cups)' : 'Not logged'}`

  // ── Layer 3: 14-day patterns ──────────────────────────────────────────────
  const symptomSummary = recentSymptoms?.length
    ? recentSymptoms.slice(0, 12).map(s =>
        `${s.log_date}: ${s.symptom_type} (severity ${s.severity}/10)${s.onset_minutes != null ? `, onset ~${s.onset_minutes}min after eating` : ''}${s.notes ? ` — "${s.notes}"` : ''}`
      ).join('\n')
    : 'No symptoms logged in the last 14 days.'

  const bmSummary = recentBMs?.length
    ? recentBMs.slice(0, 7).map(b => {
        const flagsArr = (b.flags as string[] | null) ?? []
        const flagsLabel = flagsArr.length ? `, flags: ${flagsArr.join(', ')}` : ''
        return `${b.log_date}: Bristol type ${b.bristol_type}${flagsLabel}${b.notes ? ` — "${b.notes}"` : ''}`
      }).join('\n')
    : 'No BMs logged in the last 14 days.'

  const weightTrend = recentWeights?.length
    ? recentWeights.slice(0, 7).map(w => `${w.log_date}: ${kgToLbs(w.weight_kg as number)} lbs`).join('\n')
    : 'No weight logs.'

  const mealSummary = recentMeals?.length
    ? recentMeals.slice(0, 10).map(m =>
        `${m.log_date} ${m.meal_type}: ${m.meal_name}${m.calories ? ` (${Math.round(m.calories)} kcal` : ''}${m.protein_g ? `, ${Math.round(m.protein_g)}g protein` : ''}${m.calories || m.protein_g ? ')' : ''}`
      ).join('\n')
    : 'No meals logged recently.'

  const waterSummary = recentWater?.length
    ? (() => {
        const byDay: Record<string, number> = {}
        recentWater.forEach(w => { byDay[w.log_date] = (byDay[w.log_date] ?? 0) + (w.amount_ml ?? 0) })
        return Object.entries(byDay).slice(0, 7).map(([d, ml]) => `${d}: ${Math.round(ml)} ml`).join(', ')
      })()
    : 'No water logs.'

  const notesSummary = recentNotes?.length
    ? recentNotes.map(n => `${n.log_date}: "${n.content}"`).join('\n')
    : 'No recent notes.'

  const supplementsSummary = recentSupplements?.length
    ? recentSupplements.slice(0, 12).map(s =>
        `${s.log_date}: ${s.name}${s.dose ? ` (${s.dose})` : ''}${s.with_food ? ', with food' : ''}${s.notes ? ` — "${s.notes}"` : ''}`
      ).join('\n')
    : 'No supplements logged in the last 14 days.'

  const logsSection = `## LAST 14 DAYS
### Symptoms
${symptomSummary}

### Bowel movements
${bmSummary}

### Weight trend
${weightTrend}

### Water intake
${waterSummary}

### Recent meals
${mealSummary}

### Supplements
${supplementsSummary}

### User notes
${notesSummary}`

  // ── Meal plan (current week) ──────────────────────────────────────────────
  const planSection = mealPlan?.length
    ? `## CURRENT MEAL PLAN (this week)\n` + mealPlan.map(s =>
        `${s.plan_date} ${s.meal_type}: ${s.meal_name}${s.calories ? ` (${Math.round(s.calories)} kcal)` : ''}${s.accepted ? ' ✓ accepted' : ''}`
      ).join('\n')
    : ''

  // ── Layer 4: Historical summary ───────────────────────────────────────────
  const historySection = historicalSummary?.summary_text
    ? `## HISTORICAL SUMMARY\n${historicalSummary.summary_text as string}`
    : ''

  return [profileSection, activeSection, logsSection, planSection, historySection].filter(Boolean).join('\n\n')
}
