'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, MessageCircle, Target, CalendarDays, FileText, LayoutDashboard } from 'lucide-react';
import { Eyebrow } from '../ui';

const formFields = [
  { label: 'Name', value: 'Alex Morgan' },
  { label: 'Goal', value: 'Reduce IBS symptoms' },
  { label: 'Sensitivities', value: 'Gluten, lactose, onions' },
  { label: 'Current weight', value: '172 lbs' },
  { label: 'Target weight', value: '158 lbs' },
  { label: 'Diet style', value: 'Mediterranean, pescatarian' },
];

const featureCards = [
  { Icon: Camera, label: 'Snap & know', detail: 'Flags gluten & onions automatically' },
  { Icon: MessageCircle, label: 'AI chat', detail: 'Knows your IBS history from day 1' },
  { Icon: Target, label: 'Goal tracker', detail: '158 lbs · daily macros set' },
  { Icon: CalendarDays, label: 'Meal planner', detail: 'Mediterranean, pescatarian week' },
  { Icon: FileText, label: 'Test reports', detail: 'Ready when you upload' },
  { Icon: LayoutDashboard, label: 'Dashboard', detail: 'Tracks symptoms vs meals' },
];

const durations = [600, 500, 500, 500, 500, 500, 500, 900, 650, 650, 650, 650, 650, 650, 2400, 400];

export default function OnboardingFlowAnimation() {
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setPhase(p => (p + 1) % 16), durations[phase] || 600);
    return () => clearTimeout(t);
  }, [phase, visible]);

  const formComplete = phase >= 7;
  const filledCount = Math.min(phase, 6);

  return (
    <section ref={ref} style={{ padding: '96px 32px 112px', background: 'var(--terracotta-50)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>How it all connects</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, marginBottom: 18, color: 'var(--ink-900)' }}>
            Your intake shapes <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>every tool.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            One thoughtful onboarding powers the entire system. Every feature is already tuned to you the first time you use it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0, alignItems: 'stretch', minHeight: 520, position: 'relative' }}>
          {/* Form */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--shadow-md)', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: formComplete ? 'var(--forest-500)' : 'var(--terracotta-400)', transition: 'background 300ms' }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-600)' }}>
                {formComplete ? 'Intake complete' : 'Intake form'}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', marginBottom: 20 }}>
              Tell Guthub about you
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {formFields.map((f, i) => {
                const filled = i < filledCount;
                return (
                  <div key={f.label} style={{ padding: '10px 12px', background: filled ? 'var(--cream-50)' : '#fff', border: `1px solid ${filled ? 'var(--forest-300)' : 'var(--border)'}`, borderRadius: 10, transition: 'all 300ms var(--ease-out)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, color: filled ? 'var(--ink-900)' : 'var(--ink-400)', minHeight: 18, fontWeight: filled ? 500 : 400 }}>
                      {filled ? f.value : (i === filledCount && !formComplete ? '|' : '—')}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: formComplete ? 'var(--forest-500)' : 'transparent', color: formComplete ? 'var(--cream-100)' : 'transparent', textAlign: 'center', fontSize: 13, fontWeight: 600, transition: 'all 400ms var(--ease-out)', opacity: formComplete ? 1 : 0, transform: formComplete ? 'translateY(0)' : 'translateY(8px)' }}>
              ✓ Configuring your tools…
            </div>
          </div>

          {/* SVG connector lines */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 370, top: 0, bottom: 0, width: 'calc(100% - 370px)', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--terracotta-400)" />
              </marker>
            </defs>
            {[{ x: 55, y: 15 }, { x: 95, y: 15 }, { x: 55, y: 50 }, { x: 95, y: 50 }, { x: 55, y: 85 }, { x: 95, y: 85 }].map((t, i) => {
              const active = phase >= 8 + i;
              return (
                <g key={i}>
                  <path d={`M 0 50 C 20 50, 30 ${t.y}, ${t.x} ${t.y}`} fill="none" stroke="var(--terracotta-400)" strokeWidth="0.45" strokeLinecap="round" strokeDasharray="200" strokeDashoffset={active ? 0 : 200} style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }} opacity={active ? 0.85 : 0.25} vectorEffect="non-scaling-stroke" />
                  {active && (
                    <circle cx={t.x} cy={t.y} r="1.2" fill="var(--terracotta-500)">
                      <animate attributeName="r" values="1.2;2.2;1.2" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Feature cards */}
          <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, paddingLeft: 80 }}>
            {featureCards.map((f, i) => {
              const activated = phase >= 8 + i;
              return (
                <div key={f.label} style={{ padding: 18, background: activated ? '#fff' : 'rgba(255,255,255,0.5)', border: `1px solid ${activated ? 'var(--terracotta-300)' : 'var(--border)'}`, borderRadius: 14, boxShadow: activated ? '0 10px 25px -8px rgba(224,124,89,0.35)' : 'none', transform: activated ? 'translateX(0) scale(1)' : 'translateX(-6px) scale(0.98)', opacity: activated ? 1 : 0.5, transition: 'all 450ms var(--ease-out)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: activated ? 'var(--terracotta-400)' : 'var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 300ms' }}>
                      <f.Icon size={18} color={activated ? '#fff' : 'var(--ink-500)'} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink-900)' }}>{f.label}</div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: activated ? 'var(--ink-700)' : 'var(--ink-400)', transition: 'color 300ms' }}>
                    {activated ? f.detail : 'Waiting for intake…'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
