'use client';

import { Eyebrow } from '../ui';
import IntakeFlowGraphic from '../IntakeFlowGraphic';

export default function OnboardingFlowAnimation() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '96px 32px 112px', background: 'var(--terracotta-50)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>How it all connects</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, marginBottom: 18, color: 'var(--ink-900)' }}>
            Your intake shapes <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>every tool.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            One thoughtful onboarding powers the entire system. Every feature is already tuned to you the first time you use it.
          </p>
        </div>

        <IntakeFlowGraphic />
      </div>
    </section>
  );
}
