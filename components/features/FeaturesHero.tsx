'use client';

import { Eyebrow, Reveal } from '../ui';

export default function FeaturesHero() {
  return (
    <section style={{ padding: '96px 32px 40px', background: 'var(--cream-50)', textAlign: 'center' }}>
      <Reveal style={{ maxWidth: 820, margin: '0 auto' }}>
        <Eyebrow>Features</Eyebrow>
        <h1 style={{
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
