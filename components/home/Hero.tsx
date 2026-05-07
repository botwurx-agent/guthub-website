'use client';

import { Button, Eyebrow, Reveal } from '../ui';
import { openAuth } from '../AuthModal';
import ChatAnimation from '../ChatAnimation';
import { CheckCircle, XCircle, Stethoscope } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero-section" style={{ position: 'relative', padding: '40px 32px 96px', background: 'var(--cream-50)' }}>
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
              Nutrition guidance{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>
                you can actually talk to.
              </em>
            </h1>
          </Reveal>
          <Reveal delay={260} y={12}>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 520, marginBottom: 36 }}>
              Your personalized AI gut health assistant — ongoing support, clarity, and real-time feedback. So you're never stuck guessing, googling, or feeling alone.
            </p>
          </Reveal>
          <Reveal delay={380} y={12}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <Button variant="primary" size="lg" onClick={() => openAuth('signup')}>
                Start your 7-day free trial
              </Button>
              <Button variant="secondary" size="lg" as="a" href="#how">
                See how it works
              </Button>
            </div>
          </Reveal>
          <Reveal delay={500} y={10}>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', fontSize: 14, color: 'var(--ink-600)' }}>
              <TrustBullet Icon={CheckCircle}>Full access for 7 days</TrustBullet>
              <TrustBullet Icon={XCircle}>Cancel anytime</TrustBullet>
              <TrustBullet Icon={Stethoscope}>Complements professional care</TrustBullet>
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
            <ChatAnimation />
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

function TrustBullet({ Icon, children }: { Icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon size={15} color="var(--forest-400)" />
      {children}
    </span>
  );
}
