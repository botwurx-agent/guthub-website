'use client';

import { useState } from 'react';
import { Heart, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const beliefs = [
  {
    icon: Heart,
    title: 'You know your body best.',
    body: "Guthub amplifies your self-knowledge. It doesn't prescribe a diet — it helps you discover which foods work for your specific biology.",
  },
  {
    icon: ShieldCheck,
    title: 'Data without context is noise.',
    body: 'A calorie count means nothing without knowing your goal, your sensitivities, and how you feel. We connect everything together.',
  },
  {
    icon: Sparkles,
    title: "Personalization isn't a feature — it's the product.",
    body: "Generic advice fails most people. Guthub is only useful because it's calibrated to you — your intake, your history, your patterns.",
  },
  {
    icon: Users,
    title: 'This is a team effort.',
    body: "Between our founder's lived experience, our lead advisor's clinical expertise, and our users' feedback, Guthub is shaped by real people.",
  },
];

export default function Beliefs() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--terracotta-50)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(224,124,89,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>What we believe</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, color: 'var(--ink-900)' }}>
            The principles behind everything we build.
          </h2>
        </Reveal>
        <div className="cards-2-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {beliefs.map((b, i) => (
            <Reveal key={b.title} delay={i * 80} y={16}>
              <BeliefCard belief={b} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeliefCard({ belief }: { belief: typeof beliefs[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '32px',
        background: hover ? '#fff' : 'rgba(255,255,255,0.6)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(224,124,89,0.15)',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 300ms var(--ease-out)',
        height: '100%',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--terracotta-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, transform: hover ? 'scale(1.08)' : 'scale(1)', transition: 'transform 300ms var(--ease-out)' }}>
        <belief.icon size={20} color="var(--terracotta-500)" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--ink-900)', marginBottom: 10, lineHeight: 1.3 }}>{belief.title}</h3>
      <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-700)', margin: 0 }}>{belief.body}</p>
    </div>
  );
}
