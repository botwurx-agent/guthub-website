export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--forest-500)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GutHub" style={{ height: 32, marginBottom: 16 }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--terracotta-500)' }}>
            Admin Access
          </div>
        </div>

        <form action="/api/admin/auth" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="Enter admin password"
              style={{
                width: '100%', height: 42, padding: '0 14px',
                border: `1px solid ${error ? '#dc2626' : 'var(--cream-200)'}`,
                borderRadius: 10, fontSize: 14, color: 'var(--ink-800)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>Incorrect password.</div>
            )}
          </div>

          <button type="submit" style={{
            height: 44, borderRadius: 10, border: 'none',
            background: 'var(--forest-500)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            marginTop: 4,
          }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
