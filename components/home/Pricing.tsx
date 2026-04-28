'use client';

import Link from 'next/link';
import { Eyebrow, Reveal } from '../ui';
import PricingCards from '../PricingCards';

export default function Pricing() {
  return (
    <section id="pricing" className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="h2-mobile" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, marginBottom: 18, color: 'var(--ink-900)',
          }}>
            Start with <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>7 days free.</em> Keep what works.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            Full access for 7 days. Cancel anytime in two taps. Founding member pricing locked for life, while spots last.
          </p>
        </Reveal>

        <Reveal delay={120} y={20}>
          <PricingCards />
        </Reveal>

        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <Link href="/pricing" style={{
            color: 'var(--terracotta-600)', fontSize: 15, fontWeight: 600,
            textDecoration: 'none', borderBottom: '1px solid rgba(200,90,68,.35)', paddingBottom: 2,
          }}>
            See full pricing details →
          </Link>
        </div>
      </div>
    </section>
  );
}
