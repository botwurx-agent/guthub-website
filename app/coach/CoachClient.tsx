'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Paperclip, X, Loader2, Plus, Sparkles, Utensils, FlaskConical, ChefHat, Moon, ShoppingCart, Frown } from 'lucide-react'
import { startNewThread, getThreadMessages } from '@/app/actions/coach'

type Message = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  has_image?: boolean
}

type Thread = {
  id: string
  title: string
  updated_at: string
}

const SUGGESTIONS = [
  { title: 'Why am I bloated after lunch?', sub: 'Look at the last 7 days for patterns', icon: Frown },
  { title: 'Plan my week (low-FODMAP)', sub: 'A 7-day plan based on my profile', icon: Utensils },
  { title: 'Explain my latest lab result', sub: 'Uploaded report in plain English', icon: FlaskConical },
  { title: 'What should I eat tonight?', sub: 'Quick dinner — under 30 minutes', icon: ChefHat },
  { title: 'How do I reduce reflux at night?', sub: 'Practical, evidence-based tips', icon: Moon },
  { title: 'Make me a grocery list', sub: 'For the next 7 days of meals', icon: ShoppingCart },
]

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CoachClient({
  initialThreadId, initialMessages, initialThreads, firstName,
}: {
  initialThreadId: string | null
  initialMessages: Message[]
  initialThreads: Thread[]
  firstName: string
}) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [image, setImage] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [header, base64] = result.split(',')
      const type = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
      setImage({ base64, type, preview: result })
    }
    reader.readAsDataURL(file)
  }

  async function send(overrideText?: string) {
    const text = overrideText ?? input
    if ((!text.trim() && !image) || streaming) return
    setInput('')
    setError(null)

    const optimisticMsg: Message = { role: 'user', content: text.trim() || '[Image attached]', has_image: !!image }
    setMessages(prev => [...prev, optimisticMsg])

    const imgPayload = image ? { imageBase64: image.base64, imageType: image.type } : {}
    setImage(null)
    setStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), threadId, ...imgPayload }),
      })
      if (!res.ok) throw new Error('Request failed')
      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.delta) { accumulated += payload.delta; setStreamingText(accumulated) }
            if (payload.threadId && !threadId) setThreadId(payload.threadId)
            if (payload.done) {
              setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
              setStreamingText('')
            }
            if (payload.error) setError(payload.error)
          } catch {}
        }
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setStreaming(false)
      setStreamingText('')
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function handleNewThread() {
    startTransition(async () => {
      const thread = await startNewThread()
      if (thread) {
        setThreadId(thread.id)
        setMessages([])
        setStreamingText('')
        setThreads(prev => [thread, ...prev])
        inputRef.current?.focus()
      }
    })
  }

  async function switchThread(id: string) {
    if (id === threadId || streaming) return
    setThreadId(id)
    setMessages([])
    setStreamingText('')
    const msgs = await getThreadMessages(id)
    setMessages(msgs)
  }

  const isEmpty = messages.length === 0 && !streamingText

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--cream-50)' }}>

      {/* ── Threads sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#fff', borderRight: '1px solid var(--cream-200)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 14px 12px' }}>
          <button onClick={handleNewThread} disabled={isPending} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 10, border: 'none',
            background: 'var(--terracotta-400)', color: '#fff',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'opacity 160ms',
            opacity: isPending ? 0.6 : 1,
          }}>
            <Plus size={14} /> New conversation
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-400)', padding: '8px 6px 6px' }}>
            Recent
          </div>
          {threads.map(t => (
            <button key={t.id} onClick={() => switchThread(t.id)} style={{
              width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
              border: t.id === threadId ? '1px solid var(--cream-200)' : '1px solid transparent',
              background: t.id === threadId ? 'var(--cream-100)' : 'transparent',
              cursor: 'pointer', transition: 'all 140ms', marginBottom: 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>
                {relativeTime(t.updated_at)}
              </div>
            </button>
          ))}
          {threads.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-400)', padding: '8px 6px' }}>No conversations yet</div>
          )}

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-400)', padding: '20px 6px 6px' }}>
            Saved by Coach
          </div>
          {[
            { title: 'Your trigger food summary', sub: 'Living document · updated weekly' },
            { title: 'Your first 30 days', sub: 'Auto-generated recap' },
          ].map(item => (
            <div key={item.title} style={{
              padding: '9px 10px', borderRadius: 8, cursor: 'default', marginBottom: 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Messages scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 8px' }}>
          {isEmpty ? (
            <EmptyChat firstName={firstName} onSuggest={text => { setInput(text); send(text) }} />
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} message={msg} firstName={firstName} />)}
              {streamingText && <MessageBubble message={{ role: 'assistant', content: streamingText }} firstName={firstName} streaming />}
              {streaming && !streamingText && <ThinkingBubble />}
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                  background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
                  fontSize: 13, color: '#b4422c',
                }}>{error}</div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Image preview */}
        {image && (
          <div style={{
            padding: '8px 32px 0', display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--cream-100)', borderTop: '1px solid var(--cream-200)',
          }}>
            <img src={image.preview} alt="Attached" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Image attached</span>
            <button onClick={() => setImage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-500)' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '12px 32px 16px', background: 'var(--cream-50)', borderTop: '1px solid var(--cream-200)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: '#fff', borderRadius: 16,
            border: '1.5px solid var(--cream-200)',
            padding: '8px 8px 8px 16px',
            boxShadow: '0 2px 8px rgba(31,45,42,0.05)',
            transition: 'border-color 160ms',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your gut, food, or symptoms…"
              rows={1}
              disabled={streaming}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, fontFamily: 'var(--font-body)', color: 'var(--ink-900)',
                background: 'transparent', lineHeight: 1.5, maxHeight: 120,
                overflowY: 'auto',
              }}
            />
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach meal photo or lab" style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: 'var(--cream-100)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-500)',
              }}>
                <Paperclip size={16} />
              </button>
              <button onClick={() => send()} disabled={streaming || (!input.trim() && !image)} style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: (streaming || (!input.trim() && !image)) ? 'var(--ink-200)' : 'var(--terracotta-400)',
                cursor: (streaming || (!input.trim() && !image)) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', transition: 'background 160ms',
              }}>
                {streaming ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'center', margin: '8px 0 0' }}>
            Coach knows your intake, meals, symptoms, and labs. · Not medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Empty / welcome state ────────────────────────────────────────────────────
function EmptyChat({ firstName, onSuggest }: { firstName: string; onSuggest: (text: string) => void }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--forest-500)', color: 'var(--cream-100)',
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={28} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400,
          letterSpacing: '-0.02em', margin: '0 0 10px', color: 'var(--ink-900)',
        }}>
          Hi <em style={{ color: 'var(--terracotta-500)' }}>{firstName}</em>. What can I help with?
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-500)', maxWidth: 480, margin: '0 auto', lineHeight: 1.55 }}>
          I know your health profile, recent logs, and goals. Ask me anything — or pick a starter below.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SUGGESTIONS.map(s => {
          const Icon = s.icon
          return (
            <button key={s.title} onClick={() => onSuggest(s.title)} style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 14,
              border: '1px solid var(--cream-200)', background: '#fff',
              cursor: 'pointer', transition: 'all 140ms',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'var(--cream-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink-600)',
                }}>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.3 }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginLeft: 42 }}>{s.sub}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Message bubbles ──────────────────────────────────────────────────────────
function CoachAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--forest-500)', color: 'var(--cream-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Sparkles size={15} />
    </div>
  )
}

function UserAvatar({ firstName }: { firstName: string }) {
  const initials = firstName.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #E8836A, #E8C870)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'var(--forest-700)',
    }}>
      {initials}
    </div>
  )
}

function MessageBubble({ message, firstName, streaming }: { message: Message; firstName: string; streaming?: boolean }) {
  const isUser = message.role === 'user'
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
        <div style={{
          maxWidth: '72%', padding: '12px 16px',
          borderRadius: '18px 18px 4px 18px',
          background: 'var(--terracotta-400)', color: '#fff',
          fontSize: 15, lineHeight: 1.55,
        }}>
          {message.content}
        </div>
        <UserAvatar firstName={firstName} />
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
      <CoachAvatar />
      <div style={{
        maxWidth: '78%', padding: '14px 18px',
        borderRadius: '18px 18px 18px 4px',
        background: '#fff', border: '1px solid var(--cream-200)',
        fontSize: 15, lineHeight: 1.65, color: 'var(--ink-800)',
        boxShadow: '0 1px 4px rgba(31,45,42,0.05)',
      }}>
        <FormattedText text={message.content} />
        {streaming && (
          <span style={{
            display: 'inline-block', width: 8, height: 16,
            background: 'var(--terracotta-400)', marginLeft: 2,
            borderRadius: 2, verticalAlign: 'text-bottom',
            animation: 'pulse 1s ease-in-out infinite',
          }} />
        )}
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
      <CoachAvatar />
      <div style={{
        padding: '12px 18px', borderRadius: '18px 18px 18px 4px',
        background: '#fff', border: '1px solid var(--cream-200)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Loader2 size={14} color="var(--ink-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>Thinking…</span>
      </div>
    </div>
  )
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
        return (
          <span key={i}>
            {part.split('\n').map((line, j, arr) => (
              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
            ))}
          </span>
        )
      })}
    </>
  )
}
