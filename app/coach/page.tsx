import { getOrCreateThread, getThreadMessages } from '@/app/actions/coach'
import CoachClient from './CoachClient'

export default async function CoachPage() {
  const thread = await getOrCreateThread()
  const messages = thread ? await getThreadMessages(thread.id) : []

  return (
    <CoachClient
      initialThreadId={thread?.id ?? null}
      initialMessages={messages}
    />
  )
}
