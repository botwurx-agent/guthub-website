import { createServiceClient } from '@/lib/supabase/server'

const STATUS_COLOR: Record<string, string> = {
  active:     '#16a34a',
  trialing:   '#d97706',
  canceled:   '#dc2626',
  past_due:   '#dc2626',
  incomplete: '#9ca3af',
  none:       '#9ca3af',
}

const STATUS_BG: Record<string, string> = {
  active:     '#f0fdf4',
  trialing:   '#fffbeb',
  canceled:   '#fef2f2',
  past_due:   '#fef2f2',
  incomplete: '#f9fafb',
  none:       '#f9fafb',
}

const PLAN_LABEL: Record<string, string> = {
  founding: 'Founding',
  launch:   'Launch',
  standard: 'Standard',
}

function StatusBadge({ status }: { status: string }) {
  const s = status || 'none'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.04em',
      padding: '3px 8px', borderRadius: 20,
      background: STATUS_BG[s] ?? '#f9fafb',
      color: STATUS_COLOR[s] ?? '#9ca3af',
    }}>
      {s.replace('_', ' ')}
    </span>
  )
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>
}) {
  const sp = await searchParams
  const query  = sp.q?.trim() ?? ''
  const planFilter   = sp.plan ?? ''
  const statusFilter = sp.status ?? ''
  const page   = Math.max(1, parseInt(sp.page ?? '1', 10))
  const pageSize = 50

  const supabase = await createServiceClient()

  let req = supabase
    .from('profiles')
    .select(`
      id, name, created_at, onboarding_completed,
      subscription_status, subscription_plan, trial_ends_at,
      stripe_customer_id
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (query)        req = req.ilike('name', `%${query}%`)
  if (planFilter)   req = req.eq('subscription_plan', planFilter)
  if (statusFilter) req = req.eq('subscription_status', statusFilter)

  const { data: profiles, count } = await req

  // Fetch emails from auth.users via admin API
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authList?.users ?? []) emailMap[u.id] = u.email ?? ''

  const users = (profiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? '' }))

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  function buildHref(overrides: Record<string, string | number>) {
    const params = new URLSearchParams()
    if (query)        params.set('q',      query)
    if (planFilter)   params.set('plan',   planFilter)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)))
    return `/admin/users?${params.toString()}`
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)' }}>Admin</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '4px 0 4px', color: 'var(--ink-900)' }}>Users</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>{count ?? 0} total accounts</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <form method="get" action="/admin/users" style={{ display: 'flex', gap: 10, flex: 1, minWidth: 240 }}>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search name or email…"
            style={{
              flex: 1, height: 38, padding: '0 14px', border: '1px solid var(--cream-200)',
              borderRadius: 10, fontSize: 13, background: '#fff', color: 'var(--ink-800)',
              outline: 'none',
            }}
          />
          <input type="hidden" name="plan"   value={planFilter} />
          <input type="hidden" name="status" value={statusFilter} />
          <button type="submit" style={{
            height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
            background: 'var(--forest-500)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Search</button>
        </form>

        {/* Plan filter pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[['', 'All plans'], ['founding', 'Founding'], ['launch', 'Launch'], ['standard', 'Standard']].map(([val, lbl]) => (
            <a key={val} href={buildHref({ plan: val, page: 1 })} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
              background: planFilter === val ? 'var(--forest-500)' : '#fff',
              color: planFilter === val ? '#fff' : 'var(--ink-600)',
              border: `1px solid ${planFilter === val ? 'var(--forest-500)' : 'var(--cream-200)'}`,
            }}>{lbl}</a>
          ))}
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[['', 'All'], ['active', 'Active'], ['trialing', 'Trialing'], ['canceled', 'Canceled']].map(([val, lbl]) => (
            <a key={val} href={buildHref({ status: val, page: 1 })} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
              background: statusFilter === val ? 'var(--terracotta-400)' : '#fff',
              color: statusFilter === val ? '#fff' : 'var(--ink-600)',
              border: `1px solid ${statusFilter === val ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
            }}>{lbl}</a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cream-200)', background: 'var(--cream-50)' }}>
              {['User', 'Joined', 'Plan', 'Status', 'Trial ends', 'Onboarded'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--ink-400)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 14, color: 'var(--ink-400)' }}>
                  No users found.
                </td>
              </tr>
            ) : (users ?? []).map((u, i) => {
              const initials = (u.name ?? u.email ?? '?')
                .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
              const joined = u.created_at
                ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'
              const trialEnds = u.trial_ends_at
                ? new Date(u.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'
              return (
                <tr key={u.id} style={{
                  borderBottom: i < (users?.length ?? 0) - 1 ? '1px solid var(--cream-100)' : 'none',
                  transition: 'background 120ms',
                }}>
                  {/* User */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #e8856a, #f4b86e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>{initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>
                          {u.name || '(no name)'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{u.email || u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  {/* Joined */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{joined}</td>
                  {/* Plan */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-700)' }}>
                    {u.subscription_plan ? PLAN_LABEL[u.subscription_plan] ?? u.subscription_plan : '—'}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={u.subscription_status} />
                  </td>
                  {/* Trial */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-500)' }}>{trialEnds}</td>
                  {/* Onboarded */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: u.onboarding_completed ? '#16a34a' : '#9ca3af',
                    }}>
                      {u.onboarding_completed ? '✓ Yes' : '— No'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {page > 1 && (
            <a href={buildHref({ page: page - 1 })} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', background: '#fff', color: 'var(--ink-700)',
              border: '1px solid var(--cream-200)',
            }}>← Prev</a>
          )}
          <span style={{ padding: '7px 14px', fontSize: 13, color: 'var(--ink-500)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={buildHref({ page: page + 1 })} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', background: '#fff', color: 'var(--ink-700)',
              border: '1px solid var(--cream-200)',
            }}>Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
