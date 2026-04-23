'use client';

import Image from 'next/image';
import { Reveal } from '../ui';

export default function FounderStory() {
  return (
    <section style={{ padding: '80px 32px 96px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        {/* Photo */}
        <Reveal style={{ position: 'relative' }}>
          <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/5', position: 'relative' }}>
            <Image
              src="/founder-family.png"
              alt="Steve Nazari with his family"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Floating caption */}
          <div style={{ position: 'absolute', bottom: -16, right: -16, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px 18px', boxShadow: 'var(--shadow-md)', maxWidth: 220 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink-900)', marginBottom: 2 }}>Steve Nazari</div>
            <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>Founder · BJJ blue belt · gut-health convert</div>
          </div>
        </Reveal>

        {/* Story */}
        <Reveal delay={150} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-500)' }}>
            The story
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 2.8vw, 2.4rem)', lineHeight: 1.25, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink-900)', margin: 0 }}>
            Twelve years of stomach problems solved by paying attention.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            Steve Nazari spent over a decade struggling with bloating, unpredictable symptoms, and a medical system that told him everything was "normal." As a competitive Brazilian jiu-jitsu athlete and father of four, he needed to perform — and he needed answers.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            After running his own tests, working with nutritionists, and obsessively logging every meal, he started to see patterns. Certain foods — even "healthy" ones — were wrecking his gut. Others made him feel elite.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            He built the first version of Guthub to organize his own data. Then his wife Alina — a certified gut health practitioner — joined in. When friends and family started asking for access, they knew they were onto something.
          </p>
          <blockquote style={{ margin: 0, padding: '16px 20px', borderLeft: '3px solid var(--terracotta-400)', background: 'var(--terracotta-50)', borderRadius: '0 10px 10px 0' }}>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-800)', fontStyle: 'italic', margin: 0 }}>
              "I wanted one place that could hold all my gut health data and actually help me understand it — not just store it."
            </p>
            <cite style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--terracotta-600)', fontStyle: 'normal', fontWeight: 600 }}>— Steve Nazari, founder</cite>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
