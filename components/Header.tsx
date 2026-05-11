'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from './ui';
import { openAuth } from './AuthModal';

const navItems = [
  { label: 'Product', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(253,250,243,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 240ms var(--ease-out)',
    }}>
      <div className="header-inner" style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} priority />
        </Link>
        <nav className="nav-links" style={{ display: 'flex', gap: 28, marginLeft: 16 }}>
          {navItems.map(item => (
            <NavLink key={item.label} href={item.href} label={item.label} />
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="signin-btn" onClick={() => openAuth('signin')} style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ink-800)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', padding: 0,
          }}>
            Sign in
          </button>
          <Button variant="primary" size="sm" as="a" href="/pricing">
            <span className="header-cta-full">Start free — 7 days</span>
            <span className="header-cta-short" style={{ display: 'none' }}>Start free</span>
          </Button>
          <button
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            style={{
              display: 'none',
              background: 'none', border: 'none', padding: 6, marginLeft: 4,
              cursor: 'pointer', color: 'var(--ink-800)',
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'var(--cream-50)',
            display: 'flex', flexDirection: 'column',
            animation: 'authFadeIn 200ms var(--ease-out)',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
          }}>
            <Link href="/" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} />
            </Link>
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none', padding: 6,
                cursor: 'pointer', color: 'var(--ink-800)',
              }}
            >
              <X size={24} />
            </button>
          </div>
          <nav style={{
            display: 'flex', flexDirection: 'column',
            padding: '16px 20px', gap: 4,
          }}>
            {navItems.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 22, fontWeight: 500, color: 'var(--ink-900)',
                  textDecoration: 'none', padding: '14px 4px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{
            marginTop: 'auto', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <Button variant="primary" size="lg" as="a" href="/pricing" onClick={() => setMenuOpen(false)}>
              Start your 7-day free trial
            </Button>
            <button
              onClick={() => { setMenuOpen(false); openAuth('signin'); }}
              style={{
                fontSize: 16, fontWeight: 500, color: 'var(--ink-700)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', padding: '8px',
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .header-cta-full { display: none !important; }
          .header-cta-short { display: inline !important; }
          .menu-toggle { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} style={{
      fontSize: 15, color: hover ? 'var(--terracotta-500)' : 'var(--ink-800)',
      textDecoration: 'none', fontWeight: 500,
      transition: 'color 120ms',
    }}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}>
      {label}
    </Link>
  );
}
