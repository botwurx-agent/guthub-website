'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOrCreateThread() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('coach_threads')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) return existing

  const { data: newThread } = await supabase
    .from('coach_threads')
    .insert({ user_id: user.id, title: 'New conversation' })
    .select('id, title, created_at')
    .single()

  return newThread
}

export async function getThreadMessages(threadId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_messages')
    .select('id, role, content, has_image, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(50)

  return data ?? []
}

export async function startNewThread() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('coach_threads')
    .insert({ user_id: user.id, title: 'New conversation' })
    .select('id, title, created_at')
    .single()

  return data
}

export async function getThreadList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('coach_threads')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  return data ?? []
}
