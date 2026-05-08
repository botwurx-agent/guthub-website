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

export async function savePlanFromCoach(
  meals: Array<{
    day_index: number
    meal_type: string
    meal_name: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  }>,
  startOffset: number,           // 0 = tomorrow, 1 = day after, etc.
  mode: 'check' | 'replace' | 'skip'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const rows = meals.map(m => {
    const d = new Date()
    d.setDate(d.getDate() + 1 + startOffset + (m.day_index ?? 0))
    return {
      user_id:   user.id,
      plan_date: d.toISOString().split('T')[0],
      meal_type: m.meal_type,
      meal_name: m.meal_name,
      calories:  m.calories ?? null,
      protein_g: m.protein_g ?? null,
      carbs_g:   m.carbs_g ?? null,
      fat_g:     m.fat_g ?? null,
      accepted:  false,
    }
  })

  const targetDates = [...new Set(rows.map(r => r.plan_date))]

  // Always check existing slots for these dates
  const { data: existing } = await supabase
    .from('meal_plan_slots')
    .select('plan_date, meal_type')
    .eq('user_id', user.id)
    .in('plan_date', targetDates)

  const conflictCount = existing?.filter(e =>
    rows.some(r => r.plan_date === e.plan_date && r.meal_type === e.meal_type)
  ).length ?? 0

  // In 'check' mode just return the conflict count — don't save yet
  if (mode === 'check') return { conflicts: conflictCount, total: rows.length }

  const toSave = mode === 'skip'
    ? rows.filter(r => !existing?.some(e => e.plan_date === r.plan_date && e.meal_type === r.meal_type))
    : rows

  if (toSave.length === 0) return { success: true, count: 0 }

  const { error } = await supabase
    .from('meal_plan_slots')
    .upsert(toSave, { onConflict: 'user_id,plan_date,meal_type' })

  return error ? { error: error.message } : { success: true, count: toSave.length }
}

export async function renameThread(threadId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const trimmed = title.trim().slice(0, 100)
  if (!trimmed) return { error: 'Title cannot be empty.' }

  const { error } = await supabase
    .from('coach_threads')
    .update({ title: trimmed })
    .eq('id', threadId)
    .eq('user_id', user.id)

  return error ? { error: error.message } : { success: true, title: trimmed }
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Messages are deleted via cascade (FK on thread_id)
  const { error } = await supabase
    .from('coach_threads')
    .delete()
    .eq('id', threadId)
    .eq('user_id', user.id)

  return error ? { error: error.message } : { success: true }
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
