'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Plus, Image, X, Loader2 } from 'lucide-react'
import { startNewThread } from '@/app/actions/coach'

type Message = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  has_image?: boolean
}

const SUGGESTIONS = [
  "Why do I feel bloated after meals?",
  "What does my gut score mean?",
  "Can you analyze my recent symptoms?",
  "Suggest a meal for my diet plan",
  "How is my progress looking this week?",
]

export default function CoachClient({ initialThreadId, initialMessages }: {
  initialThreadId: string | null
  initialMessages: Message[]
}) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
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

  async function send() {
    if ((!input.trim() && !image) || streaming) return
    const userMsg = input.trim()
    setInput('')
    setError(null)

    const optimisticMsg: Message = { role: 'user', content: userMsg || '[Image attached]', has_image: !!image }
    setMessages(prev => [...prev, optimisticMsg])

    const imgPayload = image ? { imageBase64: image.base64, imageType: image.type } : {}
    setImage(null)
    setStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, threadId, ...imgPayload }),
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
            if (payload.delta) {
              accumulated += payload.delta
              setStreamingText(accumulated)
            }
            if (payload.threadId && !threadId) setThreadId(payload.threadId)
            if (payload.done) {
              setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
              setStreamingText('')
            }
            if (payload.error) setError(payload.error)
          } catch {}
        }
      }
    } catch (e) {
      setError('Connection error. Please try again.')
    } finally {
      setStreaming(false)
      setStreamingText('')
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleNewThread() {
    startTransition(async () => {
      const thread = await startNewThread()
      if (thread) {
        setThreadId(thread.id)
        setMessages([])
        setStreamingText('')
        inputRef.current?.focus()
      }
    })
  }

  const isEmpty = messages.length === 0 && !streamingText

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', maxHeight: '100vh',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        background: '#fff', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink-900)', margin: 0, letterSpacing: '-0.01em' }}>
            GutHub Coach
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--ink-500)', margin: 0, marginTop: 1 }}>
            Your personal gut health advisor
          </p>
        </div>
        <button onClick={handleNewThread} disabled={isPending} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 999,
          border: '1.5px solid var(--border)', background: 'transparent',
          fontSize: 13, fontWeight: 500, color: 'var(--ink-600)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 160ms',
        }}>
          <Plus size={14} /> New chat
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {isEmpty && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--terracotta-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>🌿</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 8px' }}>
              Hi, I'm your GutHub Coach
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '0 0 32px', maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
              Ask me anything about your gut health, nutrition, or how to interpret your recent logs.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520, marginInline: 'auto' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }} style={{
                  padding: '9px 16px', borderRadius: 999,
                  border: '1.5px solid var(--border)', background: '#fff',
                  fontSize: 13.5, color: 'var(--ink-700)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'all 160ms',
                  lineHeight: 1.4,
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Streaming bubble */}
        {streamingText && (
          <MessageBubble message={{ role: 'assistant', content: streamingText }} streaming />
        )}

        {/* Thinking indicator */}
        {streaming && !streamingText && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Avatar />
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              background: '#fff', border: '1px solid var(--ink-100)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Loader2 size={14} color="var(--ink-400)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13.5, color: 'var(--ink-400)' }}>Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
            background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
            fontSize: 13, color: 'var(--error)',
          }}>{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {image && (
        <div style={{
          padding: '8px 24px 0', display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--cream-50)', borderTop: '1px solid var(--border)',
        }}>
          <img src={image.preview} alt="Attached" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Image attached</span>
          <button onClick={() => setImage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-500)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: '12px 24px 16px',
        background: 'var(--cream-50)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: '#fff', borderRadius: 16,
          border: '1.5px solid var(--border)',
          padding: '8px 8px 8px 16px',
          boxShadow: '0 2px 8px rgba(31,45,42,0.06)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask GutHub anything…"
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
            <button onClick={() => fileInputRef.current?.click()} title="Attach image" style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: 'var(--cream-100)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-500)', transition: 'background 160ms',
            }}>
              <Image size={16} />
            </button>
            <button onClick={send} disabled={streaming || (!input.trim() && !image)} style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: (streaming || (!input.trim() && !image)) ? 'var(--ink-200)' : 'var(--terracotta-400)',
              cursor: (streaming || (!input.trim() && !image)) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'background 160ms',
            }}>
              {streaming
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={16} />
              }
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'center', margin: '8px 0 0' }}>
          GutHub can make mistakes. Always consult a qualified healthcare professional for medical decisions.
        </p>
      </div>
    </div>
  )
}

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message, streaming }: { message: Message; streaming?: boolean }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '75%', padding: '12px 16px',
          borderRadius: '18px 18px 4px 18px',
          background: 'var(--terracotta-400)', color: '#fff',
          fontSize: 15, lineHeight: 1.55,
        }}>
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
      <Avatar />
      <div style={{
        maxWidth: '80%', padding: '14px 18px',
        borderRadius: '18px 18px 18px 4px',
        background: '#fff', border: '1px solid var(--ink-100)',
        fontSize: 15, lineHeight: 1.65, color: 'var(--ink-800)',
        boxShadow: '0 1px 4px rgba(31,45,42,0.06)',
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

function Avatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--forest-500)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14,
    }}>🌿</div>
  )
}

function FormattedText({ text }: { text: string }) {
  // Convert **bold** → <strong> and newlines → <br>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
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
