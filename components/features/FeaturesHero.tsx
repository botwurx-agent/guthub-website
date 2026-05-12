'use client';

import { Eyebrow, Reveal } from '../ui';

export default function FeaturesHero() {
  return (
    <section className="section-pad" style={{ padding: '120px 32px 100px', textAlign: 'center', background: `
        radial-gradient(ellipse 80% 70% at 10% 120%, rgba(219,111,86,0.32) 0%, transparent 60%),
        radial-gradient(ellipse 55% 75% at 92% -5%, rgba(63,106,74,0.20) 0%, transparent 55%),
        var(--cream-50)
      ` }}>
      <Reveal style={{ maxWidth: 820, margin: '0 auto' }}>
        <Eyebrow>Features</Eyebrow>
        <h1 className="h1-mobile" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5.2vw, 4.25rem)',
          lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
        }}>
          Everything you need,{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>all connected.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 640, margin: '0 auto' }}>
          Your intake is the seed. From there, every Guthub tool learns who you are and works together — no settings to tweak, no profiles to maintain.
        </p>
      </Reveal>
    </section>
  );
}
