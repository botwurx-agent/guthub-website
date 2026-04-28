'use client';

import { ReactNode } from 'react';
import { Eyebrow, Reveal } from './ui';

interface ContentPageProps {
  eyebrow?: string;
  title: ReactNode;
  lastUpdated?: string;
  disclaimer?: ReactNode;
  children: ReactNode;
}

export default function ContentPage({ eyebrow, title, lastUpdated, disclaimer, children }: ContentPageProps) {
  return (
    <>
      <section className="section-pad" style={{ padding: '88px 32px 40px', background: 'var(--cream-50)', textAlign: 'center' }}>
        <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="h1-mobile" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
            lineHeight: 1.18, letterSpacing: '-0.025em', fontWeight: 400,
            marginTop: eyebrow ? 18 : 0, marginBottom: 14, color: 'var(--ink-900)',
          }}>
            {title}
          </h1>
          {lastUpdated && (
            <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 0 }}>
              Last updated {lastUpdated}
            </p>
          )}
        </Reveal>
      </section>

      <section className="section-pad" style={{ padding: '0 32px 96px', background: 'var(--cream-50)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-800)' }}>
          {disclaimer && (
            <p style={{
              padding: '14px 18px', marginTop: 0, marginBottom: 32,
              borderLeft: '3px solid var(--terracotta-300)',
              background: 'var(--cream-100)',
              fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.55,
            }}>
              {disclaimer}
            </p>
          )}
          {children}
        </div>
      </section>
    </>
  );
}
