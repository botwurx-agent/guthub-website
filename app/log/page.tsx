import { createClient } from '@/lib/supabase/server'
import LogPageClient from './LogPageClient'

export type TimelineItem = {
  id: string
  kind: 'meal' | 'symptom' | 'weight' | 'bm' | 'water' | 'note'
  title: string
  meta: string
  loggedAt: string
  logDate: string
}

export type TimelineDay = {
  label: string
  dateStr: string
  items: TimelineItem[]
}

export type WeekStats = {
  meals: number
  symptoms: number
  weights: number
  notes: number
}

const MEAL_TYPE: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
}

const BRISTOL: Record<number, string> = {
  1: 'Type 1 (hard lumps)', 2: 'Type 2 (lumpy)', 3: 'Type 3 (cracked)',
  4: 'Type 4 (smooth)', 5: 'Type 5 (soft)', 6: 'Type 6 (fluffy)', 7: 'Type 7 (watery)',
}

export default async function LogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toLocaleDateString('en-CA')
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-CA')

  const [
    { data: meals },
    { data: symptoms },
    { data: weights },
    { data: bms },
    { data: waters },
    { data: notes },
    { data: dailyRecord },
    { data: waterLogs },
  ] = await Promise.all([
    supabase.from('meal_logs').select('id, meal_name, meal_type, calories, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('symptom_logs').select('id, symptom_type, severity, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('weight_logs').select('id, weight_kg, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('bm_logs').select('id, bristol_type, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('water_logs').select('id, amount_ml, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('note_logs').select('id, content, log_date, logged_at').eq('user_id', user.id).gte('log_date', sevenDaysAgo).order('logged_at', { ascending: false }),
    supabase.from('daily_records').select('current_weight_kg, goal_weight_kg').eq('user_id', user.id).eq('record_date', today).single(),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('log_date', today),
  ])

  // Build unified timeline items
  const allItems: TimelineItem[] = [
    ...(meals ?? []).map(m => ({
      id: m.id, kind: 'meal' as const, loggedAt: m.logged_at, logDate: m.log_date,
      title: m.meal_name,
      meta: [MEAL_TYPE[m.meal_type ?? ''], m.calories ? `${Math.round(m.calories)} kcal` : ''].filter(Boolean).join(' · '),
    })),
    ...(symptoms ?? []).map(s => ({
      id: s.id, kind: 'symptom' as const, loggedAt: s.logged_at, logDate: s.log_date,
      title: s.symptom_type,
      meta: `Severity ${s.severity}/10`,
    })),
    ...(weights ?? []).map(w => ({
      id: w.id, kind: 'weight' as const, loggedAt: w.logged_at, logDate: w.log_date,
      title: 'Weighed in',
      meta: `${(w.weight_kg * 2.20462).toFixed(1)} lbs`,
    })),
    ...(bms ?? []).map(b => ({
      id: b.id, kind: 'bm' as const, loggedAt: b.logged_at, logDate: b.log_date,
      title: 'Bowel movement',
      meta: BRISTOL[b.bristol_type] ?? `Type ${b.bristol_type}`,
    })),
    ...(waters ?? []).map(w => ({
      id: w.id, kind: 'water' as const, loggedAt: w.logged_at, logDate: w.log_date,
      title: 'Water logged',
      meta: `${Math.round(w.amount_ml)} ml`,
    })),
    ...(notes ?? []).map(n => ({
      id: n.id, kind: 'note' as const, loggedAt: n.logged_at, logDate: n.log_date,
      title: n.content.length > 60 ? n.content.slice(0, 60) + '…' : n.content,
      meta: 'Journal note',
    })),
  ]

  allItems.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))

  // Group by logDate
  const grouped = new Map<string, TimelineItem[]>()
  for (const item of allItems) {
    if (!grouped.has(item.logDate)) grouped.set(item.logDate, [])
    grouped.get(item.logDate)!.push(item)
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const timeline: TimelineDay[] = []
  for (const [date, items] of grouped) {
    const label = date === today ? 'Today'
      : date === yesterday ? 'Yesterday'
      : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    timeline.push({ label, dateStr: date, items })
  }

  const weekStats: WeekStats = {
    meals: meals?.length ?? 0,
    symptoms: symptoms?.length ?? 0,
    weights: weights?.length ?? 0,
    notes: notes?.length ?? 0,
  }

  const currentLbs = dailyRecord?.current_weight_kg
    ? Math.round(dailyRecord.current_weight_kg * 2.20462 * 10) / 10 : null
  const goalLbs = dailyRecord?.goal_weight_kg
    ? Math.round(dailyRecord.goal_weight_kg * 2.20462 * 10) / 10 : null
  const waterGlasses = Math.round((waterLogs ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0) / 240)

  return (
    <LogPageClient
      initialType={type ?? ''}
      userId={user.id}
      today={today}
      timeline={timeline}
      weekStats={weekStats}
      currentLbs={currentLbs}
      goalLbs={goalLbs}
      waterGlasses={waterGlasses}
    />
  )
}
