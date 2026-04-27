'use client';

import { useState } from 'react';
import { Eyebrow, Reveal } from '../ui';
import IntakeFlowGraphic from '../IntakeFlowGraphic';

const steps = [
  { n: '01', t: 'Tell Guthub about you', b: 'A 6-minute intake captures your symptoms, sensitivities, diet, and goals. Nothing fancy — just the kind of context a real practitioner would gather on day one.' },
  { n: '02', t: 'Use any tool. It already knows you.', b: 'Snap a meal, chat with your coach, or open a meal plan. Every feature pulls from your intake automatically. No re-explaining yourself.' },
  { n: '03', t: 'It learns as you go.', b: 'Every meal logged, every symptom flagged, every conversation makes the picture sharper. The longer you use Guthub, the more personalized it becomes.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--terracotta-50)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, marginBottom: 18, color: 'var(--ink-900)' }}>
            One intake. <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>Every tool tuned to you.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            No generic advice. No starting from scratch every conversation. Every feature in Guthub reads from the same profile — so the moment you finish your intake, the whole system already knows you.
          </p>
        </Reveal>

        <div style={{ marginBottom: 80 }}>
          <IntakeFlowGraphic />
        </div>

        <div className="cards-3-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
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
