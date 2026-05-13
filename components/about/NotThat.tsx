'use client';

import { X, Check } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const notList = [
  'A fad diet app',
  'A calorie-counting treadmill',
  'A one-size-fits-all protocol',
  'A replacement for your doctor',
  'A meal-kit subscription',
  'Another wellness influencer product',
];

const isList = [
  'A personalized gut health guide',
  'Context-aware nutrition tracking',
  'Tailored to your biology and goals',
  'A companion alongside medical care',
  'Powered by your own intake data',
  "Built by people who've been there",
];

export default function NotThat() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '96px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>What Guthub is, and what it isn't</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, color: 'var(--ink-900)' }}>
            We built something different on purpose.
          </h2>
        </Reveal>
        <div className="cards-2-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {/* Not that */}
          <Reveal y={20}>
            <div style={{ padding: '32px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 20 }}>Not this</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {notList.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--ink-500)', textDecoration: 'line-through', textDecorationColor: 'rgba(224,124,89,0.5)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(224,124,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={12} color="var(--terracotta-400)" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          {/* Is */}
          <Reveal delay={120} y={20}>
            <div style={{ padding: '32px', background: 'var(--forest-500)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-300)', marginBottom: 20 }}>Actually this</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {isList.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--cream-100)', fontWeight: 500 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(250,245,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="var(--terracotta-300)" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
