// Button.jsx — primary/secondary/dark/ghost variants. Pill-shaped.

function Button({ variant = 'primary', size = 'md', as = 'button', href, children, icon, style: userStyle, ...rest }) {
  const Tag = as === 'a' ? 'a' : 'button';
  const sz = size === 'lg' ? { padding: '18px 28px', fontSize: 17 } :
             size === 'sm' ? { padding: '10px 16px', fontSize: 14 } :
                             { padding: '14px 22px', fontSize: 15 };
  const base = {
    fontFamily: 'var(--font-body)', fontWeight: 600, borderRadius: 999,
    border: '1px solid transparent', cursor: 'pointer', lineHeight: 1,
    transition: 'all 240ms var(--ease-out)', display: 'inline-flex',
    alignItems: 'center', gap: 8, textDecoration: 'none', ...sz,
  };
  const variants = {
    primary: { background: 'var(--terracotta-400)', color: '#fff' },
    secondary: { background: 'transparent', borderColor: 'var(--ink-300)', color: 'var(--ink-900)' },
    dark: { background: 'var(--forest-500)', color: 'var(--cream-100)' },
    ghost: { background: 'transparent', color: 'var(--ink-900)' },
    inverse: { background: 'var(--cream-50)', color: 'var(--forest-600)' },
  };
  const [hover, setHover] = React.useState(false);
  const hov = hover ? {
    primary: { background: 'var(--terracotta-500)', boxShadow: 'var(--shadow-md)' },
    secondary: { background: 'var(--cream-100)', borderColor: 'var(--ink-900)' },
    dark: { background: 'var(--forest-600)', boxShadow: 'var(--shadow-md)' },
    ghost: { background: 'var(--cream-100)' },
    inverse: { background: '#fff', boxShadow: 'var(--shadow-md)' },
  }[variant] : {};
  return (
    <Tag href={href} style={{ ...base, ...variants[variant], ...hov, ...userStyle }}
         onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...rest}>
      {children}
      {icon}
    </Tag>
  );
}

window.Button = Button;
