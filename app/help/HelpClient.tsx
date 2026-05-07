'use client'

import { useState, FormEvent } from 'react'
import { MessageCircle, Book, CreditCard, Shield, Zap, ChevronRight, Send, CheckCircle } from 'lucide-react'

const TOPICS = [
  'Technical issue',
  'Billing question',
  'Account & data',
  'Coach or meal plan',
  'Feature request',
  'Other',
]

const FAQ = [
  {
    icon: Zap,
    q: 'Why isn\'t the Coach responding?',
    a: 'Check your internet connection. If the issue persists, try starting a new conversation thread from the Coach page. Our AI coach runs on GPT and occasionally has brief outages.',
  },
  {
    icon: CreditCard,
    q: 'How do I update my billing or cancel?',
    a: 'Go to Settings → Subscription and click "Manage billing". This opens the Stripe customer portal where you can update your card, switch plans, or cancel anytime.',
  },
  {
    icon: Book,
    q: 'Can I export my health data?',
    a: 'Yes. Go to Settings → Privacy & data and click "Export all data". We\'ll email you a full download link within 24 hours.',
  },
  {
    icon: Shield,
    q: 'Is my health data private?',
    a: 'Absolutely. All data is encrypted at rest and in transit. We never sell or share your personal health data. See our Privacy Policy for details.',
  },
]

export default function HelpClient({
  userName,
  userEmail,
}: {
  userName: string | null
  userEmail: string
}) {
  const [name, setName]       = useState(userName ?? '')
  const [email, setEmail]     = useState(userEmail)
  const [topic, setTopic]     = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError('')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, topic, message }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
    } else {
      setError('Something went wrong. Please email support@guthub.ai directly.')
    }
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
          Support
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
          How can we <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>help?</em>
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)', lineHeight: 1.6 }}>
          We read every message and aim to reply within 1–2 business days.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32, alignItems: 'start' }}>
        {/* Contact form */}
        <div>
          {sent ? (
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <CheckCircle size={26} color="#16a34a" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 8px' }}>
                Message sent!
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 24px', lineHeight: 1.6 }}>
                We'll get back to you at <strong>{email}</strong> within 1–2 business days.
              </p>
              <button
                onClick={() => { setSent(false); setMessage('') }}
                style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--cream-200)', background: '#fff', fontSize: 14, fontWeight: 600, color: 'var(--ink-600)', cursor: 'pointer' }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 20, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={17} color="var(--terracotta-500)" /> Contact support
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Your name">
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Email">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Topic">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      style={{
                        padding: '6px 13px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        border: `1px solid ${topic === t ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
                        background: topic === t ? 'var(--terracotta-50)' : 'var(--cream-50)',
                        color: topic === t ? 'var(--terracotta-600)' : 'var(--ink-600)',
                        fontWeight: topic === t ? 600 : 400,
                        transition: 'all 120ms',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Message">
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe what's happening or what you need help with…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 130, fontFamily: 'var(--font-body)' }}
                />
              </FormField>

              {error && (
                <p style={{ margin: 0, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !message.trim()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: (!message.trim()) ? 'var(--cream-200)' : 'var(--terracotta-500)',
                  color: (!message.trim()) ? 'var(--ink-400)' : '#fff',
                  fontSize: 15, fontWeight: 600, cursor: (!message.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background 150ms',
                }}
              >
                <Send size={15} />
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        {/* Right: FAQ + quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* FAQ */}
          <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--cream-100)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>Common questions</h3>
            </div>
            {FAQ.map((item, i) => {
              const Icon = item.icon
              const isOpen = openFaq === i
              return (
                <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '14px 20px', border: 'none', background: isOpen ? 'var(--cream-50)' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon size={14} color="var(--forest-500)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.4 }}>{item.q}</div>
                      {isOpen && (
                        <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6, marginTop: 8 }}>{item.a}</div>
                      )}
                    </div>
                    <ChevronRight size={14} color="var(--ink-400)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', marginTop: 4 }} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Direct contact */}
          <div style={{ background: 'var(--forest-500)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Direct email
            </div>
            <div style={{ fontSize: 15, color: '#fff', marginBottom: 4 }}>
              <a href="mailto:support@guthub.ai" style={{ color: '#fcd9c0', fontWeight: 600, textDecoration: 'none' }}>
                support@guthub.ai
              </a>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              For billing, privacy or data requests.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)' }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 9,
  border: '1px solid var(--cream-200)',
  background: '#fff',
  fontSize: 14,
  color: 'var(--ink-800)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
}
