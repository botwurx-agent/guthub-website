// Header.jsx — sticky header with blurred cream background on scroll

function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Product', href: 'features.html' },
    { label: 'Pricing', href: 'pricing.html' },
    { label: 'FAQ', href: 'index.html#faq' },
    { label: 'About', href: 'about.html' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(253, 250, 243, 0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 240ms var(--ease-out)',
    }}>
      <div style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <a href="index.html" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="../../assets/logo-full.png" alt="GutHub" style={{ height: 32 }} />
        </a>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 16 }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              fontSize: 15, color: 'var(--ink-800)', textDecoration: 'none',
              fontWeight: 500, fontFamily: 'var(--font-body)',
              transition: 'color 120ms',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--terracotta-500)'}
            onMouseLeave={e => e.target.style.color = 'var(--ink-800)'}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'signin' } })); }} style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ink-800)',
            textDecoration: 'none', fontFamily: 'var(--font-body)',
          }}>Sign in</a>
          <Button variant="primary" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'signup' } }))}>
            Start free — 2 days
          </Button>
        </div>
      </div>
    </header>
  );
}

window.Header = Header;
