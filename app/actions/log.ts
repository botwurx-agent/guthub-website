'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeGutScore } from '@/lib/gut-score'

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
  const today = localDate(formData)

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
  const suspectedTriggerMealId = (formData.get('suspected_trigger_meal_id') as string) || null
  const onsetMinutesRaw = formData.get('onset_minutes')
  const onsetMinutes = onsetMinutesRaw ? parseInt(onsetMinutesRaw as string) : null

  if (!symptomType) return { error: 'Please select a symptom type.' }
  if (!severity || severity < 1 || severity > 10) return { error: 'Please select a severity.' }

  const { error } = await supabase.from('symptom_logs').insert({
    user_id: user.id, log_date: localDate(formData),
    symptom_type: symptomType, severity, notes,
    suspected_trigger_meal_id: suspectedTriggerMealId,
    onset_minutes: onsetMinutes,
  })

  if (error) return { error: error.message }

  await upsertGutScore(supabase, user.id, localDate(formData))
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Bowel movement ───────────────────────────────────────────────────────
export async function logBM(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const bristolType = parseInt(formData.get('bristol_type') as string)
  const notes = (formData.get('notes') as string) || null
  const flagsRaw = formData.get('flags') as string | null
  const flags = flagsRaw ? JSON.parse(flagsRaw) as string[] : []

  if (!bristolType || bristolType < 1 || bristolType > 7) return { error: 'Please select a Bristol type.' }

  const { error } = await supabase.from('bm_logs').insert({
    user_id: user.id, log_date: localDate(formData),
    bristol_type: bristolType, flags, notes,
  })

  if (error) return { error: error.message }

  await upsertGutScore(supabase, user.id, localDate(formData))
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
    user_id: user.id, log_date: localDate(formData), content,
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

  const today = localDate(formData)

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
    .select('calories_consumed, protein_consumed_g, carbs_consumed_g, fat_consumed_g')
    .eq('user_id', user.id).eq('record_date', today).single()

  await supabase.from('daily_records').upsert({
    user_id: user.id, record_date: today,
    calories_consumed: (existing?.calories_consumed ?? 0) + (calories ?? 0),
    protein_consumed_g: (existing?.protein_consumed_g ?? 0) + (protein ?? 0),
    carbs_consumed_g: (existing?.carbs_consumed_g ?? 0) + (carbs ?? 0),
    fat_consumed_g: (existing?.fat_consumed_g ?? 0) + (fat ?? 0),
  }, { onConflict: 'user_id,record_date' })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Delete meal ──────────────────────────────────────────────────────────
export async function deleteMeal(mealId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Fetch the meal first so we can subtract its macros from daily_records
  const { data: meal, error: fetchErr } = await supabase
    .from('meal_logs')
    .select('id, user_id, log_date, calories, protein_g, carbs_g, fat_g')
    .eq('id', mealId)
    .single()

  if (fetchErr || !meal) return { error: 'Meal not found.' }
  if (meal.user_id !== user.id) return { error: 'Not authorized.' }

  const { error: delErr } = await supabase.from('meal_logs').delete().eq('id', mealId)
  if (delErr) return { error: delErr.message }

  // Subtract this meal's macros from daily_records (clamped at 0)
  const { data: existing } = await supabase
    .from('daily_records')
    .select('calories_consumed, protein_consumed_g, carbs_consumed_g, fat_consumed_g')
    .eq('user_id', user.id).eq('record_date', meal.log_date).single()

  if (existing) {
    await supabase.from('daily_records').upsert({
      user_id: user.id, record_date: meal.log_date,
      calories_consumed: Math.max(0, (existing.calories_consumed ?? 0) - (meal.calories ?? 0)),
      protein_consumed_g: Math.max(0, (existing.protein_consumed_g ?? 0) - (meal.protein_g ?? 0)),
      carbs_consumed_g: Math.max(0, (existing.carbs_consumed_g ?? 0) - (meal.carbs_g ?? 0)),
      fat_consumed_g: Math.max(0, (existing.fat_consumed_g ?? 0) - (meal.fat_g ?? 0)),
    }, { onConflict: 'user_id,record_date' })
  }

  revalidatePath('/dashboard')
  revalidatePath('/log')
  return { success: true }
}

// ─── Supplement ───────────────────────────────────────────────────────────
export async function logSupplement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Please enter a supplement name.' }

  const dose = (formData.get('dose') as string)?.trim() || null
  const withFood = formData.get('with_food') === 'on' || formData.get('with_food') === 'true'
  const notes = (formData.get('notes') as string)?.trim() || null

  const { error } = await supabase.from('supplement_logs').insert({
    user_id: user.id, log_date: localDate(formData),
    name, dose, with_food: withFood, notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/log')
  return { success: true }
}

// ─── Re-log meal (quick add same meal to today) ──────────────────────────
export async function reLogMeal(mealId: string, todayDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: orig, error: fetchErr } = await supabase
    .from('meal_logs')
    .select('user_id, meal_name, meal_type, ingredients, calories, protein_g, carbs_g, fat_g')
    .eq('id', mealId)
    .single()

  if (fetchErr || !orig) return { error: 'Meal not found.' }
  if (orig.user_id !== user.id) return { error: 'Not authorized.' }

  const { error: insertErr } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    log_date: todayDate,
    meal_type: orig.meal_type,
    meal_name: orig.meal_name,
    ingredients: orig.ingredients,
    calories: orig.calories,
    protein_g: orig.protein_g,
    fat_g: orig.fat_g,
    carbs_g: orig.carbs_g,
    source: 'manual',
  })
  if (insertErr) return { error: insertErr.message }

  const { data: existing } = await supabase
    .from('daily_records')
    .select('calories_consumed, protein_consumed_g, carbs_consumed_g, fat_consumed_g')
    .eq('user_id', user.id).eq('record_date', todayDate).single()

  await supabase.from('daily_records').upsert({
    user_id: user.id, record_date: todayDate,
    calories_consumed: (existing?.calories_consumed ?? 0) + (orig.calories ?? 0),
    protein_consumed_g: (existing?.protein_consumed_g ?? 0) + (orig.protein_g ?? 0),
    carbs_consumed_g: (existing?.carbs_consumed_g ?? 0) + (orig.carbs_g ?? 0),
    fat_consumed_g: (existing?.fat_consumed_g ?? 0) + (orig.fat_g ?? 0),
  }, { onConflict: 'user_id,record_date' })

  revalidatePath('/dashboard')
  revalidatePath('/log')
  return { success: true }
}

// ─── Ketone ───────────────────────────────────────────────────────────────
export async function logKetone(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const ketoneStr = formData.get('ketone_mmol') as string
  const ketone = parseFloat(ketoneStr)
  if (!ketoneStr || isNaN(ketone) || ketone < 0 || ketone > 20) return { error: 'Please enter a valid ketone level (0–20 mmol/L).' }

  const method = (formData.get('method') as string) || 'blood'
  const notes = (formData.get('notes') as string)?.trim() || null

  const { error } = await supabase.from('ketone_logs').insert({
    user_id: user.id, log_date: localDate(formData),
    ketone_mmol: ketone, method, notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/log')
  return { success: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
async function upsertGutScore(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, date: string) {
  const [{ data: syms }, { data: bms }] = await Promise.all([
    supabase.from('symptom_logs').select('severity').eq('user_id', userId).eq('log_date', date),
    supabase.from('bm_logs').select('bristol_type, urgency, pain').eq('user_id', userId).eq('log_date', date),
  ])
  const { score, symptomPenalty, bmPenalty } = computeGutScore(syms ?? [], bms ?? [])
  await supabase.from('gut_scores').upsert(
    { user_id: userId, score_date: date, score, base_score: 100, symptom_penalty: symptomPenalty, bm_penalty: bmPenalty },
    { onConflict: 'user_id,score_date' }
  )
}

function getToday() { return new Date().toISOString().split('T')[0] }
function localDate(formData: FormData) {
  const d = formData.get('log_date') as string | null
  const tz = formData.get('client_tz') as string | null
  let today = getToday()
  if (tz) { try { today = new Date().toLocaleDateString('en-CA', { timeZone: tz }) } catch {} }
  // Trust an explicit date that is today or in the past (supports retroactive logging); reject future dates
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today) return d
  return today
}
function parseFloatOrNull(v: string | null): number | null {
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}
