// ComingSoon.jsx — 6-card grid of upcoming features (SnapNutrition removed)

function ComingSoon() {
  const items = [
    {
      icon: 'sparkles',
      title: 'GutTalk AI Companion',
      body: 'An always-on voice layer. Ask your gut-health guide anything, hands-free, while you cook or shop.',
    },
    {
      icon: 'bell',
      title: 'MicroBiome Pulse Alerts',
      body: 'Gentle nudges when your logs suggest a flare is building — before it hits.',
    },
    {
      icon: 'activity',
      title: 'BioSync Wearable Integration',
      body: 'Pull sleep, HRV, and steps from your wearable so Guthub can connect the dots with what you eat.',
    },
    {
      icon: 'chef-hat',
      title: 'NutriChef AI',
      body: 'A personal AI chef that builds recipes around what\'s in your pantry and friendly to your gut.',
    },
    {
      icon: 'users',
      title: 'GutHealth Community',
      body: 'A quiet, moderated space to share wins, swap meals, and learn from people on the same journey.',
    },
    {
      icon: 'line-chart',
      title: 'MicroBiome Forecast™',
      body: 'Predictive trends for your gut — where you\'re headed, and what nudges the curve.',
    },
  ];

  return (
    <section style={{
      padding: '112px 32px',
      background: 'var(--cream-100)',
    }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>On the horizon</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 2.75rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 18, marginBottom: 16, color: 'var(--ink-900)',
            textWrap: 'balance',
          }}>
            What's <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>coming next.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            Six features we're building next. Your feedback shapes the order.
          </p>
        </Reveal>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
        }}>
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 70} y={16}>
              <div style={{
                background: '#fff', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', padding: 24,
                position: 'relative', height: '100%',
                transition: 'transform 240ms var(--ease-out), box-shadow 240ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--forest-500)', padding: '3px 8px', borderRadius: 999,
                  background: 'var(--cream-50)', border: '1px solid var(--border)',
                }}>Soon</div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--terracotta-50, #FAE6D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <i data-lucide={it.icon} style={{ width: 20, height: 20, color: 'var(--terracotta-500)' }}></i>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)', marginBottom: 8, lineHeight: 1.3, paddingRight: 40 }}>
                  {it.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.55 }}>
                  {it.body}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

window.ComingSoon = ComingSoon;
