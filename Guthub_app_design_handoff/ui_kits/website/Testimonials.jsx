// Testimonials.jsx

function Testimonials() {
  const items = [
    {
      name: 'Sarah M.', role: 'Marketing Manager, 52',
      initials: 'SM',
      q: "I stopped googling at 11pm. Now I just ask Guthub, and I actually get a straight answer that makes sense for my body.",
    },
    {
      name: 'James T.', role: 'Retired Firefighter, 67',
      initials: 'JT',
      q: "I was skeptical of another app. But this one asks good questions back — it feels like it's thinking alongside me.",
    },
    {
      name: 'Emily R.', role: 'Teacher, 44',
      initials: 'ER',
      q: "The pattern it spotted between my coffee and my sleep saved me months of trial and error. That alone paid for the year.",
    },
  ];
  return (
    <section style={{ padding: '112px 32px', background: '#FFFFFF' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>What members say</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, color: 'var(--ink-900)',
          }}>
            Real people, <em style={{ fontStyle: 'italic' }}>real relief.</em>
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {items.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} y={18}>
              <TestimonialCard t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: 32,
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-xs)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 320ms var(--ease-out)',
        display: 'flex', flexDirection: 'column',
        height: '100%',
      }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
        {[0,1,2,3,4].map(i => (
          <i key={i} data-lucide="star" style={{ width: 16, height: 16, color: 'var(--terracotta-400)', fill: 'var(--terracotta-400)' }}></i>
        ))}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.4,
        color: 'var(--ink-900)', fontWeight: 400, flex: 1, marginBottom: 24,
      }}>"{t.q}"</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--terracotta-100)', color: 'var(--terracotta-700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)',
        }}>{t.initials}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{t.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

window.Testimonials = Testimonials;
