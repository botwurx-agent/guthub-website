'use client';

import { Reveal } from '../ui';

export default function WhyGuthub() {
  return (
    <section style={{ padding: '112px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 480, height: 480, background: 'radial-gradient(circle, rgba(224,124,89,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -100, left: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(244,208,162,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-300)', marginBottom: 28 }}>
            Why Guthub
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)', lineHeight: 1.35, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--cream-100)', margin: '0 0 36px' }}>
            "Most gut health apps treat you like a calorie counter. We treat you like a person with a unique history, specific triggers, and real goals — and we built every tool to reflect that."
          </blockquote>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'var(--terracotta-400)', flexShrink: 0, position: 'relative', border: '2px solid rgba(250,245,238,0.2)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>SN</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream-100)' }}>Steve Nazari</div>
              <div style={{ fontSize: 13, color: 'rgba(250,245,238,0.65)' }}>Founder, Guthub</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
