'use client';

import { Button, Reveal } from './ui';
import { openAuth } from './AuthModal';

export default function FinalCTA() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--terracotta-400)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,220,200,.35) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <Reveal style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        <h2 className="h2-mobile" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
          lineHeight: 1.18, letterSpacing: '-0.022em', fontWeight: 400,
          color: 'var(--cream-50)', marginBottom: 20, marginTop: 0,
        }}>
          Take the guesswork out of your gut.
        </h2>
        <p style={{ fontSize: 19, color: 'rgba(253,250,243,.88)', marginBottom: 36, lineHeight: 1.55 }}>
          Join 1,000+ people rebuilding their relationship with food — with guidance that actually knows them.
        </p>
        <Button variant="inverse" size="lg" onClick={() => openAuth('signup')}>
          Start your 7-day free trial
        </Button>
        <div style={{ marginTop: 18, fontSize: 14, color: 'rgba(253,250,243,.75)' }}>
          Full access · Cancel anytime · Founding price locked for life
        </div>
      </Reveal>
    </section>
  );
}
