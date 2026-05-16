import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { Resend } from 'resend'
import { buildAdminEmailHtml } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GutHub <hello@guthub.ai>'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function verifySignature(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET
  if (!secret) return true

  const webhookId = req.headers.get('webhook-id')
  const webhookTimestamp = req.headers.get('webhook-timestamp')
  const webhookSignature = req.headers.get('webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false

  // Secret format: "v1,whsec_<base64>"
  const secretBase64 = secret.replace(/^v1,whsec_/, '')
  const secretBytes = Buffer.from(secretBase64, 'base64')

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const hmac = createHmac('sha256', secretBytes)
  hmac.update(signedContent)
  const computed = `v1,${hmac.digest('base64')}`

  // Header may contain multiple space-separated signatures
  return webhookSignature.split(' ').some(sig => sig === computed)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verifySignature(rawBody, req)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const { user, email_data } = payload ?? {}
  if (!user?.email || !email_data) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { email_action_type, token_hash, redirect_to } = email_data
  const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to ?? '')}`

  let subject = ''
  let body = ''
  let ctaLabel = ''

  if (email_action_type === 'recovery') {
    subject = 'Reset your GutHub password'
    body = `We received a request to reset the password for your GutHub account.\n\nClick the button below to choose a new password. This link expires in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`
    ctaLabel = 'Reset Password'
  } else if (email_action_type === 'signup') {
    subject = 'Confirm your GutHub email'
    body = `Welcome to GutHub! Please confirm your email address to activate your account.`
    ctaLabel = 'Confirm Email'
  } else if (email_action_type === 'email_change') {
    subject = 'Confirm your new email address'
    body = `You requested an email change for your GutHub account. Click below to confirm your new email address.`
    ctaLabel = 'Confirm New Email'
  } else if (email_action_type === 'magiclink') {
    subject = 'Your GutHub sign-in link'
    body = `Click the button below to sign in to GutHub. This link expires in 1 hour.`
    ctaLabel = 'Sign In to GutHub'
  } else {
    return NextResponse.json({ message: 'Unhandled type' }, { status: 200 })
  }

  const html = buildAdminEmailHtml({ subject, body, ctaLabel, ctaUrl: verifyUrl })

  const { error } = await resend.emails.send({ from: FROM, to: user.email, subject, html })
  if (error) {
    console.error('[auth/send-email] Resend error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Email sent' })
}
