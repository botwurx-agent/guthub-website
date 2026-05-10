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

export default async function AdminRevenuePage() {
  const supabase = await createServiceClient()

  const { data: subCounts } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan')

  const subs = subCounts ?? []

  // Active by plan
  const activeFounding = subs.filter(s => s.subscription_status === 'active' && s.subscription_plan === 'founding').length
  const activeLaunch   = subs.filter(s => s.subscription_status === 'active' && s.subscription_plan === 'launch').length
  const activeStandard = subs.filter(s => s.subscription_status === 'active' && s.subscription_plan === 'standard').length

  // Trialing by plan
  const trialFounding = subs.filter(s => s.subscription_status === 'trialing' && s.subscription_plan === 'founding').length
  const trialLaunch   = subs.filter(s => s.subscription_status === 'trialing' && s.subscription_plan === 'launch').length
  const trialStandard = subs.filter(s => s.subscription_status === 'trialing' && s.subscription_plan === 'standard').length

  const totalActive   = activeFounding + activeLaunch + activeStandard
  const totalTrialing = trialFounding + trialLaunch + trialStandard

  const mrr = Math.round(
    (activeFounding * PLANS.founding.amount +
     activeLaunch   * PLANS.launch.amount +
     activeStandard * PLANS.standard.amount) / 100
  )

  const arr = mrr * 12

  // potential MRR if all trials convert
  const potentialMrr = mrr + Math.round(
    (trialFounding * PLANS.founding.amount +
     trialLaunch   * PLANS.launch.amount +
     trialStandard * PLANS.standard.amount) / 100
  )

  // Stripe recent charges
  let recentCharges: { amount: number; email: string; date: string; status: string; id: string }[] = []
  let totalStripeVolume = 0
  let totalChargeCount = 0
  try {
    const charges = await stripe.charges.list({ limit: 20 })
    recentCharges = charges.data
      .filter(c => c.paid && !c.refunded)
      .slice(0, 15)
      .map(c => ({
        id: c.id,
        amount: c.amount / 100,
        email: c.billing_details.email ?? '—',
        date: new Date(c.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: c.status,
      }))
    totalStripeVolume = charges.data.filter(c => c.paid && !c.refunded).reduce((s, c) => s + c.amount, 0) / 100
    totalChargeCount = charges.data.filter(c => c.paid && !c.refunded).length
  } catch { /* Stripe unavailable */ }

  // Plan breakdown rows
  const planRows = [
    { label: 'Founding Member', price: '$13/mo', color: 'var(--terracotta-400)', active: activeFounding, trialing: trialFounding, mrr: Math.round(activeFounding * PLANS.founding.amount / 100) },
    { label: 'Launch',          price: '$20/mo', color: 'var(--forest-400)',     active: activeLaunch,   trialing: trialLaunch,   mrr: Math.round(activeLaunch   * PLANS.launch.amount   / 100) },
    { label: 'Standard',        price: '$25/mo', color: '#6366f1',               active: activeStandard, trialing: trialStandard, mrr: Math.round(activeStandard * PLANS.standard.amount / 100) },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)' }}>Admin</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '4px 0 4px', color: 'var(--ink-900)' }}>Revenue</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>Subscription and payment metrics.</p>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="MRR"           value={`$${mrr.toLocaleString()}`}  sub="Active subs only"            color="var(--forest-500)" />
        <StatCard label="ARR"           value={`$${arr.toLocaleString()}`}  sub="Annualized"                  color="var(--terracotta-500)" />
        <StatCard label="Active Subs"   value={totalActive}                  sub={`+${totalTrialing} trialing`} />
        <StatCard label="Potential MRR" value={`$${potentialMrr.toLocaleString()}`} sub="If all trials convert" />
      </div>

      {/* Plan breakdown table */}
      <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Plan breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cream-200)' }}>
              {['Plan', 'Price', 'Active', 'Trialing', 'MRR contribution'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontSize: 11,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--ink-400)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planRows.map(row => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--cream-100)' }}>
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{row.label}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--ink-500)' }}>{row.price}</td>
                <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{row.active}</td>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#d97706' }}>{row.trialing}</td>
                <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--forest-500)' }}>
                  ${row.mrr.toLocaleString()}/mo
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr style={{ background: 'var(--cream-50)' }}>
              <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }} colSpan={2}>Total</td>
              <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{totalActive}</td>
              <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: '#d97706' }}>{totalTrialing}</td>
              <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 700, color: 'var(--forest-500)' }}>
                ${mrr.toLocaleString()}/mo
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MRR visual bars */}
      <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>MRR by plan</div>
        {planRows.map(row => (
          <div key={row.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-600)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>${row.mrr}/mo · {row.active} subs</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--cream-100)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: row.color,
                width: mrr > 0 ? `${Math.round((row.mrr / mrr) * 100)}%` : '0%',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Stripe payments */}
      <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>Recent payments</div>
          {totalChargeCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
              {totalChargeCount} payments · ${totalStripeVolume.toFixed(2)} total (last 20)
            </div>
          )}
        </div>
        {recentCharges.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>No payment data available.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cream-200)' }}>
                {['Customer', 'Date', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--ink-400)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCharges.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < recentCharges.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--ink-700)' }}>{c.email}</td>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--ink-500)' }}>{c.date}</td>
                  <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>${c.amount.toFixed(2)}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                      padding: '3px 8px', borderRadius: 20,
                      background: c.status === 'succeeded' ? '#f0fdf4' : '#fef2f2',
                      color: c.status === 'succeeded' ? '#16a34a' : '#dc2626',
                    }}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
