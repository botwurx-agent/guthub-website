'use client';

import { Eyebrow, Reveal } from '../ui';

export default function AboutHero() {
  return (
    <section style={{ padding: '96px 32px 56px', background: 'var(--cream-50)', textAlign: 'center' }}>
      <Reveal style={{ maxWidth: 780, margin: '0 auto' }}>
        <Eyebrow>About us</Eyebrow>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
        }}>
          Built by someone who{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>needed it himself.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 620, margin: '0 auto' }}>
          Guthub started as a personal project — a way to finally understand what was happening in Steve's gut — and turned into something worth sharing with everyone.
        </p>
      </Reveal>
    </section>
  );
}
