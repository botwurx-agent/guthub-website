'use client';

import Image from 'next/image';
import Link from 'next/link';
import { openAuth } from './AuthModal';

type Item = { label: string; href?: string; onClick?: () => void };

const productCol: Item[] = [
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Sign in', onClick: () => openAuth('signin') },
];

const companyCol: Item[] = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const legalCol: Item[] = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
];

export default function Footer() {
  return (
    <footer className="footer-root" style={{ background: 'var(--forest-500)', color: 'var(--cream-100)', padding: '72px 32px 32px' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div className="footer-grid" style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40,
          paddingBottom: 48, borderBottom: '1px solid rgba(250,245,238,.16)',
        }}>
          <div className="footer-brand">
            <Image src="/logo-full.png" alt="GutHub" width={140} height={38}
              style={{ height: 38, width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: 20 }} />
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(250,245,238,.72)', maxWidth: 300 }}>
              Personalized AI gut-health guidance for your family's wellbeing.
            </p>
          </div>
          <FooterCol heading="Product" items={productCol} />
          <FooterCol heading="Company" items={companyCol} />
          <FooterCol heading="Legal" items={legalCol} />
        </div>
        <div style={{
          paddingTop: 28, fontSize: 13, color: 'rgba(250,245,238,.55)',
        }}>
          © 2026 Guthub. Designed to complement professional care.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, items }: { heading: string; items: Item[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--terracotta-300)', marginBottom: 16 }}>
        {heading}
      </div>
      {items.map(it => (
        <FooterLink key={it.label} item={it} />
      ))}
    </div>
  );
}

function FooterLink({ item }: { item: Item }) {
  const sharedStyle = {
    display: 'block', padding: '6px 0', fontSize: 15,
    color: 'rgba(250,245,238,.88)', textDecoration: 'none',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-body)', textAlign: 'left' as const,
  };
  if (item.onClick) {
    return (
      <button onClick={item.onClick} style={sharedStyle}>
        {item.label}
      </button>
    );
  }
  if (item.href!.startsWith('/#')) {
    return <a href={item.href} style={sharedStyle}>{item.label}</a>;
  }
  return <Link href={item.href!} style={sharedStyle}>{item.label}</Link>;
}
