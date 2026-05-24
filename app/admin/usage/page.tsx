import { createServiceClient } from '@/lib/supabase/server'

function StatCard({ label, value, sub, color = 'var(--ink-900)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function AdoptionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{count.toLocaleString()} users · {pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--cream-100)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: color,
          width: `${pct}%`, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export default async function AdminUsagePage() {
  const supabase = await createServiceClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { count: onboarded },
    { count: totalMeals },
    { count: totalSymptoms },
    { count: totalBms },
    { count: totalWater },
    { count: totalWeight },
    { count: totalCoachThreads },
    { count: totalMealPlanSlots },
    { count: totalNotes },
    { count: totalSupplements },
    { count: usersLoggedMeal },
    { count: usersLoggedSymptom },
    { count: usersUsedCoach },
    { count: usersUsedPlanner },
    { count: mealLogs30d },
    { count: symptomLogs30d },
    { count: coachThreads30d },
    { count: mealLogs7d },
    { count: symptomLogs7d },
    { data: topMealTypes },
    { data: topSymptoms },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('onboarding_completed', true),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }),
    supabase.from('symptom_logs').select('*', { count: 'exact', head: true }),
    supabase.from('bm_logs').select('*', { count: 'exact', head: true }),
    supabase.from('water_logs').select('*', { count: 'exact', head: true }),
    supabase.from('weight_logs').select('*', { count: 'exact', head: true }),
    supabase.from('coach_threads').select('*', { count: 'exact', head: true }),
    supabase.from('meal_plan_slots').select('*', { count: 'exact', head: true }),
    supabase.from('note_logs').select('*', { count: 'exact', head: true }),
    supabase.from('supplement_logs').select('*', { count: 'exact', head: true }),
    supabase.from('meal_logs').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null),
    supabase.from('symptom_logs').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null),
    supabase.from('coach_threads').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null),
    supabase.from('meal_plan_slots').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('symptom_logs').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('coach_threads').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('symptom_logs').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('meal_logs').select('meal_type').limit(200),
    supabase.from('symptom_logs').select('symptom_type').limit(500),
    supabase.from('profiles').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const total = totalUsers ?? 0

  // Aggregate meal types
  const mealTypeCounts: Record<string, number> = {}
  for (const m of topMealTypes ?? []) {
    const t = m.meal_type ?? 'unknown'
    mealTypeCounts[t] = (mealTypeCounts[t] ?? 0) + 1
  }
  const topMealTypesSorted = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Aggregate symptom types
  const symptomCounts: Record<string, number> = {}
  for (const s of topSymptoms ?? []) {
    const n = s.symptom_type ?? 'unknown'
    symptomCounts[n] = (symptomCounts[n] ?? 0) + 1
  }
  const topSymptomsSorted = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxSymptomCount = topSymptomsSorted[0]?.[1] ?? 1

  const avgMealsPerUser = total > 0 ? Math.round((totalMeals ?? 0) / total * 10) / 10 : 0
  const avgSymptomsPerUser = total > 0 ? Math.round((totalSymptoms ?? 0) / total * 10) / 10 : 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)' }}>Admin</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '4px 0 4px', color: 'var(--ink-900)' }}>Usage</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>Feature adoption and platform activity signals.</p>
      </div>

      {/* Engagement snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Meals logged"    value={(totalMeals ?? 0).toLocaleString()}   sub={`${mealLogs7d ?? 0} this week`}     color="var(--forest-500)" />
        <StatCard label="Symptoms logged" value={(totalSymptoms ?? 0).toLocaleString()} sub={`${symptomLogs7d ?? 0} this week`}   color="var(--terracotta-500)" />
        <StatCard label="Coach threads"   value={(totalCoachThreads ?? 0).toLocaleString()} sub={`${coachThreads30d ?? 0} last 30d`} />
        <StatCard label="Meal plan slots" value={(totalMealPlanSlots ?? 0).toLocaleString()} sub="AI-planned meals" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Feature adoption */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>Feature adoption</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 18 }}>% of total users who have used each feature</div>
          <AdoptionBar label="Completed onboarding" count={onboarded ?? 0}        total={total} color="var(--forest-400)" />
          <AdoptionBar label="Meal logging"          count={usersLoggedMeal ?? 0}  total={total} color="var(--forest-500)" />
          <AdoptionBar label="Symptom logging"       count={usersLoggedSymptom ?? 0} total={total} color="var(--terracotta-400)" />
          <AdoptionBar label="AI Coach"              count={usersUsedCoach ?? 0}   total={total} color="#6366f1" />
          <AdoptionBar label="Meal Planner"          count={usersUsedPlanner ?? 0} total={total} color="#0891b2" />
        </div>

        {/* Activity over time */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Activity (all time vs 30d)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Meal logs',      total: totalMeals ?? 0,    recent: mealLogs30d ?? 0,    color: 'var(--forest-500)' },
              { label: 'Symptom logs',   total: totalSymptoms ?? 0, recent: symptomLogs30d ?? 0, color: 'var(--terracotta-400)' },
              { label: 'BM logs',         total: totalBms ?? 0,         recent: null, color: '#a78bfa' },
              { label: 'Water logs',      total: totalWater ?? 0,       recent: null, color: '#0891b2' },
              { label: 'Weight logs',     total: totalWeight ?? 0,      recent: null, color: '#059669' },
              { label: 'Notes',           total: totalNotes ?? 0,       recent: null, color: '#f59e0b' },
              { label: 'Supplements',     total: totalSupplements ?? 0, recent: null, color: '#ec4899' },
              { label: 'Coach threads',   total: totalCoachThreads ?? 0, recent: coachThreads30d ?? 0, color: '#6366f1' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-700)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', width: 60, textAlign: 'right' }}>
                  {row.total.toLocaleString()}
                </span>
                {row.recent !== null && (
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', width: 60, textAlign: 'right' }}>
                    {row.recent} (30d)
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--cream-100)', marginTop: 14, paddingTop: 12, display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Avg meals/user</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink-900)' }}>{avgMealsPerUser}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Avg symptoms/user</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink-900)' }}>{avgSymptomsPerUser}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top symptoms */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Top reported symptoms</div>
          {topSymptomsSorted.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>No symptom data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topSymptomsSorted.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-700)', textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--cream-100)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: 'var(--terracotta-400)',
                      width: `${Math.round((count / maxSymptomCount) * 100)}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meal types breakdown */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Meal types logged</div>
          {topMealTypesSorted.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>No meal data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topMealTypesSorted.map(([type, count]) => {
                const maxMealType = topMealTypesSorted[0]?.[1] ?? 1
                const COLORS: Record<string, string> = {
                  breakfast: '#f59e0b', lunch: 'var(--forest-400)',
                  dinner: 'var(--forest-500)', snack: '#6366f1',
                  beverage: '#0891b2', other: '#9ca3af',
                }
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-700)', textTransform: 'capitalize' }}>{type}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>{count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--cream-100)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: COLORS[type] ?? 'var(--forest-400)',
                        width: `${Math.round((count / maxMealType) * 100)}%`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent signups */}
          <div style={{ borderTop: '1px solid var(--cream-100)', marginTop: 20, paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most recent signups</div>
            {(recentActivity ?? []).map((u, i) => {
              const initials = (u.name ?? '?')
                .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
              const joined = u.created_at
                ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #e8856a, #f4b86e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name || 'Unknown'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{joined}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
