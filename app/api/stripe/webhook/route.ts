import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://guthub-website.vercel.app'

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

      // Send conversion confirmation email
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
      const email = authUser?.user?.email
      if (email) {
        const firstName = (profile?.name ?? '').split(' ')[0] || 'there'
        const planLabel = plan === 'founding' ? 'Founding Member' : plan === 'launch' ? 'Launch' : 'Standard'
        const renewDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFAF3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#22432E;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
            <img src="${APP_URL}/logo-dark.png" alt="GutHub" width="140" height="36" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;padding:48px;border-left:1px solid #E0DCD2;border-right:1px solid #E0DCD2;">
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C85A44;">You're all set</p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#1B1A17;line-height:1.25;">Welcome aboard, ${firstName}.</h1>
            <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">
              Your GutHub subscription is confirmed. You have full access to everything — your AI coach, meal planner, insights, and all your logged data.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
              <tr><td>
                <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A7468;">Subscription details</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><strong>Plan:</strong> <span style="color:#5A564D;">${planLabel}</span></p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><strong>Trial ends:</strong> <span style="color:#5A564D;">${renewDate}</span></p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><strong>Billing:</strong> <span style="color:#5A564D;">Monthly, starting after your trial. Cancel anytime in Settings.</span></p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr><td align="center">
                <a href="${APP_URL}/dashboard" style="display:inline-block;background:#DB6F56;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:0.02em;">Go to my dashboard →</a>
              </td></tr>
            </table>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#7A7468;">
              To manage your subscription, visit Settings → Billing at any time. Questions? Just reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF5EE;border-radius:0 0 16px 16px;border:1px solid #E0DCD2;border-top:none;padding:28px 48px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#9D978A;">GutHub · AI-powered gut health companion</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#C2BDB1;">You're receiving this because you subscribed to GutHub.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

        resend.emails.send({
          from: 'GutHub <onboarding@resend.dev>',
          to: email,
          subject: `You're subscribed to GutHub — welcome aboard`,
          html,
        }).catch(() => {})
      }
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
