import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan as string | undefined
      if (!userId) break

      // Increment founding counter if applicable
      if (plan === 'founding') {
        await supabase.rpc('increment_founding_counter')
      }

      await supabase.from('profiles').update({
        subscription_status: 'trialing',
        subscription_plan: plan ?? null,
        stripe_subscription_id: session.subscription as string,
        trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const status = mapStripeStatus(sub.status)
      await supabase.from('profiles').update({
        subscription_status: status,
        stripe_subscription_id: sub.id,
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'canceled',
        stripe_subscription_id: null,
      }).eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'trialing':   return 'trialing'
    case 'active':     return 'active'
    case 'past_due':   return 'past_due'
    case 'canceled':   return 'canceled'
    case 'incomplete': return 'incomplete'
    default:           return 'canceled'
  }
}
