'use client';

import { ArrowRight } from 'lucide-react';
import { Button, Eyebrow, Reveal } from '../ui';
import { openAuth } from '../AuthModal';

const milestones = [
  { done: true, label: 'Launched private beta', detail: 'Jan 2025' },
  { done: true, label: 'AI chat & meal planning live', detail: 'Feb 2025' },
  { done: true, label: 'Photo macro analysis', detail: 'Mar 2025' },
  { done: false, label: 'Voice journaling', detail: 'Summer 2025' },
  { done: false, label: 'Microbiome test integration', detail: 'Fall 2025' },
  { done: false, label: 'Wearable health sync', detail: '2026' },
];

export default function WhatsNext() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
          <Eyebrow>What's next</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, marginBottom: 18, color: 'var(--ink-900)' }}>
            The road ahead.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            We're moving fast — and founding members get early access to everything the moment it ships.
          </p>
        </Reveal>

        <Reveal delay={100} y={16}>
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 10, top: 10, bottom: 10, width: 2, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {milestones.map((m, i) => (
                <div key={m.label} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: -32, top: 3, width: 18, height: 18, borderRadius: '50%', background: m.done ? 'var(--forest-500)' : '#fff', border: `2px solid ${m.done ? 'var(--forest-500)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    {m.done && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, padding: '10px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${m.done ? 'var(--forest-200)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: m.done ? 600 : 400, color: m.done ? 'var(--ink-900)' : 'var(--ink-600)' }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.done ? 'var(--forest-600)' : 'var(--ink-400)', padding: '3px 10px', borderRadius: 999, background: m.done ? 'var(--forest-50)' : 'var(--cream-50)' }}>{m.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={200} style={{ textAlign: 'center', marginTop: 64 }}>
          <p style={{ fontSize: 17, color: 'var(--ink-700)', marginBottom: 24 }}>
            Get in early and help shape what comes next.
          </p>
          <Button variant="primary" size="lg" onClick={() => openAuth('signup')} style={{ gap: 10 }}>
            Start your free trial <ArrowRight size={18} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
