import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { cookies } from 'next/headers'
import { buildAdminEmailHtml } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')?.value
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (!adminPassword || sessionCookie !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { to, subject, body, ctaLabel, ctaUrl } = await request.json()
  if (!Array.isArray(to) || to.length === 0 || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const html = buildAdminEmailHtml({ subject, body, ctaLabel, ctaUrl })

  const results = await Promise.allSettled(
    to.map((email: string) =>
      resend.emails.send({
        from: 'GutHub <hello@guthub.ai>',
        to: email.trim(),
        subject: subject.trim(),
        html,
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ sent, failed })
}
