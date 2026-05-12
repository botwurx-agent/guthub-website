'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type LogDraft = {
  meal_name: string
  meal_type: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export type SymptomDraft = {
  symptom_type: string
  severity: number
  notes?: string
}

export type WaterDraft = {
  amount_ml: number
}

export type WeightDraft = {
  weight_lbs: number
}

export async function logMealFromCoach(draft: LogDraft, clientTz: string, clientDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (!draft.meal_name?.trim()) return { error: 'Missing meal name.' }
  const allowedTypes = new Set(['breakfast', 'lunch', 'dinner', 'snack', 'beverage'])
  const mealType = allowedTypes.has(draft.meal_type) ? draft.meal_type : 'snack'

  // Compute the user's local date — prefer their tz, fall back to client-sent date
  let logDate = clientDate
  if (clientTz) {
    try { logDate = new Date().toLocaleDateString('en-CA', { timeZone: clientTz }) } catch { /* fall back */ }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) logDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    log_date: logDate,
    meal_type: mealType,
    meal_name: draft.meal_name.trim().slice(0, 200),
    ingredients: JSON.stringify([]),
    calories: draft.calories ?? null,
    protein_g: draft.protein_g ?? null,
    carbs_g: draft.carbs_g ?? null,
    fat_g: draft.fat_g ?? null,
    source: 'coach',
  })

  if (error) return { error: error.message }
  revalidatePath('/log')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function logSymptomFromCoach(draft: SymptomDraft, clientTz: string, clientDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (!draft.symptom_type?.trim()) return { error: 'Missing symptom type.' }
  const severity = Math.min(10, Math.max(1, Math.round(draft.severity)))
  if (!severity) return { error: 'Invalid severity.' }

  let logDate = clientDate
  if (clientTz) {
    try { logDate = new Date().toLocaleDateString('en-CA', { timeZone: clientTz }) } catch { /* fall back */ }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) logDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('symptom_logs').insert({
    user_id: user.id,
    log_date: logDate,
    symptom_type: draft.symptom_type.trim().toLowerCase(),
    severity,
    notes: draft.notes?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/log')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function logWaterFromCoach(draft: WaterDraft, clientTz: string, clientDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  const amountMl = Math.round(draft.amount_ml)
  if (!amountMl || amountMl < 1) return { error: 'Invalid amount.' }

  let logDate = clientDate
  if (clientTz) {
    try { logDate = new Date().toLocaleDateString('en-CA', { timeZone: clientTz }) } catch { /* fall back */ }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) logDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('water_logs').insert({
    user_id: user.id,
    log_date: logDate,
    amount_ml: amountMl,
  })
  if (error) return { error: error.message }
  revalidatePath('/log')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function logWeightFromCoach(draft: WeightDraft, clientTz: string, clientDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  const weightKg = Math.round((draft.weight_lbs / 2.20462) * 100) / 100
  if (!weightKg || weightKg < 20) return { error: 'Invalid weight.' }

  let logDate = clientDate
  if (clientTz) {
    try { logDate = new Date().toLocaleDateString('en-CA', { timeZone: clientTz }) } catch { /* fall back */ }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) logDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('weight_logs').insert({
    user_id: user.id,
    log_date: logDate,
    weight_kg: weightKg,
  })
  if (error) return { error: error.message }
  revalidatePath('/log')
  revalidatePath('/dashboard')
  return { success: true }
}

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
