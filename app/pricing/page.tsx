import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import PricingContent from '@/components/pricing/PricingContent';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | GutHub',
  description: 'Try it free for 7 days. $13/month for founding members. Cancel anytime.',
};

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://guthub-website.vercel.app'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  if (reason === 'subscription_required') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, trial_ends_at, trial_expired_email_sent, subscription_status')
        .eq('id', user.id)
        .single()

      const trialEnded = profile?.trial_ends_at && new Date(profile.trial_ends_at) < new Date()
      const notPaid = profile?.subscription_status !== 'active'

      if (trialEnded && notPaid && !profile?.trial_expired_email_sent && user.email) {
        const firstName = (profile?.name ?? '').split(' ')[0] || 'there'

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
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C85A44;">Your trial has ended</p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#1B1A17;line-height:1.25;">Don't lose your progress, ${firstName}.</h1>
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">
              Your 7-day free trial has ended. Your logs, coach history, meal plans, and gut score data are all still there. You'll need an active subscription to access them.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#1B1A17;">What you'll keep access to:</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#5A564D;">✓ &nbsp;All your logged meals, symptoms, and weight data</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#5A564D;">✓ &nbsp;Your AI coach conversation history</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#5A564D;">✓ &nbsp;Your personalised meal plans</p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#5A564D;">✓ &nbsp;Your gut score trends and insights</p>
              </td></tr>
            </table>
            <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">
              Subscribe now to pick up exactly where you left off.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr><td align="center">
                <a href="${APP_URL}/subscribe" style="display:inline-block;background:#DB6F56;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:0.02em;">Keep my access →</a>
              </td></tr>
            </table>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#7A7468;">
              Plans start at $13/month with a founding member rate available. Cancel anytime. Questions? Just reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF5EE;border-radius:0 0 16px 16px;border:1px solid #E0DCD2;border-top:none;padding:28px 48px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#9D978A;">GutHub · AI-powered gut health companion</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#C2BDB1;">You're receiving this because your GutHub trial has ended.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

        resend.emails.send({
          from: 'GutHub <hello@guthub.ai>',
          to: user.email,
          subject: `Your GutHub trial has ended. Your data is waiting`,
          html,
        }).catch(() => {})

        const service = await createServiceClient()
        await service.from('profiles').update({ trial_expired_email_sent: true }).eq('id', user.id)
      }
    }
  }

  return (
    <>
      <Header />
      <main>
        <PricingContent />
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
