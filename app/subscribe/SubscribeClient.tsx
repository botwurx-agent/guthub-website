'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#22432E',
    colorBackground: '#ffffff',
    colorText: '#1B1A17',
    colorDanger: '#C85A44',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '10px',
    spacingUnit: '5px',
  },
  rules: {
    '.Input': {
      border: '1.5px solid #E0DCD2',
      boxShadow: 'none',
      padding: '12px 14px',
      fontSize: '15px',
    },
    '.Input:focus': {
      border: '1.5px solid #22432E',
      boxShadow: '0 0 0 3px rgba(34,67,46,0.1)',
    },
    '.Label': {
      fontSize: '13px',
      fontWeight: '600',
      color: '#5A564D',
      marginBottom: '6px',
    },
  },
}

function CheckoutForm({
  plan,
  planName,
  planPrice,
  userEmail,
}: {
  plan: string
  planName: string
  planPrice: string
  userEmail: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    // Confirm the SetupIntent to save the card
    const { error: setupError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.origin + '/onboarding' },
      redirect: 'if_required',
    })

    if (setupError) {
      setError(setupError.message ?? 'Something went wrong. Please try again.')
      setProcessing(false)
      return
    }

    // Create the subscription with the confirmed payment method
    const pmId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id

    if (!pmId) {
      setError('Could not retrieve payment method. Please try again.')
      setProcessing(false)
      return
    }

    const res = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: pmId, plan }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? 'Subscription creation failed. Please try again.')
      setProcessing(false)
      return
    }

    setSucceeded(true)
    setTimeout(() => router.push(data.needsOnboarding ? '/onboarding' : '/dashboard?checkout=success'), 1500)
  }

  if (succeeded) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <CheckCircle2 size={48} color="#22432E" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: '#1B1A17', margin: '0 0 8px' }}>
          You&apos;re all set!
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#5A564D' }}>
          Taking you to your dashboard…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { email: 'never' } },
          defaultValues: { billingDetails: { email: userEmail } },
        }}
      />

      {error && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#FFF0EE',
          border: '1px solid #EEB3A0',
          borderRadius: 8,
          fontSize: 13,
          color: '#C85A44',
          fontFamily: 'var(--font-body)',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '16px',
          background: processing ? '#6F9477' : '#22432E',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'background 200ms',
          letterSpacing: '0.01em',
        }}
      >
        {processing ? 'Processing…' : `Start 7-day free trial`}
      </button>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#9D978A', fontSize: 12, fontFamily: 'var(--font-body)' }}>
        <Lock size={12} />
        Secured by Stripe · No charge until after your trial
      </div>
    </form>
  )
}

export default function SubscribeClient({
  clientSecret,
  plan,
  planName,
  planPrice,
  userName,
  userEmail,
}: {
  clientSecret: string
  plan: string
  planName: string
  planPrice: string
  userName: string
  userEmail: string
}) {
  const firstName = userName.split(' ')[0] || null

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF3', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid #E0DCD2', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A7468', fontFamily: 'var(--font-body)' }}>
          <ShieldCheck size={14} color="#22432E" />
          Secure checkout
        </div>
      </header>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 40,
        padding: '52px 24px',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>

        {/* Left — order summary */}
        <div style={{ flex: '0 0 340px', maxWidth: 340 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C85A44', fontFamily: 'var(--font-body)' }}>
            {firstName ? `Hi ${firstName} —` : ''} You chose
          </p>
          <h1 style={{ margin: '0 0 24px', fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, color: '#1B1A17', lineHeight: 1.2 }}>
            GutHub {planName}
          </h1>

          {/* Trial callout */}
          <div style={{ background: '#22432E', borderRadius: 12, padding: '20px 22px', marginBottom: 24, color: '#FDFAF3' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9C1AE', fontFamily: 'var(--font-body)' }}>
              7-day free trial
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
              $0.00 today
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#D5E0D8', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              Then {planPrice} per month after your trial ends. Cancel anytime before then and you won&apos;t be charged.
            </p>
          </div>

          {/* Feature list */}
          {[
            'AI gut health coach with full context',
            'Personalised meal planner',
            'Symptom & food logging',
            'Gut score tracking & insights',
            'Photo macro recognition',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <CheckCircle2 size={16} color="#22432E" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 14, color: '#5A564D', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Right — payment form */}
        <div style={{
          flex: '1 1 420px',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E0DCD2',
          padding: '36px 36px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: '#1B1A17' }}>
            Payment details
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#9D978A', fontFamily: 'var(--font-body)' }}>
            Your card won&apos;t be charged until after your 7-day trial.
          </p>

          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm
              plan={plan}
              planName={planName}
              planPrice={planPrice}
              userEmail={userEmail}
            />
          </Elements>
        </div>
      </div>
    </div>
  )
}
