'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui';
import { openAuth } from './AuthModal';

const foundingFeatures = [
  'Lifetime price lock, never increases',
  'Every current and future feature included',
  'Unlimited chat with your AI gut-health coach',
  'Snap & Know photo logging',
  'AI meal planner with grocery lists',
  'Goal tracker with daily macro targets',
  'Lab report analysis',
  'Priority support',
];

const launchFeatures = [
  'Unlimited chat with your AI gut-health coach',
  'Snap & Know photo logging',
  'AI meal planner with grocery lists',
  'Goal tracker with daily macro targets',
  'Lab report analysis',
  'Standard support',
];

type Billing = 'monthly' | 'annual';

export default function PricingCards() {
  const [billing, setBilling] = useState<Billing>('annual');

  return (
    <>
      <BillingToggle value={billing} onChange={setBilling} />

      <div className="cards-2-grid" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 24, maxWidth: 920, margin: '40px auto 0', alignItems: 'stretch',
      }}>
        <FoundingCard billing={billing} />
        <LaunchCard billing={billing} />
      </div>

      <div style={{
        marginTop: 32, fontSize: 14, color: 'var(--ink-600)',
        textAlign: 'center', lineHeight: 1.7,
        maxWidth: 760, marginLeft: 'auto', marginRight: 'auto',
      }}>
        7-day free trial · Credit card required · Cancel anytime in two taps · Auto-converts to paid after trial · Reminder email at day 5
      </div>
    </>
  );
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (v: Billing) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4,
        background: 'var(--cream-100)', borderRadius: 999,
        border: '1px solid var(--border)',
      }}>
        <ToggleButton active={value === 'monthly'} onClick={() => onChange('monthly')}>Monthly</ToggleButton>
        <ToggleButton active={value === 'annual'} onClick={() => onChange('annual')}>
          Annual
          <span style={{
            marginLeft: 8, padding: '2px 8px', borderRadius: 999,
            background: 'var(--terracotta-50)', color: 'var(--terracotta-700)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          }}>Save 33%</span>
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 999, border: 'none',
      background: active ? '#fff' : 'transparent',
      boxShadow: active ? 'var(--shadow-xs)' : 'none',
      fontSize: 14, fontWeight: 600, color: 'var(--ink-900)',
      fontFamily: 'var(--font-body)',
      cursor: 'pointer', transition: 'all 200ms var(--ease-out)',
      display: 'inline-flex', alignItems: 'center',
    }}>{children}</button>
  );
}

function FoundingCard({ billing }: { billing: Billing }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-2xl)',
      border: '2px solid var(--terracotta-400)', background: '#fff',
      padding: '36px 32px 32px',
      boxShadow: '0 24px 48px -16px rgba(40,30,20,0.18), 0 4px 12px rgba(40,30,20,0.06)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
        padding: '6px 14px', background: 'var(--terracotta-400)', color: '#fff',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        borderRadius: 999, whiteSpace: 'nowrap',
      }}>
        First 200 members only
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-900)', marginBottom: 12 }}>
        Founding Member
      </div>

      <PriceBlock
        price={billing === 'monthly' ? '$13' : '$104'}
        per={billing === 'monthly' ? '/month' : '/year'}
        strikethrough={billing === 'annual' ? '$156' : undefined}
        save={billing === 'annual' ? 'Save $52' : undefined}
        primary
      />
      <div style={{ fontSize: 13, color: 'var(--terracotta-700)', fontWeight: 700, marginTop: 10, marginBottom: 24, letterSpacing: '0.02em' }}>
        Locked for life
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {foundingFeatures.map(f => (
          <div key={f} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--ink-800)', lineHeight: 1.5 }}>
            <Check size={17} color="var(--terracotta-500)" style={{ flexShrink: 0, marginTop: 3 }} />
            {f}
          </div>
        ))}
      </div>

      <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openAuth('signup')}>
        Become a founding member
      </Button>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center' }}>
        Spots filling — limited to first 200 sign-ups
      </div>
    </div>
  );
}

function LaunchCard({ billing }: { billing: Billing }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border)',
      background: '#fff', padding: '36px 32px 32px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-900)', marginBottom: 12 }}>
        Launch
      </div>

      <PriceBlock
        price={billing === 'monthly' ? '$20' : '$160'}
        per={billing === 'monthly' ? '/month' : '/year'}
        strikethrough={billing === 'annual' ? '$240' : undefined}
        save={billing === 'annual' ? 'Save $80' : undefined}
      />
      <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 10, marginBottom: 24 }}>
        Standard pricing after founding cap
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {launchFeatures.map(f => (
          <div key={f} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--ink-800)', lineHeight: 1.5 }}>
            <Check size={17} color="var(--forest-400)" style={{ flexShrink: 0, marginTop: 3 }} />
            {f}
          </div>
        ))}
      </div>

      <Button variant="secondary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openAuth('signup')}>
        Start 7-day free trial
      </Button>
    </div>
  );
}

function PriceBlock({ price, per, strikethrough, save, primary }: {
  price: string; per: string; strikethrough?: string; save?: string; primary?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 400,
          color: 'var(--ink-900)', letterSpacing: '-0.025em', lineHeight: 1,
        }}>{price}</span>
        <span style={{ fontSize: 17, color: 'var(--ink-600)' }}>{per}</span>
      </div>
      {strikethrough && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 15, color: 'var(--ink-500)', textDecoration: 'line-through' }}>{strikethrough}</span>
          {save && (
            <span style={{
              padding: '3px 9px', borderRadius: 999,
              background: primary ? 'var(--terracotta-50)' : 'var(--forest-50)',
              color: primary ? 'var(--terracotta-700)' : 'var(--forest-400)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
            }}>{save}</span>
          )}
        </div>
      )}
    </div>
  );
}
