import { getOrCreateThread, getThreadMessages, getThreadList, startNewThread } from '@/app/actions/coach'
import { createClient } from '@/lib/supabase/server'
import { getUserTimezone, todayInTz } from '@/lib/timezone'
import CoachClient from './CoachClient'

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

  const [thread, threads, profileRes] = await Promise.all([
    doAutostart ? startNewThread() : getOrCreateThread(),
    getThreadList(),
    supabase.from('profiles').select('health_profile').eq('id', user?.id ?? '').single(),
  ])
  const messages = thread ? await getThreadMessages(thread.id) : []
  const welcomeMessage = buildWelcomeMessage(profileRes.data, firstName)

  let autostartMessage: string | undefined
  if (doAutostart) {
    const tz = await getUserTimezone()
    const today = todayInTz(tz)
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
    />
  )
}
