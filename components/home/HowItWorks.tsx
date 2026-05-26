'use client';

import { useState } from 'react';
import { Eyebrow, Reveal } from '../ui';
import IntakeFlowGraphic from '../IntakeFlowGraphic';

const steps = [
  { n: '01', t: 'Set your foundation', b: 'A 6-minute intake captures your symptoms, sensitivities, diet, and goals. It\'s the context Guthub needs to make everything that follows actually relevant to you.' },
  { n: '02', t: 'Log what\'s happening', b: 'Every meal, symptom, supplement, and ketone reading you add becomes signal. Not a diary — a dataset. This is the engine that makes Guthub smarter about your body over time.' },
  { n: '03', t: 'Guthub connects the dots', b: 'Bloating three times this week? Guthub cross-references your meals, stress notes, and supplements to surface the pattern — the kind of connection that would take a doctor weeks of diary entries to spot.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--terracotta-50)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, marginBottom: 18, color: 'var(--ink-900)' }}>
            The more you log,{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>the more it figures out.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            The intake gives Guthub your starting point. What you log every day — meals, symptoms, weight, supplements, ketones — is what turns it into an investigator. The more data you give it, the better it gets at connecting your triggers, patterns, and progress.
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
