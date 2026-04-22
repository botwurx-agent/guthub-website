// Badge.jsx — small pill labels

function Badge({ tone = 'accent', dot = false, children }) {
  const tones = {
    accent: { bg: 'var(--terracotta-50)', fg: 'var(--terracotta-700)' },
    dark: { bg: 'var(--forest-500)', fg: 'var(--cream-100)' },
    soft: { bg: 'var(--cream-200)', fg: 'var(--ink-900)' },
    outline: { bg: 'transparent', fg: 'var(--ink-700)', border: '1px solid var(--ink-300)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
      lineHeight: 1, background: t.bg, color: t.fg, border: t.border || 'none',
    }}>
      {dot && <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--forest-300)',
        animation: 'pulse 1.6s infinite',
      }} />}
      {children}
    </span>
  );
}

function Eyebrow({ children, color }) {
  return <div style={{
    fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.18em',
    textTransform: 'uppercase', fontWeight: 700,
    color: color || 'var(--terracotta-700)',
  }}>{children}</div>;
}

window.Badge = Badge;
window.Eyebrow = Eyebrow;
