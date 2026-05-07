import { createClient } from '@/lib/supabase/server'
import LogPageClient from './LogPageClient'

export default async function LogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const [{ data: dailyRecord }, { data: waterLogs }] = await Promise.all([
    supabase.from('daily_records').select('current_weight_kg, goal_weight_kg').eq('user_id', user.id).eq('record_date', today).single(),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('log_date', today),
  ])

  const currentLbs = dailyRecord?.current_weight_kg ? Math.round(dailyRecord.current_weight_kg * 2.20462 * 10) / 10 : null
  const goalLbs = dailyRecord?.goal_weight_kg ? Math.round(dailyRecord.goal_weight_kg * 2.20462 * 10) / 10 : null
  const waterGlasses = Math.round((waterLogs ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0) / 240)

  return (
    <LogPageClient
      initialType={type ?? 'meal'}
      userId={user.id}
      today={today}
      currentLbs={currentLbs}
      goalLbs={goalLbs}
      waterGlasses={waterGlasses}
    />
  )
}
