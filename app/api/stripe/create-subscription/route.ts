import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, type PlanKey, type BillingInterval } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentMethodId, plan, billing = 'monthly' } = await request.json() as {
    paymentMethodId: string
    plan: PlanKey
    billing?: BillingInterval
  }
  if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, name, onboarding_completed')
    .eq('id', user.id)
    .single()

  // Check founding member cap (applies to both monthly and yearly)
  if (plan === 'founding') {
    const { data: counter } = await supabase
      .from('founding_counter')
      .select('count, cap')
      .eq('id', 1)
      .single()
    if (counter && counter.count >= counter.cap) {
      return NextResponse.json({ error: 'Founding member spots are full.' }, { status: 400 })
    }
  }

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  // Attach payment method to customer and set as default
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  const priceId = billing === 'yearly' ? PLANS[plan].yearlyPriceId : PLANS[plan].priceId

  // Create subscription with 7-day trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 7,
    default_payment_method: paymentMethodId,
    metadata: { supabase_user_id: user.id, plan, billing },
  })

  return NextResponse.json({
    subscriptionId: subscription.id,
    status: subscription.status,
    needsOnboarding: !profile?.onboarding_completed,
  })
}
