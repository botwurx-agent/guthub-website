import { createServiceClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'

function StatCard({ label, value, sub, color = 'var(--ink-900)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const supabase = await createServiceClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { data: subCounts },
    { count: newLast30 },
    { count: newLast7 },
    { count: onboarded },
    { count: totalMeals },
    { count: totalSymptoms },
    { count: totalCoachThreads },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('subscription_status, subscription_plan'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('onboarding_completed', true),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }),
    supabase.from('symptom_logs').select('*', { count: 'exact', head: true }),
    supabase.from('coach_threads').select('*', { count: 'exact', head: true }),
  ])

  // Subscription breakdown
  const subs = subCounts ?? []
  const activeCount   = subs.filter(s => s.subscription_status === 'active').length
  const trialingCount = subs.filter(s => s.subscription_status === 'trialing').length
  const canceledCount = subs.filter(s => s.subscription_status === 'canceled').length
  const pastDueCount  = subs.filter(s => s.subscription_status === 'past_due').length

  const foundingCount = subs.filter(s => s.subscription_plan === 'founding').length
  const launchCount   = subs.filter(s => s.subscription_plan === 'launch').length
  const standardCount = subs.filter(s => s.subscription_plan === 'standard').length

  // MRR from local data (active subs × plan price)
  const mrr = Math.round(
    (foundingCount * PLANS.founding.amount +
     launchCount   * PLANS.launch.amount +
     standardCount * PLANS.standard.amount) / 100
  )

  // Recent signups from Stripe
  let recentPayments: { amount: number; email: string; date: string }[] = []
  try {
    const charges = await stripe.charges.list({ limit: 5 })
    recentPayments = charges.data
      .filter(c => c.paid && !c.refunded)
      .map(c => ({
        amount: c.amount / 100,
        email: c.billing_details.email ?? '—',
        date: new Date(c.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
  } catch { /* Stripe unavailable */ }

  const onboardingRate = totalUsers ? Math.round(((onboarded ?? 0) / totalUsers) * 100) : 0

  const STATUS_COLOR: Record<string, string> = {
    active: '#16a34a', trialing: '#d97706', canceled: '#dc2626',
    past_due: '#dc2626', incomplete: '#9ca3af',
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)' }}>Admin</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '4px 0 4px', color: 'var(--ink-900)' }}>Overview</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>Live snapshot across all users and revenue.</p>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Users"      value={totalUsers ?? 0} sub={`+${newLast7 ?? 0} this week`} />
        <StatCard label="Active Subs"      value={activeCount} sub={`${trialingCount} trialing`} color="var(--forest-500)" />
        <StatCard label="MRR"              value={`$${mrr.toLocaleString()}`} sub="Active subs only" color="var(--terracotta-500)" />
        <StatCard label="Onboarding Rate"  value={`${onboardingRate}%`} sub={`${onboarded ?? 0} of ${totalUsers ?? 0} completed`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Subscription status breakdown */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Subscription status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Active',    activeCount,   'active'],
              ['Trialing',  trialingCount, 'trialing'],
              ['Canceled',  canceledCount, 'canceled'],
              ['Past due',  pastDueCount,  'past_due'],
            ].map(([label, count, status]) => (
              <div key={status as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status as string], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-700)' }}>{label as string}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{count as number}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-400)', width: 40, textAlign: 'right' }}>
                  {totalUsers ? Math.round(((count as number) / totalUsers) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan breakdown */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Plan breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Founding Member', foundingCount, '$13/mo', 'var(--terracotta-400)'],
              ['Launch',          launchCount,   '$20/mo', 'var(--forest-400)'],
              ['Standard',        standardCount, '$25/mo', '#6366f1'],
            ].map(([label, count, price, color]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-700)' }}>{label as string}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{price as string}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', width: 32, textAlign: 'right' }}>{count as number}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--cream-100)', marginTop: 14, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--ink-400)' }}>Monthly recurring revenue</span>
            <span style={{ fontWeight: 700, color: 'var(--forest-500)' }}>${mrr.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Activity stats */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Platform activity (all time)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Meals logged',      totalMeals ?? 0],
              ['Symptoms logged',   totalSymptoms ?? 0],
              ['Coach threads',     totalCoachThreads ?? 0],
              ['New users (30d)',   newLast30 ?? 0],
            ].map(([label, val]) => (
              <div key={label as string} style={{ background: 'var(--cream-50)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label as string}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-900)', marginTop: 4 }}>{(val as number).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Recent payments</div>
          {recentPayments.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>No payment data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentPayments.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < recentPayments.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#16a34a' }}>$</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>${p.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
