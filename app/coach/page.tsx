import { getOrCreateThread, getThreadMessages, getThreadList } from '@/app/actions/coach'
import { createClient } from '@/lib/supabase/server'
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

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? '').split(' ')[0] || 'there'

  const [thread, threads, profileRes] = await Promise.all([
    getOrCreateThread(),
    getThreadList(),
    supabase.from('profiles').select('health_profile').eq('id', user?.id ?? '').single(),
  ])
  const messages = thread ? await getThreadMessages(thread.id) : []
  const welcomeMessage = buildWelcomeMessage(profileRes.data, firstName)

  return (
    <CoachClient
      initialThreadId={thread?.id ?? null}
      initialMessages={messages}
      initialThreads={threads}
      firstName={firstName}
      welcomeMessage={welcomeMessage}
    />
  )
}
