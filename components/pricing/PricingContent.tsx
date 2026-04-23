'use client';

import { useState } from 'react';
import { Sparkles, Star, ShieldCheck, MessageCircle, Camera, CalendarDays, Target, TrendingUp, Stethoscope, Plus, Minus } from 'lucide-react';
import { Button, Eyebrow, Reveal } from '../ui';
import { openAuth } from '../AuthModal';

export default function PricingContent() {
  return (
    <>
      <PricingHero />
      <PricingCard />
      <WhatsIncluded />
      <PricingFAQ />
    </>
  );
}

function PricingHero() {
  return (
    <section style={{ padding: '88px 32px 48px', background: 'var(--cream-50)', textAlign: 'center' }}>
      <Reveal style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 999,
          background: 'var(--terracotta-50)', color: 'var(--terracotta-600)',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          <Sparkles size={13} />
          Founding member launch · 50% off forever
        </div>
        <Eyebrow>Pricing</Eyebrow>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1.18, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
        }}>
          Try it free for 2 days. <em style={{ fontStyle: 'italic' }}>Keep it if it works.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 620, margin: '0 auto' }}>
          One plan. Month-to-month. Cancel anytime. Everything you need to understand your gut — chat, photo macros, meal planning, and goal tracking.
        </p>
      </Reveal>
    </section>
  );
}

function PricingCard() {
  return (
    <section style={{ padding: '32px 32px 96px', background: 'var(--cream-50)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 720, height: 420,
        background: 'radial-gradient(ellipse, rgba(224,124,89,0.14) 0%, rgba(224,124,89,0) 65%)',
        pointerEvents: 'none',
      }} />
      <Reveal y={24} duration={800} style={{
        maxWidth: 560, margin: '0 auto',
        background: '#fff', borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--border)',
        boxShadow: '0 30px 60px -20px rgba(42,61,58,0.25), 0 15px 30px -10px rgba(224,124,89,0.18)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          padding: '12px 28px',
          background: 'linear-gradient(90deg, var(--forest-500) 0%, var(--forest-600) 100%)',
          color: 'var(--cream-100)', textAlign: 'center',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Sparkles size={14} color="var(--terracotta-300)" />
          Founding member price · 50% off forever
        </div>
        <div style={{ padding: '40px 40px 32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-900)', marginBottom: 8 }}>
            Guthub membership
          </div>
          <div style={{ fontSize: 15, color: 'var(--ink-600)', marginBottom: 28 }}>
            Your always-available AI gut-health guide.
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400,
              color: 'var(--ink-500)', letterSpacing: '-0.02em', lineHeight: 1.1,
              textDecoration: 'line-through', textDecorationColor: 'var(--terracotta-500)',
              textDecorationThickness: '2px',
            }}>$19.95</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 400, color: 'var(--ink-900)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>$9.95</span>
            <span style={{ fontSize: 18, color: 'var(--ink-600)', lineHeight: 1.1 }}>/month</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--terracotta-50)', color: 'var(--terracotta-600)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 10, marginBottom: 14 }}>
            <Star size={12} /> Founding member · locked in for life
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', marginBottom: 28 }}>
            Billed monthly after your 2-day free trial · Cancel anytime
          </div>
          <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openAuth('signup')}>
            Start your 2-day free trial
          </Button>
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} /> Secure checkout
            </span>
            <span>·</span>
            <span>Cancel in two taps</span>
            <span>·</span>
            <span>No hidden fees</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const includedFeatures = [
  { icon: MessageCircle, title: 'Unlimited chat', body: 'Ask anything, anytime. Your AI guide remembers your history and adapts to you.' },
  { icon: Camera, title: 'Snap & know', body: 'Photo-to-macros in seconds. Calories, protein, carbs, fat, plus gut-health flags.' },
  { icon: CalendarDays, title: 'AI meal planner', body: 'Weekly meals built around your diet and preferences. Grocery list included.' },
  { icon: Target, title: 'Goal tracker', body: 'Set a goal weight. Daily macro targets. Visual progress and gentle nudges.' },
  { icon: TrendingUp, title: 'Pattern insights', body: 'Guthub spots trends in your symptoms and connects them to what you ate.' },
  { icon: Stethoscope, title: 'Appointment prep', body: 'Turn your logs into a crisp brief for your doctor or RD.' },
];

function WhatsIncluded() {
  return (
    <section style={{ padding: '112px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -160, right: -120, width: 520, height: 520, background: 'radial-gradient(circle, rgba(224,124,89,0.22) 0%, rgba(224,124,89,0) 70%)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -180, left: -140, width: 460, height: 460, background: 'radial-gradient(circle, rgba(244,208,162,0.16) 0%, rgba(244,208,162,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow color="var(--terracotta-300)">Everything included</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.18, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 20, color: 'var(--cream-100)' }}>
            One price. <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>Every feature.</em> No tiers, no upsells.
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {includedFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} y={16}>
              <IncludedCard f={f} featured={i === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function IncludedCard({ f, featured }: { f: typeof includedFeatures[0]; featured: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      padding: 32, borderRadius: 'var(--radius-lg)',
      background: featured ? 'var(--terracotta-400)' : (hover ? 'rgba(250,245,238,.10)' : 'rgba(250,245,238,.06)'),
      border: featured ? 'none' : '1px solid rgba(250,245,238,.12)',
      color: featured ? '#fff' : 'var(--cream-100)',
      transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      boxShadow: hover ? '0 18px 32px -12px rgba(0,0,0,0.35)' : 'none',
      transition: 'all 320ms var(--ease-out)', height: '100%',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: featured ? 'rgba(255,255,255,0.18)' : 'var(--terracotta-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform 320ms var(--ease-out)' }}>
        <f.icon size={24} color="#fff" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: featured ? '#fff' : 'var(--cream-100)', marginBottom: 10, lineHeight: 1.25 }}>{f.title}</div>
      <div style={{ fontSize: 15, color: featured ? 'rgba(255,255,255,0.88)' : 'rgba(250,245,238,.72)', lineHeight: 1.55 }}>{f.body}</div>
    </div>
  );
}

const faqItems = [
  { q: 'How does the 2-day free trial work?', a: 'Sign up and get full access to every feature for 2 days. No limits, no lite version. If you cancel before the trial ends, you won\'t be charged — ever.' },
  { q: 'Do I need a credit card to start?', a: 'Yes — we ask for a card up front so your access is uninterrupted if you decide to stay. You can remove it instantly from your account if you cancel.' },
  { q: 'What if I cancel?', a: 'Cancel anytime from your account in two taps. You keep access until the end of the period you\'ve paid for. We don\'t store your card after cancellation.' },
  { q: 'Is there a long-term contract?', a: 'No. Guthub is month-to-month. There are no annual commitments and no early termination fees.' },
  { q: 'Will the price change?', a: 'Your price is locked in as long as your subscription is continuous. If we ever raise prices for new members, your rate stays the same.' },
  { q: 'Do you offer refunds?', a: 'Your 2-day free trial is the refund — we want you to try everything before you pay. Once billed, we don\'t offer mid-cycle refunds, but you can cancel to prevent the next charge.' },
];

function PricingFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: '96px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Pricing FAQ</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)' }}>
            Straightforward answers.
          </h2>
        </Reveal>
        <Reveal delay={150} y={16}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {faqItems.map((it, i) => (
              <div key={i} style={{ borderTop: i ? '1px solid var(--ink-100)' : 'none' }}>
                <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                  width: '100%', textAlign: 'left', padding: '22px 28px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  fontFamily: 'var(--font-body)',
                }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-900)' }}>{it.q}</span>
                  {open === i ? <Minus size={20} color="var(--ink-500)" style={{ flexShrink: 0 }} /> : <Plus size={20} color="var(--ink-500)" style={{ flexShrink: 0 }} />}
                </button>
                {open === i && (
                  <div style={{ padding: '0 28px 24px', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-700)' }}>{it.a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
