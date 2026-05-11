import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// TEMPORARY — delete after confirming welcome email design
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to GutHub</title></head>
<body style="margin:0;padding:0;background:#FDFAF3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#22432E;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#FDFAF3;letter-spacing:-0.5px;">GutHub</p>
            <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#6F9477;">AI Gut Health Companion</p>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;padding:48px;border-left:1px solid #E0DCD2;border-right:1px solid #E0DCD2;">
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C85A44;">Welcome</p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#1B1A17;line-height:1.25;">Hi Steven, your gut health journey starts now.</h1>
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">
              You've completed your profile and your 7-day free trial is now active. We've calculated your personalised macro targets and your AI coach is ready to help.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A7468;">Your goals</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#1B1A17;">Reduce bloating, Improve digestion, Increase energy</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A564D;">Here's what to explore first:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #EFEBE2;"><p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Log</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Track meals, symptoms, water and weight in seconds.</span></p></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #EFEBE2;"><p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">AI Coach</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Ask anything about your gut, food, or symptoms — it knows your profile.</span></p></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #EFEBE2;"><p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Meal Planner</span> &nbsp;—&nbsp; <span style="color:#5A564D;">Generate a personalised gut-friendly week of meals.</span></p></td></tr>
              <tr><td style="padding:12px 0;"><p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1B1A17;"><span style="color:#22432E;font-weight:700;">Insights</span> &nbsp;—&nbsp; <span style="color:#5A564D;">See trends, identify food triggers, track your gut score over time.</span></p></td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr><td align="center"><a href="https://guthub-website.vercel.app/dashboard" style="display:inline-block;background:#DB6F56;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:0.02em;">Go to my dashboard →</a></td></tr>
            </table>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#7A7468;">Your trial runs for 7 days. If you have any questions, just reply to this email — we read every one.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF5EE;border-radius:0 0 16px 16px;border:1px solid #E0DCD2;border-top:none;padding:28px 48px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#9D978A;">GutHub · AI-powered gut health companion</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#C2BDB1;">You're receiving this because you created a GutHub account.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from: 'GutHub <onboarding@resend.dev>',
    to: ['stevenazari1@gmail.com'],
    subject: 'Welcome to GutHub, Steven — your 7-day trial has started',
    html,
  })

  if (error) return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id })
}
