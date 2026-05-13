'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GA_ID = 'G-N2Z43CL18W';
const META_PIXEL_ID = '1575707930432478';
const COOKIE_NAME = 'guthub_cookie_consent';

function getConsent(): 'accepted' | 'declined' | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  const val = match.split('=')[1];
  return val === 'accepted' || val === 'declined' ? val : null;
}

function writeConsent(value: 'accepted' | 'declined') {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
}

function loadGA() {
  if (document.getElementById('ga-gtag')) return;
  const s1 = document.createElement('script');
  s1.id = 'ga-gtag';
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s1.async = true;
  document.head.appendChild(s1);
  const s2 = document.createElement('script');
  s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`;
  document.head.appendChild(s2);
}

function loadMetaPixel() {
  if (document.getElementById('meta-pixel')) return;
  const s = document.createElement('script');
  s.id = 'meta-pixel';
  s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;
  document.head.appendChild(s);
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === 'accepted') {
      loadGA();
      loadMetaPixel();
    } else if (consent === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    writeConsent('accepted');
    loadGA();
    loadMetaPixel();
    setVisible(false);
  }

  function decline() {
    writeConsent('declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="region" aria-label="Cookie consent" style={{
      position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 70,
      maxWidth: 760, margin: '0 auto',
      background: 'var(--ink-900)', color: 'var(--cream-100)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ flex: 1, minWidth: 220, fontSize: 14, lineHeight: 1.55 }}>
        We use analytics cookies to understand how people use Guthub and improve the experience.{' '}
        <Link href="/cookies" style={{ color: 'var(--terracotta-300)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Cookie Policy
        </Link>
      </span>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={decline} style={{
          background: 'transparent', color: 'var(--cream-300)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
          padding: '8px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}>
          Decline
        </button>
        <button onClick={accept} style={{
          background: 'var(--terracotta-400)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '8px 20px',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}>
          Accept
        </button>
      </div>
    </div>
  );
}
