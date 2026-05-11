import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import SubscribeClient from './SubscribeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscribe — GutHub',
  description: 'Start your 7-day free trial. Cancel anytime.',
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
  const planKey = (plan ?? 'launch') as keyof typeof PLANS

  if (!PLANS[planKey]) redirect('/pricing')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=signin')

  // Check already subscribed
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_customer_id, name')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_status === 'active') redirect('/dashboard')

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  // Create SetupIntent to collect card for future billing
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    metadata: { supabase_user_id: user.id, plan: planKey },
  })

  const selectedPlan = PLANS[planKey]
  const priceDisplay = `$${(selectedPlan.amount / 100).toFixed(0)}/mo`

  return (
    <SubscribeClient
      clientSecret={setupIntent.client_secret!}
      plan={planKey}
      planName={selectedPlan.name}
      planPrice={priceDisplay}
      userName={profile?.name ?? ''}
      userEmail={user.email ?? ''}
    />
  )
}
