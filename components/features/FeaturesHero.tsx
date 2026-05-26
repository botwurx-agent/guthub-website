'use client';

import { Eyebrow, Reveal } from '../ui';

export default function FeaturesHero() {
  return (
    <section className="section-pad" style={{ padding: '120px 32px 280px', textAlign: 'center', background: `
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
          Every feature feeds{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>the same engine.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 640, margin: '0 auto' }}>
          Most health apps collect your data and leave the thinking to you. In Guthub, every meal you log, every symptom you track, every test you upload feeds the same AI — and it uses all of it to actively connect the dots. The longer you use it, the sharper the picture gets.
        </p>
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* crack in the ground */}
            <path d="M10 88 L38 88 L44 82 L50 88 L78 88" stroke="#C2BDB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M44 82 L46 74 L43 66" stroke="#C2BDB1" strokeWidth="1.2" strokeLinecap="round"/>
            {/* stem */}
            <path d="M43 66 Q41 54 44 40 Q46 28 44 18" stroke="#3F6A4A" strokeWidth="1.5" strokeLinecap="round"/>
            {/* left leaf */}
            <path d="M43 50 Q34 44 30 36 Q38 36 43 44" stroke="#3F6A4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(63,106,74,0.12)"/>
            {/* right leaf */}
            <path d="M44 40 Q54 34 58 26 Q50 27 44 36" stroke="#3F6A4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(63,106,74,0.12)"/>
            {/* flower center */}
            <circle cx="44" cy="16" r="4" fill="#DB6F56" opacity="0.85"/>
            {/* petals */}
            <ellipse cx="44" cy="8"  rx="2.5" ry="4" fill="#E5917A" opacity="0.7"/>
            <ellipse cx="44" cy="24" rx="2.5" ry="4" fill="#E5917A" opacity="0.7"/>
            <ellipse cx="36" cy="16" rx="4" ry="2.5" fill="#E5917A" opacity="0.7"/>
            <ellipse cx="52" cy="16" rx="4" ry="2.5" fill="#E5917A" opacity="0.7"/>
            <ellipse cx="38.5" cy="10.5" rx="2.5" ry="4" transform="rotate(-45 38.5 10.5)" fill="#E5917A" opacity="0.6"/>
            <ellipse cx="49.5" cy="10.5" rx="2.5" ry="4" transform="rotate(45 49.5 10.5)"  fill="#E5917A" opacity="0.6"/>
            <ellipse cx="38.5" cy="21.5" rx="2.5" ry="4" transform="rotate(45 38.5 21.5)"  fill="#E5917A" opacity="0.6"/>
            <ellipse cx="49.5" cy="21.5" rx="2.5" ry="4" transform="rotate(-45 49.5 21.5)" fill="#E5917A" opacity="0.6"/>
            {/* flower center dot */}
            <circle cx="44" cy="16" r="2.5" fill="#C85A44"/>
          </svg>
        </div>
      </Reveal>
    </section>
  );
}
