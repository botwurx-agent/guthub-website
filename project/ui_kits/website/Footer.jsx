// Footer.jsx

function Footer() {
  const cols = [
    { h: 'Product', links: ['How it works', 'Pricing', 'FAQ', 'Access App'] },
    { h: 'Company', links: ['About', 'Press', 'Careers', 'Contact'] },
    { h: 'Legal', links: ['Terms', 'Privacy', 'Cookie Policy', 'Data & security'] },
  ];
  return (
    <footer style={{
      background: 'var(--forest-500)', color: 'var(--cream-100)',
      padding: '72px 32px 32px',
    }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40,
          paddingBottom: 48, borderBottom: '1px solid rgba(250,245,238,.16)',
        }}>
          <div>
            <img src="../../assets/logo-full.png" alt="GutHub"
                 style={{ height: 38, filter: 'brightness(0) invert(1)', marginBottom: 20 }} />
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(250,245,238,.72)', maxWidth: 300 }}>
              Personalized AI gut-health guidance for your family's wellbeing.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <div style={{
                fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 700, color: 'var(--terracotta-300)', marginBottom: 16,
              }}>{c.h}</div>
              {c.links.map(l => (
                <a key={l} href="#" style={{
                  display: 'block', padding: '6px 0', fontSize: 15,
                  color: 'rgba(250,245,238,.88)', textDecoration: 'none',
                }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 28, display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, alignItems: 'center',
          fontSize: 13, color: 'rgba(250,245,238,.55)',
        }}>
          <div>© 2026 Guthub. Designed to complement professional care.</div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['twitter','instagram','linkedin','facebook'].map(s => (
              <a key={s} href="#" style={{ color: 'rgba(250,245,238,.72)' }}>
                <i data-lucide={s} style={{ width: 18, height: 18 }}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
