'use client';

import { useState } from 'react';
import { Activity, Utensils, Target, FlaskConical } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const questions = [
  { icon: Activity, q: 'Is this reaction normal?' },
  { icon: Utensils, q: 'Why did this meal make me bloated?' },
  { icon: Target, q: 'Should I adjust my macros today?' },
  { icon: FlaskConical, q: 'What does this lab result mean?' },
];

export default function ProblemSection() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)', position: 'relative' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, margin: '0 auto 64px' }}>
          <Eyebrow color="var(--terracotta-300)">The Reality</Eyebrow>
          <h2 className="h2-mobile" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, marginBottom: 20, color: 'var(--cream-50)',
          }}>
            Because health questions{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>don't wait.</em>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'rgba(250,245,238,.72)' }}>
            Gut health isn't linear. Symptoms shift. Context matters. Questions come up daily — usually at 11pm, when no doctor is available.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'stretch' }}>
          {questions.map((it, i) => (
            <Reveal key={i} delay={i * 80} y={14} style={{ height: '100%' }}>
              <QuestionCard Icon={it.icon} q={it.q} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionCard({ Icon, q }: { Icon: React.ComponentType<{ size?: number; color?: string }>; q: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(250,245,238,.10)' : 'rgba(250,245,238,.06)',
        borderRadius: 'var(--radius-lg)', border: '1px solid rgba(250,245,238,.14)',
        padding: 24, backdropFilter: 'blur(6px)', height: '100%', boxSizing: 'border-box',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 240ms var(--ease-out)',
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--terracotta-400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon size={22} color="#fff" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.35, color: 'var(--cream-50)', fontWeight: 400 }}>
        "{q}"
      </div>
    </div>
  );
}
