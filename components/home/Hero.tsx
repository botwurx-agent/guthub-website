'use client';

import { Button, Eyebrow, Reveal } from '../ui';
import { openAuth } from '../AuthModal';
import EnhancedChatAnimation from './EnhancedChatAnimation';

export default function Hero() {
  return (
    <section className="hero-section" style={{
      position: 'relative', padding: '40px 32px 96px',
      background: `
        radial-gradient(ellipse 80% 70% at 10% 120%, rgba(219,111,86,0.32) 0%, transparent 60%),
        radial-gradient(ellipse 55% 75% at 92% -5%, rgba(63,106,74,0.20) 0%, transparent 55%),
        var(--cream-50)
      `,
    }}>
      <div className="hero-grid" style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 80,
        alignItems: 'center',
      }}>
        <div>
          <Reveal delay={0} y={12}>
            <Eyebrow>Your AI gut-health guide</Eyebrow>
          </Reveal>
          <Reveal delay={120} y={16} duration={800}>
            <h1 className="hero-h1" style={{
              marginTop: 20, marginBottom: 56, paddingBottom: 32,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.75rem, 5.2vw, 4.25rem)',
              lineHeight: 1.32, letterSpacing: '-0.025em',
              fontWeight: 400, color: 'var(--ink-900)',
            }}>
              Stop guessing{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>
                what&apos;s triggering your symptoms.
              </em>
            </h1>
          </Reveal>
          <Reveal delay={260} y={12}>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 520, marginBottom: 36 }}>
              Log your meals, symptoms, supplements, and daily habits, and let GutHub surface the patterns and potential triggers behind them. Finally make sense of what your body&apos;s trying to tell you.
            </p>
          </Reveal>
          <Reveal delay={380} y={12}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <Button variant="primary" size="lg" as="a" href="/pricing">
                Start your 7-day free trial
              </Button>
              <Button variant="secondary" size="lg" as="a" href="#how">
                See how it works
              </Button>
            </div>
          </Reveal>
        </div>
        <div className="hero-mock-col" style={{ display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
          <div aria-hidden className="hero-glow" style={{
            position: 'absolute', width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(224,124,89,0.22) 0%, rgba(224,124,89,0) 65%)',
            animation: 'heroGlow 6s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
            <EnhancedChatAnimation />
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
