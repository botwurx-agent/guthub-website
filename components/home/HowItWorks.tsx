'use client';

import { useState } from 'react';
import { Eyebrow, Reveal } from '../ui';

const steps = [
  { n: '01', t: 'Share your intake', b: 'Tell us about your diet, symptoms, lifestyle, and goals. Takes about 4 minutes.' },
  { n: '02', t: 'Start the conversation', b: 'Ask questions, explore patterns, and get guidance that evolves with you.' },
  { n: '03', t: 'Build clarity over time', b: 'The more you use Guthub, the more personalized — and more useful — it becomes.' },
];

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding: '112px 32px', background: 'var(--terracotta-50)', position: 'relative' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>How it works</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)' }}>
            Built to <em style={{ fontStyle: 'italic' }}>support you</em>, not overwhelm you.
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} y={18}>
              <StepCard step={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step: s }: { step: typeof steps[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--terracotta-100)', padding: 32,
      boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      transition: 'all 320ms var(--ease-out)', height: '100%',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 400, color: hover ? 'var(--terracotta-500)' : 'var(--terracotta-400)', letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1, fontStyle: 'italic', transition: 'color 320ms var(--ease-out)' }}>{s.n}</div>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, color: 'var(--ink-900)', marginBottom: 10, lineHeight: 1.25 }}>{s.t}</h4>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-600)', margin: 0 }}>{s.b}</p>
    </div>
  );
}
