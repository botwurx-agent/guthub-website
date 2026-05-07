import { SupabaseClient } from '@supabase/supabase-js'

// Builds the 4-layer AI context injected as a system message
// Layer 1: Profile
// Layer 2: Active state (today)
// Layer 3: 14-day log patterns
// Layer 4: Historical summary cache (nightly)

export async function buildCoachContext(supabase: SupabaseClient, userId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  const [
    { data: profile },
    { data: dailyRecord },
    { data: macroTarget },
    { data: gutScore },
    { data: recentSymptoms },
    { data: recentBMs },
    { data: recentWeights },
    { data: recentMeals },
    { data: historicalSummary },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('daily_records').select('*').eq('user_id', userId).eq('record_date', today).single(),
    supabase.from('macro_targets').select('*').eq('user_id', userId).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('gut_scores').select('score').eq('user_id', userId).eq('score_date', today).single(),
    supabase.from('symptom_logs').select('symptom_type, severity, log_date').eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }),
    supabase.from('bm_logs').select('bristol_type, urgency, pain, log_date').eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }),
    supabase.from('weight_logs').select('weight_kg, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(14),
    supabase.from('meal_logs').select('meal_name, meal_type, calories, protein_g, carbs_g, fat_g, log_date').eq('user_id', userId).gte('log_date', fourteenDaysAgo).order('log_date', { ascending: false }).limit(20),
    supabase.from('historical_summaries').select('summary_text').eq('user_id', userId).order('summary_date', { ascending: false }).limit(1).single(),
  ])

  const hp = (profile?.health_profile as Record<string, string>) ?? {}
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10
  const cmToFtIn = (cm: number) => {
    const totalIn = cm / 2.54
    return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`
  }
  const age = profile?.dob
    ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 31557600000)
    : null

  // ── Layer 1: Profile ──────────────────────────────────────────────────────
  const profileSection = `## USER PROFILE
Name: ${profile?.name ?? 'Unknown'}
Age: ${age ?? 'Unknown'}
Gender: ${profile?.gender ?? 'Unknown'}
Weight: ${profile?.weight_kg ? kgToLbs(profile.weight_kg) + ' lbs' : 'Unknown'}
Height: ${profile?.height_cm ? cmToFtIn(profile.height_cm) : 'Unknown'}
Diet mode: ${profile?.diet_mode ?? 'default'}
Activity level: ${hp.activity_level ?? 'Unknown'}
Primary goal: ${hp.primary_goal ?? 'Unknown'}
Medications: ${hp.medications || 'None reported'}
Medical conditions: ${hp.medical_conditions || 'None reported'}
Allergies: ${hp.allergies || 'None reported'}
Family history: ${hp.family_history || 'None reported'}
Sleep: ${hp.sleep_hours ? hp.sleep_hours + ' hrs/night' : 'Unknown'}
Stress level: ${hp.stress_level ?? 'Unknown'}
Additional notes: ${hp.additional_notes || 'None'}
Conservative mode: ${profile?.conservative_mode ? 'YES — avoid aggressive advice' : 'No'}`

  // ── Layer 2: Active state ─────────────────────────────────────────────────
  const gutScoreVal = gutScore?.score ?? null
  const consumed = dailyRecord
    ? `${Math.round(dailyRecord.calories_consumed ?? 0)} kcal | Protein ${Math.round(dailyRecord.protein_consumed_g ?? 0)}g | Carbs ${Math.round(dailyRecord.carbohydrates_consumed_g ?? 0)}g | Fat ${Math.round(dailyRecord.fat_consumed_g ?? 0)}g`
    : 'No data yet today'
  const targets = macroTarget
    ? `${Math.round(macroTarget.total_calories)} kcal | Protein ${Math.round(macroTarget.protein_g)}g | Carbs ${Math.round(macroTarget.carbs_g)}g | Fat ${Math.round(macroTarget.fat_g)}g`
    : 'Not calculated yet'
  const currentWeight = dailyRecord?.current_weight_kg ? kgToLbs(dailyRecord.current_weight_kg) + ' lbs' : 'Not logged today'
  const goalWeight = dailyRecord?.goal_weight_kg ? kgToLbs(dailyRecord.goal_weight_kg) + ' lbs' : 'Not set'

  const activeSection = `## TODAY (${today})
Gut score: ${gutScoreVal !== null ? Math.round(gutScoreVal) + '/100' : 'Not yet calculated'}
Current weight: ${currentWeight}
Goal weight: ${goalWeight}
Consumed: ${consumed}
Targets: ${targets}`

  // ── Layer 3: 14-day patterns ──────────────────────────────────────────────
  const symptomSummary = recentSymptoms?.length
    ? recentSymptoms.slice(0, 10).map(s => `${s.log_date}: ${s.symptom_type} (severity ${s.severity}/10)`).join('\n')
    : 'No symptoms logged in the last 14 days.'

  const bmSummary = recentBMs?.length
    ? recentBMs.slice(0, 7).map(b => `${b.log_date}: Bristol type ${b.bristol_type}${b.urgency ? `, urgency ${b.urgency}` : ''}${b.pain ? `, pain ${b.pain}` : ''}`).join('\n')
    : 'No BMs logged in the last 14 days.'

  const weightTrend = recentWeights?.length
    ? recentWeights.slice(0, 7).map(w => `${w.log_date}: ${kgToLbs(w.weight_kg)} lbs`).join('\n')
    : 'No weight logs.'

  const mealSummary = recentMeals?.length
    ? recentMeals.slice(0, 8).map(m => `${m.log_date} ${m.meal_type}: ${m.meal_name}${m.calories ? ` (${Math.round(m.calories)} kcal)` : ''}`).join('\n')
    : 'No meals logged recently.'

  const logsSection = `## LAST 14 DAYS
### Symptoms
${symptomSummary}

### Bowel movements
${bmSummary}

### Weight trend
${weightTrend}

### Recent meals
${mealSummary}`

  // ── Layer 4: Historical summary ───────────────────────────────────────────
  const historySection = historicalSummary?.summary_text
    ? `## HISTORICAL SUMMARY\n${historicalSummary.summary_text}`
    : ''

  return [profileSection, activeSection, logsSection, historySection].filter(Boolean).join('\n\n')
}
