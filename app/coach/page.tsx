import { getOrCreateThread, getThreadMessages, getThreadList } from '@/app/actions/coach'
import { createClient } from '@/lib/supabase/server'
import CoachClient from './CoachClient'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? '').split(' ')[0] || 'there'

  const [thread, threads] = await Promise.all([
    getOrCreateThread(),
    getThreadList(),
  ])
  const messages = thread ? await getThreadMessages(thread.id) : []

  return (
    <CoachClient
      initialThreadId={thread?.id ?? null}
      initialMessages={messages}
      initialThreads={threads}
      firstName={firstName}
    />
  )
}
