'use client';

import { useState, useEffect } from 'react';
import { Activity, Check } from 'lucide-react';
import PhoneFrame from './PhoneFrame';

type Corr = { food: string; symptom: string; pct: number; strong?: boolean };

const correlations: Corr[] = [
  { food: 'Cold brew after 3pm', symptom: 'Bloating', pct: 82, strong: true },
  { food: 'Beans + broccoli combo', symptom: 'Bloating', pct: 71 },
  { food: 'Late dinners (after 9pm)', symptom: 'Restless sleep', pct: 58 },
  { food: 'Aged cheese', symptom: 'Cramping', pct: 44 },
];

export default function InsightsAnimation({ staticPreview = false }: { staticPreview?: boolean }) {
  // grow controls bar width; cycles for the live animation, fixed for preview
  const [grown, setGrown] = useState(staticPreview);

  useEffect(() => {
    if (staticPreview) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loop = () => {
      setGrown(false);
      timers.push(setTimeout(() => { if (!cancelled) setGrown(true); }, 250));
      timers.push(setTimeout(() => { if (!cancelled) loop(); }, 6500));
    };
    loop();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [staticPreview]);

  return (
    <PhoneFrame>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--cream-50)', overflow: 'hidden' }}>
        {/* screen header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--forest-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="var(--cream-50)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Insights</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>Last 14 days</div>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, minHeight: 0, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
            What&apos;s triggering your symptoms
          </div>

          {/* correlation rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {correlations.map((c, i) => (
              <div key={i} style={{
                background: '#fff', border: `1px solid ${c.strong ? 'var(--terracotta-300)' : 'var(--border)'}`,
                borderRadius: 12, padding: '10px 12px',
                boxShadow: c.strong ? '0 4px 14px -6px rgba(219,111,86,0.35)' : 'none',
                animation: staticPreview ? 'none' : `popIn 360ms var(--ease-out) ${i * 90}ms both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>
                    {c.food} <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>→ {c.symptom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.strong && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: 'var(--terracotta-600)', background: 'rgba(219,111,86,0.14)',
                        padding: '2px 6px', borderRadius: 999,
                      }}>Strong link</span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.strong ? 'var(--terracotta-500)' : 'var(--ink-600)' }}>{c.pct}%</span>
                  </div>
                </div>
                {/* bar track */}
                <div style={{ height: 7, borderRadius: 999, background: 'var(--cream-200)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: grown ? `${c.pct}%` : '0%',
                    background: c.strong
                      ? 'linear-gradient(90deg, #e8856a, #db6f56)'
                      : 'var(--forest-400)',
                    transition: 'width 1100ms cubic-bezier(0.22,1,0.36,1)',
                    transitionDelay: `${250 + i * 120}ms`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* positive footer */}
          <div style={{
            marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(63,106,74,0.10)', border: '1px solid rgba(63,106,74,0.18)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: 'var(--forest-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Check size={12} color="#fff" />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--forest-600)', fontWeight: 500 }}>
              12 foods showed no link, you&apos;re in the clear there.
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
