'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(253,250,243,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 240ms var(--ease-out)',
    }}>
      <div style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} priority />
        </Link>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 16 }}>
          {navItems.map(item => (
            <NavLink key={item.label} href={item.href} label={item.label} />
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => openAuth('signin')} style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ink-800)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', padding: 0,
          }}>
            Sign in
          </button>
          <Button variant="primary" size="sm" onClick={() => openAuth('signup')}>
            Start free — 2 days
          </Button>
        </div>
      </div>
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
