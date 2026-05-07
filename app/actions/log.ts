'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Water ────────────────────────────────────────────────────────────────
export async function logWater({ userId, date, amountMl }: { userId: string; date: string; amountMl: number }) {
  const supabase = await createClient()
  const { error } = await supabase.from('water_logs').insert({ user_id: userId, log_date: date, amount_ml: amountMl })
  if (!error) revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}

// ─── Weight ───────────────────────────────────────────────────────────────
export async function logWeight(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const weightLbs = parseFloat(formData.get('weight_lbs') as string)
  if (!weightLbs || weightLbs < 50 || weightLbs > 700) return { error: 'Please enter a valid weight.' }

  const weightKg = weightLbs / 2.20462
  const today = getToday()

  const [logRes, recordRes] = await Promise.all([
    supabase.from('weight_logs').insert({ user_id: user.id, log_date: today, weight_kg: weightKg }),
    supabase.from('daily_records').upsert(
      { user_id: user.id, record_date: today, current_weight_kg: weightKg },
      { onConflict: 'user_id,record_date' }
    ),
  ])

  if (logRes.error) return { error: logRes.error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Symptom ──────────────────────────────────────────────────────────────
export async function logSymptom(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const symptomType = formData.get('symptom_type') as string
  const severity = parseInt(formData.get('severity') as string)
  const notes = (formData.get('notes') as string) || null

  if (!symptomType) return { error: 'Please select a symptom type.' }
  if (!severity || severity < 1 || severity > 10) return { error: 'Please select a severity.' }

  const { error } = await supabase.from('symptom_logs').insert({
    user_id: user.id, log_date: getToday(),
    symptom_type: symptomType, severity, notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Bowel movement ───────────────────────────────────────────────────────
export async function logBM(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const bristolType = parseInt(formData.get('bristol_type') as string)
  const urgency = formData.get('urgency') ? parseInt(formData.get('urgency') as string) : null
  const pain = formData.get('pain') ? parseInt(formData.get('pain') as string) : null
  const notes = (formData.get('notes') as string) || null

  if (!bristolType || bristolType < 1 || bristolType > 7) return { error: 'Please select a Bristol type.' }

  const { error } = await supabase.from('bm_logs').insert({
    user_id: user.id, log_date: getToday(),
    bristol_type: bristolType, urgency, pain, notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Note ─────────────────────────────────────────────────────────────────
export async function logNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const content = (formData.get('content') as string)?.trim()
  if (!content) return { error: 'Please enter a note.' }

  const { error } = await supabase.from('note_logs').insert({
    user_id: user.id, log_date: getToday(), content,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Meal ─────────────────────────────────────────────────────────────────
export async function logMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const mealName = (formData.get('meal_name') as string)?.trim()
  if (!mealName) return { error: 'Please enter a meal name.' }

  const mealType = (formData.get('meal_type') as string) || 'snack'
  const calories = parseFloatOrNull(formData.get('calories') as string)
  const protein = parseFloatOrNull(formData.get('protein') as string)
  const carbs = parseFloatOrNull(formData.get('carbs') as string)
  const fat = parseFloatOrNull(formData.get('fat') as string)
  const ingredientsRaw = (formData.get('ingredients') as string)?.trim()
  const ingredients = ingredientsRaw
    ? ingredientsRaw.split('\n').map(s => s.trim()).filter(Boolean)
    : []

  const today = getToday()

  const { error: mealError } = await supabase.from('meal_logs').insert({
    user_id: user.id, log_date: today,
    meal_type: mealType, meal_name: mealName,
    ingredients: JSON.stringify(ingredients),
    calories, protein_g: protein, fat_g: fat, carbs_g: carbs,
    source: 'manual',
  })
  if (mealError) return { error: mealError.message }

  // Update daily_record consumed totals
  const { data: existing } = await supabase
    .from('daily_records')
    .select('calories_consumed, protein_consumed_g, carbohydrates_consumed_g, fat_consumed_g')
    .eq('user_id', user.id).eq('record_date', today).single()

  await supabase.from('daily_records').upsert({
    user_id: user.id, record_date: today,
    calories_consumed: (existing?.calories_consumed ?? 0) + (calories ?? 0),
    protein_consumed_g: (existing?.protein_consumed_g ?? 0) + (protein ?? 0),
    carbohydrates_consumed_g: (existing?.carbohydrates_consumed_g ?? 0) + (carbs ?? 0),
    fat_consumed_g: (existing?.fat_consumed_g ?? 0) + (fat ?? 0),
  }, { onConflict: 'user_id,record_date' })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getToday() { return new Date().toISOString().split('T')[0] }
function parseFloatOrNull(v: string | null): number | null {
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}
