'use client';

import { Reveal } from '../ui';

export default function WhyGuthub() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 480, height: 480, background: 'radial-gradient(circle, rgba(224,124,89,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -100, left: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(244,208,162,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-300)', marginBottom: 28 }}>
            Our approach
          </div>
          <p className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)', lineHeight: 1.35, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--cream-100)', margin: 0 }}>
            Most gut health apps treat you like a calorie counter. We treat you like a person with a unique history, specific triggers, and real goals. Every tool we built reflects that.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
