'use client';

import Image from 'next/image';
import { Reveal } from '../ui';

export default function LeadAdvisor() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--cream-50)' }}>
      <div className="stack-to-one" style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        {/* Text */}
        <Reveal style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-500)' }}>
            Lead advisor
          </div>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 2.8vw, 2.4rem)', lineHeight: 1.25, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink-900)', margin: 0 }}>
            Clinical expertise behind every recommendation.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            Alina Nazari is a certified gut health practitioner and founder of <a href="https://gohappybelly.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta-500)', textDecoration: 'none', fontWeight: 500 }}>GoHappyBelly</a>, where she's helped hundreds of clients resolve chronic digestive issues through personalized nutrition.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            As Guthub's lead advisor, Alina shapes every protocol, reviews the AI's dietary guidance, and ensures that the advice Guthub gives is clinically grounded — not just algorithmically convenient.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {[
              'Certified gut health practitioner',
              'Founder of GoHappyBelly',
              '5+ years helping clients with IBS, SIBO & food sensitivities',
              'Specializes in Low-FODMAP and elimination protocols',
            ].map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--ink-700)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--terracotta-400)', flexShrink: 0, marginTop: 6 }} />
                {c}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Photo */}
        <Reveal delay={150} style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div className="advisor-photo" style={{ width: 340, height: 400, borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
              <Image
                src="/advisor.png"
                alt="Alina Nazari, Lead Advisor"
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            {/* Card */}
            <div className="advisor-card" style={{ position: 'absolute', bottom: -20, left: -20, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '16px 20px', boxShadow: 'var(--shadow-md)', minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-900)', marginBottom: 2 }}>Alina Nazari</div>
              <div style={{ fontSize: 12, color: 'var(--terracotta-600)', fontWeight: 600, marginBottom: 4 }}>Lead Advisor</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>GoHappyBelly · Certified Gut Health Practitioner</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
