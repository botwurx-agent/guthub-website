'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Paperclip, X, Loader2, Plus, Sparkles, Utensils, FlaskConical, ChefHat, Moon, ShoppingCart, Frown, Pencil, Trash2, Check, CalendarPlus, ChevronLeft, ChevronRight, Mic, Droplets, Scale, type LucideIcon } from 'lucide-react'
import { startNewThread, getThreadMessages, renameThread, deleteThread, savePlanFromCoach, logMealFromCoach, logSymptomFromCoach, logWaterFromCoach, logWeightFromCoach } from '@/app/actions/coach'
import type { LogDraft, SymptomDraft, WaterDraft, WeightDraft } from '@/app/actions/coach'

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

type PlanSlot = {
  day_index: number
  meal_type: string
  meal_name: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

const ICON_MAP: Record<string, LucideIcon> = {
  Frown, Utensils, FlaskConical, ChefHat, Moon, ShoppingCart, Droplets, Scale,
}

const FALLBACK_SUGGESTIONS = [
  { title: 'Why am I bloated after meals?', sub: 'Identify your personal trigger foods', icon: 'Frown' },
  { title: 'Plan my week', sub: 'A 7-day plan based on my profile', icon: 'Utensils' },
  { title: 'Optimize my macros for gut health', sub: 'Protein, fiber, and fat balance', icon: 'FlaskConical' },
  { title: 'What should I eat tonight?', sub: 'Quick gut-friendly dinner ideas', icon: 'ChefHat' },
  { title: 'How do I reduce reflux at night?', sub: 'Practical, evidence-based tips', icon: 'Moon' },
  { title: 'Make me a grocery list', sub: 'For the next 7 days of meals', icon: 'ShoppingCart' },
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
  initialThreadId, initialMessages, initialThreads, firstName, welcomeMessage, autostartMessage, suggestions,
}: {
  initialThreadId: string | null
  initialMessages: Message[]
  initialThreads: Thread[]
  firstName: string
  welcomeMessage: string
  autostartMessage?: string
  suggestions?: Array<{ title: string; sub: string; icon: string }>
}) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [image, setImage] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mealPlanDraft, setMealPlanDraft] = useState<PlanSlot[] | null>(null)
  const [planStartOffset, setPlanStartOffset] = useState(0)
  const [planConflicts, setPlanConflicts] = useState<number | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [logDraft, setLogDraft] = useState<LogDraft | null>(null)
  const [loggingMeal, setLoggingMeal] = useState(false)
  const [mealLogged, setMealLogged] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [symptomDraft, setSymptomDraft] = useState<SymptomDraft | null>(null)
  const [loggingSymptom, setLoggingSymptom] = useState(false)
  const [symptomLogged, setSymptomLogged] = useState(false)
  const [symptomError, setSymptomError] = useState<string | null>(null)
  const [waterDraft, setWaterDraft] = useState<WaterDraft | null>(null)
  const [loggingWater, setLoggingWater] = useState(false)
  const [waterLogged, setWaterLogged] = useState(false)
  const [waterError, setWaterError] = useState<string | null>(null)
  const [weightDraft, setWeightDraft] = useState<WeightDraft | null>(null)
  const [loggingWeight, setLoggingWeight] = useState(false)
  const [weightLogged, setWeightLogged] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-send when arriving from dashboard with a pre-built prompt
  const autostartFired = useRef(false)
  useEffect(() => {
    if (!autostartMessage || autostartFired.current || streaming) return
    autostartFired.current = true
    send(autostartMessage, "Analyzing today's symptoms…")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set up Web Speech API for voice input
  useEffect(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    setVoiceSupported(true)
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = e.results[i][0].transcript.trim()
          if (t) setInput(prev => (prev ? prev + ' ' + t : t))
        }
      }
    }
    recognitionRef.current = rec
    return () => { try { rec.stop() } catch { /* noop */ } }
  }, [])

  function toggleVoice() {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      try { rec.stop() } catch { /* noop */ }
    } else {
      try { rec.start(); inputRef.current?.focus() } catch { /* noop */ }
    }
  }

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

  async function send(overrideText?: string, displayOverride?: string) {
    const text = overrideText ?? input
    if ((!text.trim() && !image) || streaming) return
    setInput('')
    setError(null)

    const displayText = displayOverride ?? text
    const optimisticMsg: Message = { role: 'user', content: displayText.trim() || '[Image attached]', has_image: !!image }
    setMessages(prev => [...prev, optimisticMsg])

    const imgPayload = image ? { imageBase64: image.base64, imageType: image.type } : {}
    setImage(null)
    setStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          ...(displayOverride ? { displayContent: displayOverride } : {}),
          threadId,
          ...imgPayload,
        }),
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
            if (payload.replaceContent) { accumulated = payload.replaceContent; setStreamingText(accumulated) }
            if (payload.done) {
              setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
              setStreamingText('')
              if (payload.title) {
                const tid = payload.threadId ?? threadId
                setThreads(prev => prev.map(t => t.id === tid ? { ...t, title: payload.title } : t))
              }
              if (payload.mealPlanDraft) {
                setMealPlanDraft(payload.mealPlanDraft)
                setPlanStartOffset(0)
                setPlanConflicts(null)
                setPlanSaved(false)
              }
              if (payload.logDraft) {
                setLogDraft(payload.logDraft)
                setMealLogged(false)
                setLogError(null)
              }
              if (payload.symptomDraft) {
                setSymptomDraft(payload.symptomDraft)
                setSymptomLogged(false)
                setSymptomError(null)
              }
              if (payload.waterDraft) {
                setWaterDraft(payload.waterDraft)
                setWaterLogged(false)
                setWaterError(null)
              }
              if (payload.weightDraft) {
                setWeightDraft(payload.weightDraft)
                setWeightLogged(false)
                setWeightError(null)
              }
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
        setThreads(prev => [{ id: thread.id, title: thread.title, updated_at: thread.created_at ?? new Date().toISOString() }, ...prev])
        inputRef.current?.focus()
      }
    })
  }

  async function handleSavePlan(mode: 'check' | 'replace' | 'skip') {
    if (!mealPlanDraft) return
    setSavingPlan(true)
    const result = await savePlanFromCoach(mealPlanDraft, planStartOffset, mode)
    setSavingPlan(false)
    if (result?.error) { setError(result.error); return }
    if (mode === 'check') {
      const conflicts = (result as { conflicts: number }).conflicts ?? 0
      if (conflicts > 0) { setPlanConflicts(conflicts); return }
      // No conflicts — go ahead and save
      await handleSavePlan('replace')
    } else {
      setPlanSaved(true)
    }
  }

  async function handleLogMeal() {
    if (!logDraft || loggingMeal || mealLogged) return
    setLoggingMeal(true)
    setLogError(null)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date().toLocaleDateString('en-CA')
    const result = await logMealFromCoach(logDraft, tz, date)
    setLoggingMeal(false)
    if (result?.error) { setLogError(result.error); return }
    setMealLogged(true)
  }

  async function handleLogSymptom() {
    if (!symptomDraft || loggingSymptom || symptomLogged) return
    setLoggingSymptom(true)
    setSymptomError(null)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date().toLocaleDateString('en-CA')
    const result = await logSymptomFromCoach(symptomDraft, tz, date)
    setLoggingSymptom(false)
    if (result?.error) { setSymptomError(result.error); return }
    setSymptomLogged(true)
  }

  async function handleLogWater() {
    if (!waterDraft || loggingWater || waterLogged) return
    setLoggingWater(true)
    setWaterError(null)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date().toLocaleDateString('en-CA')
    const result = await logWaterFromCoach(waterDraft, tz, date)
    setLoggingWater(false)
    if (result?.error) { setWaterError(result.error); return }
    setWaterLogged(true)
  }

  async function handleLogWeight() {
    if (!weightDraft || loggingWeight || weightLogged) return
    setLoggingWeight(true)
    setWeightError(null)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date().toLocaleDateString('en-CA')
    const result = await logWeightFromCoach(weightDraft, tz, date)
    setLoggingWeight(false)
    if (result?.error) { setWeightError(result.error); return }
    setWeightLogged(true)
  }

  function startEditing(t: Thread) {
    setEditingId(t.id)
    setEditingTitle(t.title)
    setTimeout(() => editInputRef.current?.select(), 0)
  }

  async function commitRename() {
    if (!editingId) return
    const result = await renameThread(editingId, editingTitle)
    if (!result?.error) {
      setThreads(prev => prev.map(t => t.id === editingId ? { ...t, title: editingTitle.trim() } : t))
    }
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteThread(id)
    setDeletingId(null)
    if (!result?.error) {
      setThreads(prev => prev.filter(t => t.id !== id))
      if (threadId === id) {
        // Switch to next available thread or clear
        const remaining = threads.filter(t => t.id !== id)
        if (remaining.length > 0) {
          setThreadId(remaining[0].id)
          const msgs = await getThreadMessages(remaining[0].id)
          setMessages(msgs)
        } else {
          setThreadId(null)
          setMessages([])
        }
      }
    }
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
    <div className="coach-layout" style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--cream-50)' }}>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="coach-sidebar-overlay" style={{ display: 'none' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Threads sidebar ── */}
      <aside className={`coach-thread-sidebar${sidebarOpen ? ' open' : ''}`} style={{
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
            <ThreadRow
              key={t.id}
              thread={t}
              active={t.id === threadId}
              editing={editingId === t.id}
              editingTitle={editingTitle}
              deleting={deletingId === t.id}
              editInputRef={editInputRef}
              onSelect={() => switchThread(t.id)}
              onStartEdit={() => startEditing(t)}
              onEditChange={setEditingTitle}
              onCommitRename={commitRename}
              onCancelRename={() => setEditingId(null)}
              onDelete={() => handleDelete(t.id)}
            />
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

        {/* Mobile: threads toggle button */}
        <div className="coach-mobile-threads-btn" style={{
          display: 'none', alignItems: 'center', gap: 8, padding: '10px 14px',
          borderBottom: '1px solid var(--cream-200)', background: '#fff',
        }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--cream-200)',
              background: 'var(--cream-100)', fontSize: 13, fontWeight: 600,
              color: 'var(--ink-700)', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            ☰ Threads
          </button>
        </div>

        {/* Messages scroll */}
        <div className="coach-chat-pad" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 8px' }}>
          {isEmpty ? (
            <EmptyChat firstName={firstName} welcomeMessage={welcomeMessage} suggestions={suggestions ?? FALLBACK_SUGGESTIONS} onSuggest={text => { setInput(text); send(text) }} />
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
              {mealPlanDraft && !streaming && (
                <MealPlanDraftCard
                  slots={mealPlanDraft}
                  startOffset={planStartOffset}
                  conflicts={planConflicts}
                  saving={savingPlan}
                  saved={planSaved}
                  onOffsetChange={v => { setPlanStartOffset(v); setPlanConflicts(null) }}
                  onSave={() => handleSavePlan('check')}
                  onReplace={() => handleSavePlan('replace')}
                  onSkip={() => handleSavePlan('skip')}
                />
              )}
              {logDraft && !streaming && (
                <LogDraftCard
                  draft={logDraft}
                  saving={loggingMeal}
                  saved={mealLogged}
                  error={logError}
                  onLog={handleLogMeal}
                />
              )}
              {symptomDraft && !streaming && (
                <SymptomDraftCard
                  draft={symptomDraft}
                  saving={loggingSymptom}
                  saved={symptomLogged}
                  error={symptomError}
                  onLog={handleLogSymptom}
                />
              )}
              {waterDraft && !streaming && (
                <WaterDraftCard
                  draft={waterDraft}
                  saving={loggingWater}
                  saved={waterLogged}
                  error={waterError}
                  onLog={handleLogWater}
                />
              )}
              {weightDraft && !streaming && (
                <WeightDraftCard
                  draft={weightDraft}
                  saving={loggingWeight}
                  saved={weightLogged}
                  error={weightError}
                  onLog={handleLogWeight}
                />
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
        <div className="coach-input-area" style={{ padding: '12px 32px 16px', background: 'var(--cream-50)', borderTop: '1px solid var(--cream-200)', flexShrink: 0 }}>
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
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  disabled={streaming}
                  title={listening ? 'Stop recording' : 'Voice input'}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: listening ? 'var(--terracotta-400)' : 'var(--cream-100)',
                    cursor: streaming ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: listening ? '#fff' : 'var(--ink-500)',
                    transition: 'all 160ms',
                    animation: listening ? 'micPulse 1.4s ease-in-out infinite' : undefined,
                  }}
                >
                  <Mic size={16} />
                </button>
              )}
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

// ── Meal plan draft save card ────────────────────────────────────────────────
function LogDraftCard({ draft, saving, saved, error, onLog }: {
  draft: LogDraft
  saving: boolean
  saved: boolean
  error: string | null
  onLog: () => void
}) {
  const mealTypeLabel = draft.meal_type.charAt(0).toUpperCase() + draft.meal_type.slice(1)
  return (
    <div style={{
      margin: '16px 0', padding: '18px 20px', borderRadius: 14,
      background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-100)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Utensils size={15} color="var(--terracotta-500)" />
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--terracotta-500)',
        }}>Log this meal</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 4 }}>
        {mealTypeLabel}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 8, lineHeight: 1.35 }}>
        {draft.meal_name}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'var(--ink-600)', marginBottom: 14 }}>
        <span><b style={{ color: 'var(--ink-900)' }}>{draft.calories}</b> kcal</span>
        <span><b style={{ color: 'var(--ink-900)' }}>{draft.protein_g}g</b> protein</span>
        <span><b style={{ color: 'var(--ink-900)' }}>{draft.carbs_g}g</b> carbs</span>
        <span><b style={{ color: 'var(--ink-900)' }}>{draft.fat_g}g</b> fat</span>
      </div>
      {error && (
        <div style={{ fontSize: 12.5, color: '#b4422c', marginBottom: 10 }}>{error}</div>
      )}
      <button
        onClick={onLog}
        disabled={saving || saved}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 999, border: 'none',
          background: saved ? 'var(--forest-400)' : 'var(--terracotta-400)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: saving || saved ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)',
          opacity: saving ? 0.8 : 1,
          transition: 'background 160ms',
        }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Logging…</>
          : saved ? <><Check size={13} /> Logged for today</>
          : <><Plus size={13} /> Log to today</>}
      </button>
    </div>
  )
}

function SymptomDraftCard({ draft, saving, saved, error, onLog }: {
  draft: SymptomDraft; saving: boolean; saved: boolean; error: string | null; onLog: () => void
}) {
  const label = draft.symptom_type.charAt(0).toUpperCase() + draft.symptom_type.slice(1)
  const severityColor = draft.severity >= 7 ? '#b4422c' : draft.severity >= 4 ? '#C98A1E' : '#3F6A4A'
  return (
    <div style={{ margin: '16px 0', padding: '18px 20px', borderRadius: 14, background: 'rgba(201,138,30,0.07)', border: '1px solid rgba(201,138,30,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Frown size={15} color="#C98A1E" />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C98A1E' }}>Log this symptom</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--ink-600)', marginBottom: draft.notes ? 6 : 14, flexWrap: 'wrap' }}>
        <span>Severity <b style={{ color: severityColor }}>{draft.severity}/10</b></span>
      </div>
      {draft.notes && <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 14, fontStyle: 'italic' }}>"{draft.notes}"</div>}
      {error && <div style={{ fontSize: 12.5, color: '#b4422c', marginBottom: 10 }}>{error}</div>}
      <button onClick={onLog} disabled={saving || saved} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 999, border: 'none',
        background: saved ? 'var(--forest-400)' : '#C98A1E',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: saving || saved ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', opacity: saving ? 0.8 : 1, transition: 'background 160ms',
      }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Logging…</>
          : saved ? <><Check size={13} /> Logged</>
          : <><Plus size={13} /> Log symptom</>}
      </button>
    </div>
  )
}

function WaterDraftCard({ draft, saving, saved, error, onLog }: {
  draft: WaterDraft; saving: boolean; saved: boolean; error: string | null; onLog: () => void
}) {
  const cups = Math.round((draft.amount_ml / 240) * 10) / 10
  return (
    <div style={{ margin: '16px 0', padding: '18px 20px', borderRadius: 14, background: 'rgba(111,184,168,0.08)', border: '1px solid rgba(111,184,168,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Droplets size={15} color="#6FB8A8" />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6FB8A8' }}>Log water</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>
        {draft.amount_ml} ml <span style={{ fontWeight: 400, color: 'var(--ink-500)', fontSize: 13 }}>({cups} cup{cups !== 1 ? 's' : ''})</span>
      </div>
      {error && <div style={{ fontSize: 12.5, color: '#b4422c', marginBottom: 10 }}>{error}</div>}
      <button onClick={onLog} disabled={saving || saved} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 999, border: 'none',
        background: saved ? 'var(--forest-400)' : '#6FB8A8',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: saving || saved ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', opacity: saving ? 0.8 : 1, transition: 'background 160ms',
      }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Logging…</>
          : saved ? <><Check size={13} /> Logged</>
          : <><Plus size={13} /> Log water</>}
      </button>
    </div>
  )
}

function WeightDraftCard({ draft, saving, saved, error, onLog }: {
  draft: WeightDraft; saving: boolean; saved: boolean; error: string | null; onLog: () => void
}) {
  return (
    <div style={{ margin: '16px 0', padding: '18px 20px', borderRadius: 14, background: 'rgba(157,151,138,0.08)', border: '1px solid rgba(157,151,138,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Scale size={15} color="#9D978A" />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9D978A' }}>Log weight</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 14 }}>
        {draft.weight_lbs} lbs
      </div>
      {error && <div style={{ fontSize: 12.5, color: '#b4422c', marginBottom: 10 }}>{error}</div>}
      <button onClick={onLog} disabled={saving || saved} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 999, border: 'none',
        background: saved ? 'var(--forest-400)' : '#9D978A',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: saving || saved ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', opacity: saving ? 0.8 : 1, transition: 'background 160ms',
      }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Logging…</>
          : saved ? <><Check size={13} /> Logged</>
          : <><Plus size={13} /> Log weight</>}
      </button>
    </div>
  )
}

function MealPlanDraftCard({ slots, startOffset, conflicts, saving, saved, onOffsetChange, onSave, onReplace, onSkip }: {
  slots: PlanSlot[]
  startOffset: number
  conflicts: number | null
  saving: boolean
  saved: boolean
  onOffsetChange: (v: number) => void
  onSave: () => void
  onReplace: () => void
  onSkip: () => void
}) {
  const days = Array.from(new Set(slots.map(s => s.day_index))).sort()

  const actualDate = (dayIndex: number) => {
    const d = new Date()
    d.setDate(d.getDate() + 1 + startOffset + dayIndex)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const startLabel = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1 + startOffset)
    if (startOffset === 0) return 'Tomorrow'
    if (startOffset === 1) return 'In 2 days'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const iconBtn = (style?: React.CSSProperties): React.CSSProperties => ({
    background: 'none', border: '1px solid var(--forest-300)', borderRadius: 6,
    cursor: 'pointer', color: 'var(--forest-600)', padding: '3px 6px',
    display: 'flex', alignItems: 'center', ...style,
  })

  return (
    <div style={{
      margin: '8px 0 16px 44px', borderRadius: 14,
      border: '1.5px solid var(--forest-300)',
      background: '#f4f8f5', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #d4e6da', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CalendarPlus size={16} color="var(--forest-600)" />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--forest-700)' }}>
          {days.length}-day meal plan ready to save
        </span>
        <span style={{ fontSize: 12, color: 'var(--forest-500)', marginLeft: 'auto' }}>
          {slots.length} meals
        </span>
      </div>

      {/* Start date picker */}
      <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #d4e6da', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-600)', fontWeight: 500 }}>Starting:</span>
        <button style={iconBtn()} onClick={() => onOffsetChange(Math.max(0, startOffset - 1))} disabled={startOffset === 0}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-700)', minWidth: 120, textAlign: 'center' }}>
          {startLabel()}
        </span>
        <button style={iconBtn()} onClick={() => onOffsetChange(Math.min(30, startOffset + 1))}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Meal list */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map(di => (
          <div key={di}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forest-500)', marginBottom: 4 }}>
              {actualDate(di)}
            </div>
            {slots.filter(s => s.day_index === di).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingLeft: 4, marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, color: 'var(--forest-500)', width: 62, flexShrink: 0, textTransform: 'capitalize' }}>{s.meal_type}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-800)', fontWeight: 500 }}>{s.meal_name}</span>
                {s.calories && <span style={{ fontSize: 11.5, color: 'var(--ink-400)', marginLeft: 'auto', flexShrink: 0 }}>{s.calories} kcal</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Action area */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #d4e6da' }}>
        {saved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--forest-600)' }}>
            <Check size={15} />
            Saved!
            <a href="/meal-planner" style={{ color: 'var(--terracotta-500)', textDecoration: 'underline', marginLeft: 4 }}>
              View in Planner →
            </a>
          </div>
        ) : conflicts !== null && conflicts > 0 ? (
          /* Conflict resolution */
          <div>
            <p style={{ fontSize: 13, color: 'var(--ink-700)', margin: '0 0 10px', lineHeight: 1.45 }}>
              <strong>{conflicts} meal{conflicts > 1 ? 's' : ''}</strong> already exist on these days. What would you like to do?
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={onReplace}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'var(--forest-500)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                Replace existing
              </button>
              <button
                onClick={onSkip}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#fff', color: 'var(--forest-600)', border: '1.5px solid var(--forest-300)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                Add to empty slots only
              </button>
            </div>
          </div>
        ) : (
          /* Default save button */
          <button
            onClick={onSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: saving ? 'var(--forest-300)' : 'var(--forest-500)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'background 160ms' }}
          >
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking…</>
              : <><CalendarPlus size={14} /> Save to Planner</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Thread row with rename / delete ─────────────────────────────────────────
function ThreadRow({
  thread, active, editing, editingTitle, deleting, editInputRef,
  onSelect, onStartEdit, onEditChange, onCommitRename, onCancelRename, onDelete,
}: {
  thread: { id: string; title: string; updated_at: string }
  active: boolean
  editing: boolean
  editingTitle: string
  deleting: boolean
  editInputRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onStartEdit: () => void
  onEditChange: (v: string) => void
  onCommitRename: () => void
  onCancelRename: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 8, marginBottom: 1,
        border: active ? '1px solid var(--cream-200)' : '1px solid transparent',
        background: active ? 'var(--cream-100)' : 'transparent',
        transition: 'all 140ms',
      }}
    >
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px' }}>
          <input
            ref={editInputRef}
            value={editingTitle}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCommitRename(); if (e.key === 'Escape') onCancelRename() }}
            autoFocus
            style={{
              flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-800)',
              border: '1.5px solid var(--terracotta-300)', borderRadius: 6,
              padding: '3px 7px', outline: 'none', fontFamily: 'var(--font-body)',
              background: '#fff', minWidth: 0,
            }}
          />
          <button onClick={onCommitRename} title="Save" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest-500)', padding: 2, display: 'flex' }}>
            <Check size={14} />
          </button>
          <button onClick={onCancelRename} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: 2, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button onClick={onSelect} style={{
          width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
          border: 'none', background: 'transparent', cursor: 'pointer',
          paddingRight: hovered ? 60 : 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {thread.title}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>{relativeTime(thread.updated_at)}</div>
        </button>
      )}

      {/* Action icons — shown on hover, hidden when editing */}
      {!editing && hovered && (
        <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <button
            onClick={e => { e.stopPropagation(); onStartEdit() }}
            title="Rename"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: '4px', borderRadius: 6, display: 'flex', transition: 'color 120ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-700)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-400)')}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Delete"
            disabled={deleting}
            style={{ background: 'none', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', color: 'var(--ink-400)', padding: '4px', borderRadius: 6, display: 'flex', transition: 'color 120ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#b4422c')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-400)')}
          >
            {deleting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Empty / welcome state ────────────────────────────────────────────────────
function EmptyChat({
  firstName, welcomeMessage, suggestions, onSuggest,
}: {
  firstName: string
  welcomeMessage: string
  suggestions: Array<{ title: string; sub: string; icon: string }>
  onSuggest: (text: string) => void
}) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 0 24px' }}>
      {/* Personalized welcome bubble */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'flex-start' }}>
        <CoachAvatar />
        <div style={{
          maxWidth: '88%', padding: '14px 18px',
          borderRadius: '18px 18px 18px 4px',
          background: '#fff', border: '1px solid var(--cream-200)',
          fontSize: 15, lineHeight: 1.65, color: 'var(--ink-800)',
          boxShadow: '0 1px 4px rgba(31,45,42,0.05)',
        }}>
          <FormattedText text={welcomeMessage} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: '0 0 12px', paddingLeft: 4 }}>Or pick a conversation starter:</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {suggestions.map(s => {
          const Icon = ICON_MAP[s.icon] ?? Frown
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
  // Split on **bold** and [link](url) tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/)
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              style={{
                color: 'var(--terracotta-500)',
                fontWeight: 600,
                textDecoration: 'underline',
                textDecorationColor: 'var(--terracotta-300)',
                textUnderlineOffset: 3,
              }}
            >
              {linkMatch[1]}
            </a>
          )
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
