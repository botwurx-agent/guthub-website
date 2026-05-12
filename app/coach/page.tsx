import { getOrCreateThread, getThreadMessages, getThreadList, startNewThread } from '@/app/actions/coach'
import { createClient } from '@/lib/supabase/server'
import { getUserTimezone, todayInTz, daysAgoInTz } from '@/lib/timezone'
import CoachClient from './CoachClient'

type Suggestion = { title: string; sub: string; icon: string }

function buildDynamicSuggestions(
  profile: Record<string, unknown> | null,
  symptoms: Array<{ symptom_type: string; severity: number; log_date: string }> | null,
  meals: Array<{ meal_name: string; meal_type: string; calories: number | null }> | null,
  macroTarget: { protein_g: number; total_calories: number } | null,
  macroConsumed: { protein_consumed_g: number; calories_consumed: number } | null,
  waterToday: number,
  today: string,
): Suggestion[] {
  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}
  const suggestions: Suggestion[] = []

  // Symptom-driven suggestion
  const recentSymptoms = (symptoms ?? []).filter(s => s.log_date >= today.slice(0, 7))
  const topSymptom = recentSymptoms.sort((a, b) => b.severity - a.severity)[0]
  if (topSymptom) {
    suggestions.push({
      title: `What's causing my ${topSymptom.symptom_type.replace(/_/g, ' ')}?`,
      sub: `Severity ${topSymptom.severity}/10 — let's find the trigger`,
      icon: 'Frown',
    })
  } else {
    suggestions.push({
      title: 'Why am I bloated after meals?',
      sub: 'Identify your personal trigger foods',
      icon: 'Frown',
    })
  }

  // Protein/macro suggestion
  const proteinShortfall = macroTarget && macroConsumed
    ? macroTarget.protein_g - (macroConsumed.protein_consumed_g ?? 0)
    : null
  if (proteinShortfall && proteinShortfall > 30) {
    suggestions.push({
      title: `How do I hit my protein goal?`,
      sub: `You're ${Math.round(proteinShortfall)}g short today — easy ways to catch up`,
      icon: 'FlaskConical',
    })
  } else {
    suggestions.push({
      title: 'Optimize my macros for gut health',
      sub: 'Protein, fiber, and fat balance for my goals',
      icon: 'FlaskConical',
    })
  }

  // Meal plan suggestion based on eating style
  const eatingStyle = Array.isArray(hp.eating_style)
    ? (hp.eating_style as string[])[0]
    : (hp.eating_style as string | null) ?? ''
  const styleLabel = eatingStyle ? eatingStyle.replace(/_/g, '-') : 'my goals'
  suggestions.push({
    title: `Plan my week (${styleLabel})`,
    sub: 'A 7-day plan personalized to my profile',
    icon: 'Utensils',
  })

  // Water/hydration suggestion
  if (waterToday < 960) {
    suggestions.push({
      title: 'How does hydration affect my gut?',
      sub: `You've had ${Math.round(waterToday / 240 * 10) / 10} cups today — let's talk impact`,
      icon: 'Droplets',
    })
  } else {
    suggestions.push({
      title: 'What should I eat tonight?',
      sub: 'Quick gut-friendly dinner — under 30 minutes',
      icon: 'ChefHat',
    })
  }

  // Recent meals pattern suggestion
  const mealNames = (meals ?? []).slice(0, 10).map(m => m.meal_name.toLowerCase())
  const hasRepeatMeals = new Set(mealNames).size < mealNames.length * 0.7
  if (hasRepeatMeals) {
    suggestions.push({
      title: 'Help me add more variety',
      sub: 'I keep eating the same meals — suggest alternatives',
      icon: 'ShoppingCart',
    })
  } else {
    suggestions.push({
      title: 'Make me a grocery list',
      sub: 'Based on my 7-day meal plan',
      icon: 'ShoppingCart',
    })
  }

  // Lifestyle/sleep suggestion
  const sleepHours = hp.sleep_hours as string | null
  if (sleepHours && parseFloat(sleepHours) < 7) {
    suggestions.push({
      title: 'Does poor sleep hurt my gut?',
      sub: `You're getting ~${sleepHours}h — let's look at the connection`,
      icon: 'Moon',
    })
  } else {
    suggestions.push({
      title: 'How do I reduce reflux at night?',
      sub: 'Practical, evidence-based evening routine',
      icon: 'Moon',
    })
  }

  return suggestions.slice(0, 6)
}

function buildWelcomeMessage(profile: Record<string, unknown> | null, firstName: string): string {
  if (!profile) return `Hi ${firstName}! I'm your GutHub Coach. What would you like to work on today?`

  const hp = (profile.health_profile as Record<string, unknown>) ?? {}
  const nickname = hp.nickname as string | null
  const displayName = nickname || firstName

  const conditions = hp.medical_conditions as string | null
  const goals = Array.isArray(hp.primary_goals)
    ? (hp.primary_goals as string[]).slice(0, 2).join(' and ')
    : (hp.primary_goals as string | null) ?? (hp.primary_goal as string | null)
  const eatingStyle = Array.isArray(hp.eating_style)
    ? (hp.eating_style as string[]).join(', ')
    : (hp.eating_style as string | null)
  const concerns = hp.specific_concerns as string | null

  const parts: string[] = []

  if (conditions) parts.push(`managing ${conditions}`)
  if (goals) parts.push(`working toward ${goals.replace(/_/g, ' ')}`)
  if (eatingStyle) parts.push(`following a ${eatingStyle} approach`)

  const contextLine = parts.length > 0
    ? `I can see you're ${parts.join(', ')}.`
    : ''

  const concernLine = concerns
    ? ` Your specific concern — "${concerns}" — is something I'll keep in mind as we work together.`
    : ''

  return `Hi ${displayName}! ${contextLine}${concernLine} I have your full health profile and logs in front of me, so every answer I give you will be personalized to *you*, not generic advice. What would you like to work on today?`.trim()
}

export default async function CoachPage({ searchParams }: { searchParams: Promise<{ autostart?: string }> }) {
  const { autostart } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? '').split(' ')[0] || 'there'

  const doAutostart = autostart === 'symptoms' && !!user
  const tz = await getUserTimezone()
  const today = todayInTz(tz)
  const sevenDaysAgo = daysAgoInTz(tz, 7)

  const [thread, threads, profileRes, symptomsRes, mealsRes, macroTargetRes, dailyRecordRes, waterRes] = await Promise.all([
    doAutostart ? startNewThread() : getOrCreateThread(),
    getThreadList(),
    supabase.from('profiles').select('health_profile').eq('id', user?.id ?? '').single(),
    supabase.from('symptom_logs').select('symptom_type, severity, log_date').eq('user_id', user?.id ?? '').gte('log_date', sevenDaysAgo).order('log_date', { ascending: false }).limit(15),
    supabase.from('meal_logs').select('meal_name, meal_type, calories').eq('user_id', user?.id ?? '').gte('log_date', sevenDaysAgo).order('log_date', { ascending: false }).limit(20),
    supabase.from('macro_targets').select('protein_g, total_calories').eq('user_id', user?.id ?? '').order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('daily_records').select('protein_consumed_g, calories_consumed').eq('user_id', user?.id ?? '').eq('record_date', today).single(),
    supabase.from('water_logs').select('amount_ml, log_date').eq('user_id', user?.id ?? '').eq('log_date', today),
  ])

  const waterToday = (waterRes.data ?? []).reduce((s: number, w: { amount_ml: number }) => s + (w.amount_ml ?? 0), 0)
  const suggestions = buildDynamicSuggestions(
    profileRes.data,
    symptomsRes.data,
    mealsRes.data,
    macroTargetRes.data ?? null,
    dailyRecordRes.data ?? null,
    waterToday,
    today,
  )

  const messages = thread ? await getThreadMessages(thread.id) : []
  const welcomeMessage = buildWelcomeMessage(profileRes.data, firstName)

  let autostartMessage: string | undefined
  if (doAutostart) {
    const [{ data: symptoms }, { data: meals }] = await Promise.all([
      supabase.from('symptom_logs').select('symptom_type, severity, notes').eq('user_id', user!.id).eq('log_date', today).order('logged_at'),
      supabase.from('meal_logs').select('meal_name, meal_type, calories').eq('user_id', user!.id).eq('log_date', today).order('logged_at'),
    ])

    const symptomLines = (symptoms ?? []).map(s =>
      `- ${s.symptom_type.replace(/_/g, ' ')} (severity ${s.severity}/10)${s.notes ? `: "${s.notes}"` : ''}`
    ).join('\n')
    const mealLines = (meals ?? []).map(m =>
      `- ${m.meal_name}${m.calories ? ` (${Math.round(m.calories)} kcal)` : ''}`
    ).join('\n')

    autostartMessage = `I've been having some symptoms today and want to understand what might be triggering them. Here's what I logged:

**Symptoms today:**
${symptomLines || '- (none logged yet)'}

**Meals today:**
${mealLines || '- (none logged yet)'}

Can you analyze this and help me identify any patterns or potential food triggers? What should I pay attention to for the rest of the day?`
  }

  return (
    <CoachClient
      initialThreadId={thread?.id ?? null}
      initialMessages={messages}
      initialThreads={threads}
      firstName={firstName}
      welcomeMessage={welcomeMessage}
      autostartMessage={autostartMessage}
      suggestions={suggestions}
    />
  )
}
