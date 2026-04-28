'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_NAME = 'guthub_cookie_consent';

function readConsent(): boolean {
  if (typeof document === 'undefined') return true;
  return document.cookie.split('; ').some(c => c.startsWith(COOKIE_NAME + '='));
}

function writeConsent() {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${oneYear}; samesite=lax`;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div role="region" aria-label="Cookie notice" style={{
      position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 70,
      maxWidth: 720, margin: '0 auto',
      background: 'var(--ink-900)', color: 'var(--cream-100)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ flex: 1, minWidth: 200, fontSize: 14, lineHeight: 1.5 }}>
        We use cookies to improve your experience.{' '}
        <Link href="/cookies" style={{ color: 'var(--terracotta-300)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          See our Cookie Policy.
        </Link>
      </span>
      <button onClick={() => { writeConsent(); setVisible(false); }} style={{
        background: 'var(--terracotta-400)', color: '#fff',
        border: 'none', borderRadius: 999, padding: '8px 18px',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}>
        Got it
      </button>
    </div>
  );
}
