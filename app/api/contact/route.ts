import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, topic, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: 'GutHub Support <support@guthub.ai>',
    to: ['support@guthub.ai'],
    replyTo: email,
    subject: `[${topic}] from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
