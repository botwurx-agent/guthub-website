'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Send, Eye, Pencil, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { buildAdminEmailHtml } from '@/lib/email-templates'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function Chip({ email, onRemove }: { email: string; onRemove: () => void }) {
  const valid = isValidEmail(email)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px 3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500,
      background: valid ? 'var(--forest-100, #eef3ef)' : 'rgba(180,66,44,0.1)',
      color: valid ? 'var(--forest-600, #22432e)' : 'var(--error, #b4422c)',
      border: `1px solid ${valid ? 'var(--forest-200, #c5d6c7)' : 'rgba(180,66,44,0.25)'}`,
    }}>
      {email}
      <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', lineHeight: 1 }}>
        <X size={12} />
      </button>
    </span>
  )
}

export default function EmailComposerClient() {
  const [recipients, setRecipients]   = useState<string[]>([])
  const [inputVal, setInputVal]       = useState('')
  const [subject, setSubject]         = useState('')
  const [body, setBody]               = useState('')
  const [ctaOpen, setCtaOpen]         = useState(false)
  const [ctaLabel, setCtaLabel]       = useState('')
  const [ctaUrl, setCtaUrl]           = useState('')
  const [tab, setTab]                 = useState<'write' | 'preview'>('write')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<{ sent: number; failed: number } | null>(null)
  const [error, setError]             = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addRecipient(raw: string) {
    const email = raw.trim().replace(/,+$/, '')
    if (email && !recipients.includes(email)) {
      setRecipients(prev => [...prev, email])
    }
    setInputVal('')
  }

  function handleToKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault()
      if (inputVal.trim()) addRecipient(inputVal)
    } else if (e.key === 'Backspace' && !inputVal && recipients.length > 0) {
      setRecipients(prev => prev.slice(0, -1))
    }
  }

  async function handleSend() {
    const invalidEmails = recipients.filter(e => !isValidEmail(e))
    if (invalidEmails.length) {
      setError(`Fix invalid email(s): ${invalidEmails.join(', ')}`)
      return
    }
    if (!recipients.length) { setError('Add at least one recipient.'); return }
    if (!subject.trim())    { setError('Subject is required.'); return }
    if (!body.trim())       { setError('Message body is required.'); return }

    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject, body, ctaLabel: ctaLabel || undefined, ctaUrl: ctaUrl || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setResult(data)
      if (data.failed === 0) {
        setRecipients([]); setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
        setCtaOpen(false); setTab('write')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const previewHtml = buildAdminEmailHtml({ subject: subject || '(no subject)', body: body || '(no body)', ctaLabel: ctaLabel || undefined, ctaUrl: ctaUrl || undefined })
  const allValid = recipients.length > 0 && recipients.every(isValidEmail) && subject.trim() && body.trim()

  const inputStyle = {
    padding: '10px 14px', background: '#fff',
    border: '1px solid var(--border, #e5e0da)',
    borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-body)',
    color: 'var(--ink-900)', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)' }}>Admin</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '4px 0 4px', color: 'var(--ink-900)' }}>Send email</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>Compose and send a branded email to any address. Uses the same design as your transactional emails.</p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, overflow: 'hidden' }}>

        {/* To field */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--cream-100)' }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 8 }}>To</label>
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
              padding: '8px 12px', border: '1px solid var(--border, #e5e0da)',
              borderRadius: 10, background: '#fff', cursor: 'text', minHeight: 44,
            }}
          >
            {recipients.map(email => (
              <Chip key={email} email={email} onRemove={() => setRecipients(prev => prev.filter(e => e !== email))} />
            ))}
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleToKeyDown}
              onBlur={() => { if (inputVal.trim()) addRecipient(inputVal) }}
              placeholder={recipients.length === 0 ? 'Type an email and press Enter…' : ''}
              style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink-900)', background: 'transparent', flex: 1, minWidth: 180 }}
            />
          </div>
          {recipients.length > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-400)' }}>
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} · each gets a separate email
            </p>
          )}
        </div>

        {/* Subject */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--cream-100)' }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 8 }}>Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Your subject line…"
            style={inputStyle}
          />
        </div>

        {/* Body — Write / Preview tabs */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--cream-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)' }}>Message</label>
            <div style={{ display: 'flex', gap: 2, background: 'var(--cream-100)', borderRadius: 8, padding: 2 }}>
              {(['write', 'preview'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTab(t)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 120ms', fontFamily: 'var(--font-body)',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--ink-800)' : 'var(--ink-400)',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {t === 'write' ? <Pencil size={12} /> : <Eye size={12} />}
                  {t === 'write' ? 'Write' : 'Preview'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'write' ? (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder={"Write your message here…\n\nSeparate paragraphs with a blank line. They'll be styled automatically in the email."}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          ) : (
            <div style={{ border: '1px solid var(--border, #e5e0da)', borderRadius: 10, overflow: 'hidden', height: 480 }}>
              <iframe
                srcDoc={previewHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Email preview"
              />
            </div>
          )}
        </div>

        {/* CTA button (optional) */}
        <div style={{ borderBottom: '1px solid var(--cream-100)' }}>
          <button
            type="button"
            onClick={() => setCtaOpen(v => !v)}
            style={{
              width: '100%', padding: '14px 22px', background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>
              CTA button <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>(optional)</span>
            </span>
            {ctaOpen ? <ChevronUp size={15} color="var(--ink-400)" /> : <ChevronDown size={15} color="var(--ink-400)" />}
          </button>
          {ctaOpen && (
            <div style={{ padding: '0 22px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>Button label</label>
                <input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Go to dashboard" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>URL</label>
                <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://app.guthub.ai/…" style={inputStyle} />
              </div>
            </div>
          )}
        </div>

        {/* Footer — feedback + send */}
        <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--cream-50)' }}>
          <div style={{ flex: 1 }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--error, #b4422c)' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: result.failed === 0 ? 'var(--forest-500)' : 'var(--error)' }}>
                <CheckCircle size={14} />
                {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ' successfully'}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !allValid}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 999, border: 'none',
              background: loading || !allValid ? 'var(--ink-300)' : 'var(--terracotta-400)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading || !allValid ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', transition: 'background 200ms',
              opacity: !allValid && !loading ? 0.6 : 1,
            }}
          >
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : <><Send size={15} /> Send {recipients.length > 0 ? `to ${recipients.length}` : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
