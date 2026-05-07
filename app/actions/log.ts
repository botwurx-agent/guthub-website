'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function logWater({ userId, date, amountMl }: { userId: string; date: string; amountMl: number }) {
  const supabase = await createClient()
  const { error } = await supabase.from('water_logs').insert({
    user_id: userId,
    log_date: date,
    amount_ml: amountMl,
  })
  if (!error) revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}
