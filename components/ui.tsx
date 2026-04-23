'use client';

import { useState, useRef, useEffect, ReactNode, CSSProperties, ElementType } from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'inverse';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  as?: 'button' | 'a';
  href?: string;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  type?: 'button' | 'submit';
  target?: string;
  rel?: string;
}

export function Button({ variant = 'primary', size = 'md', as = 'button', href, children, onClick, style: userStyle, type, target, rel }: ButtonProps) {
  const [hover, setHover] = useState(false);

  const sz: CSSProperties = size === 'lg' ? { padding: '18px 28px', fontSize: 17 }
    : size === 'sm' ? { padding: '10px 16px', fontSize: 14 }
    : { padding: '14px 22px', fontSize: 15 };

  const base: CSSProperties = {
    fontFamily: 'var(--font-body)', fontWeight: 600, borderRadius: 999,
    border: '1px solid transparent', cursor: 'pointer', lineHeight: 1,
    transition: 'all 240ms var(--ease-out)', display: 'inline-flex',
    alignItems: 'center', gap: 8, textDecoration: 'none', ...sz,
  };

  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--terracotta-400)', color: '#fff' },
    secondary: { background: 'transparent', borderColor: 'var(--ink-300)', color: 'var(--ink-900)' },
    dark: { background: 'var(--forest-500)', color: 'var(--cream-100)' },
    ghost: { background: 'transparent', color: 'var(--ink-900)' },
    inverse: { background: 'var(--cream-50)', color: 'var(--forest-600)' },
  };

  const hovStyles: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--terracotta-500)', boxShadow: 'var(--shadow-md)' },
    secondary: { background: 'var(--cream-100)', borderColor: 'var(--ink-900)' },
    dark: { background: 'var(--forest-600)', boxShadow: 'var(--shadow-md)' },
    ghost: { background: 'var(--cream-100)' },
    inverse: { background: '#fff', boxShadow: 'var(--shadow-md)' },
  };

  const combined = { ...base, ...variants[variant], ...(hover ? hovStyles[variant] : {}), ...userStyle };

  if (as === 'a') {
    return (
      <a href={href} target={target} rel={rel} style={combined}
         onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        {children}
      </a>
    );
  }
  return (
    <button type={type || 'button'} style={combined} onClick={onClick}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
}

// ─── Badge & Eyebrow ──────────────────────────────────────────────────────────

type BadgeTone = 'accent' | 'dark' | 'soft' | 'outline';

interface BadgeProps { tone?: BadgeTone; dot?: boolean; children: ReactNode; }

export function Badge({ tone = 'accent', dot = false, children }: BadgeProps) {
  const tones: Record<BadgeTone, CSSProperties> = {
    accent: { background: 'var(--terracotta-50)', color: 'var(--terracotta-700)' },
    dark: { background: 'var(--forest-500)', color: 'var(--cream-100)' },
    soft: { background: 'var(--cream-200)', color: 'var(--ink-900)' },
    outline: { background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--ink-300)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', lineHeight: 1,
      ...tones[tone],
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--forest-300)', animation: 'pulse 1.6s infinite' }} />}
      {children}
    </span>
  );
}

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.18em',
      textTransform: 'uppercase', fontWeight: 700,
      color: color || 'var(--terracotta-700)',
    }}>
      {children}
    </div>
  );
}

// ─── Reveal (scroll animation) ────────────────────────────────────────────────

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  style?: CSSProperties;
  as?: ElementType;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 16, duration = 700, threshold = 0.15, once = true, style, as: Tag = 'div', className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      let cancelled = false;
      Promise.resolve().then(() => { if (!cancelled) setShown(true); });
      const t = setTimeout(() => { if (!cancelled) setShown(true); }, 50);
      return () => { cancelled = true; clearTimeout(t); };
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setShown(true); if (once) io.unobserve(el); }
        else if (!once) setShown(false);
      });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const motionStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
    transition: `opacity ${duration}ms var(--ease-out) ${delay}ms, transform ${duration}ms var(--ease-out) ${delay}ms`,
  };

  return (
    <Tag ref={ref as any} className={className} style={{ ...motionStyle, ...style }}>
      {children}
    </Tag>
  );
}
