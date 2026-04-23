'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge, Button, Eyebrow, Reveal } from '../ui';
import { openAuth } from '../AuthModal';

const features = [
  'Unlimited chat with your AI gut-health guide',
  'Snap & know — photo-to-macros in seconds',
  'AI meal planner + grocery lists',
  'Goal tracker with daily macro targets',
  'Cancel anytime, in two taps',
];

export default function Pricing() {
  const [hover, setHover] = useState(false);
  return (
    <section id="pricing" className="section-pad section-pad-v" style={{ padding: '96px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <Eyebrow color="var(--terracotta-300)">Simple pricing</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, marginBottom: 20, color: 'var(--cream-100)' }}>
            Start with <em style={{ fontStyle: 'italic' }}>2 days free.</em> Keep what works.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(250,245,238,.72)', marginBottom: 48 }}>
            Full access for 2 days. Cancel anytime — no long-term commitments, no questions.
          </p>
        </Reveal>

        <Reveal delay={150} y={24}>
          <div className="home-pricing-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: 'var(--cream-50)', color: 'var(--ink-900)',
            borderRadius: 'var(--radius-2xl)', padding: 40,
            boxShadow: hover ? '0 30px 60px -10px rgba(0,0,0,0.35)' : 'var(--shadow-xl)',
            transform: hover ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 360ms var(--ease-out)', textAlign: 'left',
            maxWidth: 520, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Badge tone="accent">2-day free trial</Badge>
              <Badge tone="soft">Full access</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 400, color: 'var(--ink-900)', letterSpacing: '-0.025em', lineHeight: 1 }}>$9.95</span>
              <span style={{ fontSize: 17, color: 'var(--ink-600)' }}>/month</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-500)', marginBottom: 28 }}>Month-to-month · Billed after your 2-day trial</div>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--ink-100)' }}>
                <Check size={20} color="var(--forest-400)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 16, color: 'var(--ink-800)' }}>{f}</div>
              </div>
            ))}
            <div style={{ marginTop: 28 }}>
              <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openAuth('signup')}>
                Start your 2-day free trial
              </Button>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center' }}>
              No credit card for the first 2 days · Cancel anytime · Secure checkout
            </div>
          </div>
        </Reveal>

        <div style={{ marginTop: 32 }}>
          <Link href="/pricing" style={{ color: 'var(--terracotta-200)', fontSize: 15, fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(238,185,154,.4)', paddingBottom: 2 }}>
            See full pricing details →
          </Link>
        </div>
      </div>
    </section>
  );
}
