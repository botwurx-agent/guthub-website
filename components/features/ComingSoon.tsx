'use client';

import { Mic, Activity, Watch, ChefHat, Users, BarChart3 } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const comingFeatures = [
  {
    icon: Mic,
    name: 'GutTalk AI',
    tagline: 'Voice-first gut journaling',
    desc: 'Log symptoms, meals, and mood by talking — no typing required. Guthub transcribes, categorizes, and connects patterns.',
    eta: 'Summer 2025',
  },
  {
    icon: Activity,
    name: 'MicroBiome Pulse',
    tagline: 'Live microbiome tracking',
    desc: 'Connect your at-home microbiome tests for a running view of your bacterial diversity and how it shifts with your diet.',
    eta: 'Fall 2025',
  },
  {
    icon: Watch,
    name: 'BioSync Wearable',
    tagline: 'HRV + gut correlation',
    desc: 'Sync with Apple Watch or Garmin to see how gut health maps to heart-rate variability, sleep quality, and stress scores.',
    eta: 'Fall 2025',
  },
  {
    icon: ChefHat,
    name: 'NutriChef AI',
    tagline: 'AI recipe creator',
    desc: "Generate gut-friendly recipes on demand. Tell Guthub what's in your fridge and it writes a meal that fits your sensitivities.",
    eta: 'Winter 2025',
  },
  {
    icon: Users,
    name: 'GutHealth Community',
    tagline: 'Peer support & shared wins',
    desc: 'An opt-in community where members share meals, recipes, and progress — moderated for quality and privacy.',
    eta: 'Winter 2025',
  },
  {
    icon: BarChart3,
    name: 'MicroBiome Forecast',
    tagline: 'Predict gut flare-ups',
    desc: 'Using your history, Guthub forecasts when symptoms are likely to spike so you can adjust meals 48 hours ahead.',
    eta: '2026',
  },
];

export default function ComingSoon() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--cream-50)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -60, right: -80, width: 440, height: 440, background: 'radial-gradient(circle, rgba(224,124,89,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 72, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>Coming soon</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, marginBottom: 18, color: 'var(--ink-900)' }}>
            The roadmap ahead.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            Founding members get early access to every feature the moment it launches — no upgrades, no waiting list.
          </p>
        </Reveal>

        <div className="cards-3-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {comingFeatures.map((f, i) => (
            <Reveal key={f.name} delay={i * 70} y={20}>
              <ComingSoonCard f={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComingSoonCard({ f }: { f: typeof comingFeatures[0] }) {
  return (
    <div style={{ padding: '28px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div aria-hidden style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'radial-gradient(circle, rgba(224,124,89,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* ETA badge */}
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-600)', background: 'var(--terracotta-50)', padding: '3px 8px', borderRadius: 999 }}>
        {f.eta}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cream-100)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <f.icon size={20} color="var(--terracotta-400)" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)', marginBottom: 4 }}>{f.name}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--terracotta-500)', marginBottom: 10, letterSpacing: '0.02em' }}>{f.tagline}</div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-600)', margin: 0 }}>{f.desc}</p>
    </div>
  );
}
