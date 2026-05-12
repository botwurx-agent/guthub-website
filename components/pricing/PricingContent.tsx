'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Star, ShieldCheck, MessageCircle, Camera, CalendarDays, Target, TrendingUp, Stethoscope, Plus, Minus, Loader2 } from 'lucide-react';
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
    <section className="section-pad" style={{ padding: '88px 32px 48px', background: 'var(--cream-50)', textAlign: 'center' }}>
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
        <h1 className="h1-mobile" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1.18, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
        }}>
          Try it free for 7 days. <em style={{ fontStyle: 'italic' }}>Keep it if it works.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 620, margin: '0 auto' }}>
          One plan. Month-to-month. Cancel anytime. Everything you need to understand your gut — chat, photo macros, meal planning, and goal tracking.
        </p>
      </Reveal>
    </section>
  );
}

function PricingCard() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  function startCheckout(plan: string) {
    setLoading(plan);
    router.push(`/subscribe?plan=${plan}&billing=${billing}`);
  }

  const plans = [
    {
      key: 'founding',
      badge: '🔥 Only 200 spots',
      badgeColor: 'var(--terracotta-600)',
      badgeBg: 'var(--terracotta-50)',
      name: 'Founding Member',
      monthlyPrice: '$13',
      yearlyPrice: '$125',
      yearlyPerMonth: '$10.42',
      originalPrice: '$25',
      yearlySavings: '$31',
      tagline: 'Locked in for life. Never increases.',
      highlight: true,
    },
    {
      key: 'launch',
      badge: 'Limited time',
      badgeColor: 'var(--forest-500)',
      badgeBg: 'var(--forest-50)',
      name: 'Launch',
      monthlyPrice: '$20',
      yearlyPrice: '$190',
      yearlyPerMonth: '$15.83',
      originalPrice: null,
      yearlySavings: '$50',
      tagline: 'Available while in early access.',
      highlight: false,
    },
    {
      key: 'standard',
      badge: 'Standard',
      badgeColor: 'var(--ink-600)',
      badgeBg: 'var(--ink-100)',
      name: 'Standard',
      monthlyPrice: '$25',
      yearlyPrice: '$240',
      yearlyPerMonth: '$20',
      originalPrice: null,
      yearlySavings: '$60',
      tagline: 'Full access, no commitment.',
      highlight: false,
    },
  ];

  return (
    <section style={{ padding: '32px 32px 96px', background: 'var(--cream-50)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 420,
        background: 'radial-gradient(ellipse, rgba(224,124,89,0.12) 0%, rgba(224,124,89,0) 65%)',
        pointerEvents: 'none',
      }} />

      {/* Billing toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: billing === 'monthly' ? 'var(--ink-900)' : 'var(--ink-400)', fontFamily: 'var(--font-body)' }}>
          Monthly
        </span>
        <button
          onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
          style={{
            width: 52, height: 28, borderRadius: 999, border: 'none',
            background: billing === 'yearly' ? 'var(--forest-500)' : 'var(--ink-200)',
            cursor: 'pointer', position: 'relative', transition: 'background 250ms',
            flexShrink: 0,
          }}
          aria-label="Toggle billing interval"
        >
          <span style={{
            position: 'absolute', top: 3, left: billing === 'yearly' ? 27 : 3,
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 250ms var(--ease-out)',
            display: 'block',
          }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: billing === 'yearly' ? 'var(--ink-900)' : 'var(--ink-400)', fontFamily: 'var(--font-body)' }}>
          Yearly
        </span>
        {billing === 'yearly' && (
          <span style={{
            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            background: 'var(--terracotta-50)', color: 'var(--terracotta-600)',
          }}>
            Save up to $60/yr
          </span>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20, maxWidth: 960, margin: '0 auto',
      }} className="pricing-grid">
        {plans.map((plan) => (
          <Reveal key={plan.key} y={20} duration={700} style={{ display: 'flex' }}>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: '#fff', borderRadius: 'var(--radius-2xl)',
              border: `1.5px solid ${plan.highlight ? 'var(--terracotta-300)' : 'var(--border)'}`,
              boxShadow: plan.highlight
                ? '0 20px 50px -12px rgba(42,61,58,0.2), 0 8px 20px -6px rgba(224,124,89,0.2)'
                : '0 4px 16px rgba(31,45,42,0.06)',
              overflow: 'hidden',
              transform: plan.highlight ? 'translateY(-8px)' : 'none',
            }}>
              {plan.highlight && (
                <div style={{
                  padding: '10px 20px', textAlign: 'center',
                  background: 'linear-gradient(90deg, var(--forest-500), var(--forest-600))',
                  color: 'var(--cream-100)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Sparkles size={12} color="var(--terracotta-300)" />
                  Most popular · 50% off forever
                </div>
              )}
              <div style={{ padding: '28px 28px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 999,
                    background: plan.badgeBg, color: plan.badgeColor,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', alignSelf: 'flex-start',
                  }}>
                    {plan.key === 'founding' && <Star size={10} />}
                    {plan.badge}
                  </div>
                  {billing === 'yearly' && (
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--forest-500)',
                      background: 'var(--forest-50)', padding: '3px 8px',
                      borderRadius: 999, letterSpacing: '0.04em',
                    }}>
                      Save {plan.yearlySavings}
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink-900)', marginBottom: 4 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-500)', marginBottom: 20, lineHeight: 1.4 }}>
                  {plan.tagline}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  {billing === 'monthly' && plan.originalPrice && (
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-400)',
                      textDecoration: 'line-through', textDecorationColor: 'var(--terracotta-400)',
                    }}>{plan.originalPrice}</span>
                  )}
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span style={{ fontSize: 15, color: 'var(--ink-500)' }}>
                    {billing === 'yearly' ? '/yr' : '/mo'}
                  </span>
                </div>

                {billing === 'yearly' && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 4 }}>
                    {plan.yearlyPerMonth}/mo equivalent
                  </div>
                )}

                <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 24 }}>
                  7-day free trial · Cancel anytime
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => startCheckout(plan.key)}
                    disabled={loading === plan.key}
                    style={{
                      width: '100%', padding: '13px 20px', borderRadius: 999, border: 'none',
                      background: plan.highlight ? 'var(--terracotta-400)' : 'var(--forest-500)',
                      color: '#fff', fontSize: 15, fontWeight: 600,
                      cursor: loading === plan.key ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: loading === plan.key ? 0.7 : 1,
                      transition: 'opacity 200ms',
                    }}
                  >
                    {loading === plan.key
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                      : 'Start free trial'
                    }
                  </button>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--ink-400)' }}>
                    <ShieldCheck size={12} /> Secure checkout
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
        }
      `}</style>
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
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -160, right: -120, width: 520, height: 520, background: 'radial-gradient(circle, rgba(224,124,89,0.22) 0%, rgba(224,124,89,0) 70%)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -180, left: -140, width: 460, height: 460, background: 'radial-gradient(circle, rgba(244,208,162,0.16) 0%, rgba(244,208,162,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow color="var(--terracotta-300)">Everything included</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.18, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 20, color: 'var(--cream-100)' }}>
            One price. <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>Every feature.</em> No tiers, no upsells.
          </h2>
        </Reveal>
        <div className="cards-3-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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
    <div className="included-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
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
  { q: 'How does the 7-day free trial work?', a: 'Sign up and get full access to every feature for 7 days. No limits, no lite version. If you cancel before the trial ends, you won\'t be charged — ever.' },
  { q: 'Do I need a credit card to start?', a: 'Yes — we ask for a card up front so your access is uninterrupted if you decide to stay. You can remove it instantly from your account if you cancel.' },
  { q: 'What if I cancel?', a: 'Cancel anytime from your account in two taps. You keep access until the end of the period you\'ve paid for. We don\'t store your card after cancellation.' },
  { q: 'Is there a long-term contract?', a: 'No. Monthly plans are billed month-to-month with no commitments. Yearly plans are billed once per year and save you up to $60 — you can still cancel anytime, and access continues until your paid year ends.' },
  { q: 'Will the price change?', a: 'Your price is locked in as long as your subscription is continuous. If we ever raise prices for new members, your rate stays the same.' },
  { q: 'Do you offer refunds?', a: 'Your 7-day free trial is the refund — we want you to try everything before you pay. Once billed, we don\'t offer mid-cycle refunds, but you can cancel to prevent the next charge.' },
];

function PricingFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section-pad section-pad-v" style={{ padding: '96px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Pricing FAQ</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)' }}>
            Straightforward answers.
          </h2>
        </Reveal>
        <Reveal delay={150} y={16}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {faqItems.map((it, i) => (
              <div key={i} style={{ borderTop: i ? '1px solid var(--ink-100)' : 'none' }}>
                <button className="faq-button" onClick={() => setOpen(open === i ? -1 : i)} style={{
                  width: '100%', textAlign: 'left', padding: '22px 28px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  fontFamily: 'var(--font-body)',
                }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-900)' }}>{it.q}</span>
                  {open === i ? <Minus size={20} color="var(--ink-500)" style={{ flexShrink: 0 }} /> : <Plus size={20} color="var(--ink-500)" style={{ flexShrink: 0 }} />}
                </button>
                {open === i && (
                  <div className="faq-answer" style={{ padding: '0 28px 24px', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-700)' }}>{it.a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
