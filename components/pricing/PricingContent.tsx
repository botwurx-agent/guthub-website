'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';
import PricingCards from '../PricingCards';

export default function PricingContent() {
  return (
    <>
      <PricingMain />
      <TrialFAQ />
    </>
  );
}

function PricingMain() {
  return (
    <section className="section-pad" style={{ padding: '88px 32px 96px', background: 'var(--cream-50)' }}>
      <Reveal style={{ maxWidth: 760, margin: '0 auto 48px', textAlign: 'center' }}>
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="h1-mobile" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1.18, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 22, color: 'var(--ink-900)',
        }}>
          Start with <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>7 days free.</em> Keep what works.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--ink-700)', maxWidth: 640, margin: '0 auto' }}>
          Full access for 7 days. Cancel anytime in two taps. Founding member pricing locked for life, while spots last.
        </p>
      </Reveal>

      <Reveal delay={120} y={20} style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <PricingCards />
      </Reveal>
    </section>
  );
}

const trialFaqItems = [
  { q: 'Why do you require a credit card?', a: "It keeps signups serious and lets us offer 7 full days of access without limits. You won't be charged a cent during the trial, and we'll send a reminder before your trial ends." },
  { q: 'When am I charged?', a: "At the end of your 7-day trial, your selected plan starts automatically. You'll get an email reminder on day 5 so there are no surprises." },
  { q: 'How do I cancel?', a: "Two taps from your account settings. No phone calls, no retention offers, no dark patterns. Cancel during your trial and you won't be charged at all." },
  { q: 'What happens if the founding member spots fill up before I sign up?', a: 'Once 200 spots are taken, founding pricing closes permanently. New members will join at $20/month. Existing founding members keep their $13/month rate for life.' },
  { q: 'Can I switch between monthly and annual later?', a: 'Yes, anytime. If you switch from monthly to annual, you get the 33% discount immediately. If you cancel an annual plan, you keep access until your year ends.' },
  { q: 'What\'s included in "every future feature"?', a: 'Founding members get lifetime access to everything we build. New tools, expanded integrations, anything we add to Guthub at no extra cost. Standard members may pay separately for major future feature releases.' },
];

function TrialFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section-pad section-pad-v" style={{ padding: '96px 32px', background: 'var(--cream-100)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>How the trial works</Eyebrow>
          <h2 className="h2-mobile" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 18, color: 'var(--ink-900)',
          }}>
            Straightforward answers.
          </h2>
        </Reveal>
        <Reveal delay={150} y={16}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {trialFaqItems.map((it, i) => (
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
