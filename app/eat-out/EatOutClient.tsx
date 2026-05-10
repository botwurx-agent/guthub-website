'use client'

import { useState, useRef } from 'react'
import { Search, ClipboardList, CheckCircle2, AlertTriangle, XCircle, Lightbulb, ChevronRight, RotateCcw, Utensils, Sparkles, AlertCircle } from 'lucide-react'

type Trigger = { food: string; symptom: string; score: number }

type AnalysisResult = {
  restaurant_name: string
  cuisine_type: string
  safe: { item: string; reason: string; calories_estimate: number | null }[]
  caution: { item: string; reason: string; modification: string }[]
  avoid: { item: string; reason: string }[]
  tips: string[]
  overall_verdict: 'great' | 'okay' | 'tricky'
  verdict_summary: string
}

const VERDICT_CONFIG = {
  great: { label: 'Great choice!', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🎉' },
  okay:  { label: 'Manageable',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '👍' },
  tricky: { label: 'Tricky spot', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '⚠️' },
}

export default function EatOutClient({ topTriggers, allergens }: { topTriggers: Trigger[]; allergens: string[] }) {
  const [mode, setMode]         = useState<'search' | 'paste'>('search')
  const [restaurant, setRestaurant] = useState('')
  const [menuText, setMenuText] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<AnalysisResult | null>(null)
  const [error, setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function analyze() {
    if (mode === 'search' && !restaurant.trim()) return
    if (mode === 'paste' && !menuText.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/eat-out/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant: restaurant.trim(), menuText: menuText.trim(), mode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Analysis failed.'); return }
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setRestaurant('')
    setMenuText('')
    setError('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const verdictCfg = result ? VERDICT_CONFIG[result.overall_verdict] : null

  return (
    <div className="app-page-content" style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
          Eat Out Safely
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
          What can I eat <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>here?</em>
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-400)', maxWidth: 520 }}>
          Tell us where you're eating — we'll scan the menu against your personal trigger history and tell you exactly what's safe.
        </p>
      </div>

      {/* Your triggers pill row */}
      {(topTriggers.length > 0 || allergens.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Checking against:
          </span>
          {allergens.map(a => (
            <span key={a} style={{ fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 999, padding: '3px 10px' }}>
              {a} allergy
            </span>
          ))}
          {topTriggers.slice(0, 4).map(t => (
            <span key={t.food} style={{ fontSize: 12, fontWeight: 600, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '3px 10px' }}>
              {t.food} ({t.score}%)
            </span>
          ))}
          {topTriggers.length === 0 && allergens.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Log meals &amp; symptoms to build your personal trigger profile.</span>
          )}
        </div>
      )}

      {!result ? (
        /* ── INPUT CARD ─────────────────────────────────────────────────── */
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--cream-200)' }}>
            {([['search', Search, 'Search by restaurant'], ['paste', ClipboardList, 'Paste a menu']] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '16px 20px', border: 'none', cursor: 'pointer',
                  background: mode === id ? 'var(--cream-50)' : '#fff',
                  borderBottom: `2px solid ${mode === id ? 'var(--terracotta-500)' : 'transparent'}`,
                  fontSize: 14, fontWeight: mode === id ? 700 : 500,
                  color: mode === id ? 'var(--ink-900)' : 'var(--ink-400)',
                  transition: 'all 120ms',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div style={{ padding: '28px 28px 24px' }}>
            {mode === 'search' ? (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
                  Restaurant name
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={17} color="var(--ink-300)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    ref={inputRef}
                    value={restaurant}
                    onChange={e => setRestaurant(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && analyze()}
                    placeholder="e.g. Chipotle, Olive Garden, local Thai place…"
                    style={{
                      width: '100%', padding: '13px 16px 13px 44px',
                      fontSize: 15, border: '1.5px solid var(--cream-200)',
                      borderRadius: 12, outline: 'none', background: 'var(--cream-50)',
                      color: 'var(--ink-900)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', transition: 'border-color 120ms',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--terracotta-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--cream-200)')}
                  />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-300)' }}>
                  Works with any restaurant — chains, fast food, local spots. The more specific the better.
                </p>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
                  Paste the menu
                </label>
                <textarea
                  value={menuText}
                  onChange={e => setMenuText(e.target.value)}
                  placeholder="Paste the menu text here — from a website, photo, or screenshot. Include item names and ingredients if possible."
                  rows={8}
                  style={{
                    width: '100%', padding: '13px 16px',
                    fontSize: 14, border: '1.5px solid var(--cream-200)',
                    borderRadius: 12, outline: 'none', background: 'var(--cream-50)',
                    color: 'var(--ink-900)', fontFamily: 'var(--font-body)',
                    resize: 'vertical', lineHeight: 1.6,
                    boxSizing: 'border-box', transition: 'border-color 120ms',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--terracotta-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--cream-200)')}
                />
                {mode === 'paste' && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6 }}>
                      Restaurant name <span style={{ fontWeight: 400, color: 'var(--ink-300)' }}>(optional)</span>
                    </label>
                    <input
                      value={restaurant}
                      onChange={e => setRestaurant(e.target.value)}
                      placeholder="e.g. Local Thai Kitchen"
                      style={{
                        width: '100%', padding: '10px 14px',
                        fontSize: 14, border: '1.5px solid var(--cream-200)',
                        borderRadius: 10, outline: 'none', background: 'var(--cream-50)',
                        color: 'var(--ink-900)', fontFamily: 'var(--font-body)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#dc2626' }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={loading || (mode === 'search' ? !restaurant.trim() : !menuText.trim())}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                width: '100%', marginTop: 20, padding: '14px 24px',
                background: loading ? 'var(--ink-200)' : 'var(--terracotta-500)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 140ms',
                opacity: (mode === 'search' ? !restaurant.trim() : !menuText.trim()) && !loading ? 0.5 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Analyzing your triggers…
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Analyze this restaurant
                </>
              )}
            </button>
          </div>

          {/* How it works footer */}
          <div style={{ borderTop: '1px solid var(--cream-100)', padding: '16px 28px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['1', 'Reads your logged food triggers'],
              ['2', 'Scans menu items for your specific risks'],
              ['3', 'Returns safe picks + smart swaps'],
            ].map(([n, text]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--terracotta-600)', flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── RESULTS ─────────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Verdict banner */}
          <div style={{ borderRadius: 16, padding: '20px 24px', background: verdictCfg!.bg, border: `1.5px solid ${verdictCfg!.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 30 }}>{verdictCfg!.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: verdictCfg!.color, marginBottom: 3 }}>
                  {result.cuisine_type} · {verdictCfg!.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink-900)' }}>
                  {result.restaurant_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
                  {result.verdict_summary}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--cream-200)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-600)', fontFamily: 'var(--font-body)' }}
            >
              <RotateCcw size={13} /> New search
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>

            {/* Safe choices */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--cream-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Safe to order</div>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{result.safe.length} options</div>
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {result.safe.map((item, i) => (
                  <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.safe.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3 }}>{item.item}</div>
                      {item.calories_estimate && (
                        <span style={{ fontSize: 11, color: 'var(--ink-400)', flexShrink: 0, marginTop: 2 }}>~{item.calories_estimate} kcal</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4, lineHeight: 1.5 }}>{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution + Avoid stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Caution */}
              {result.caution.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--cream-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={15} color="#d97706" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Order with caution</div>
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Modify before ordering</div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {result.caution.map((item, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.caution.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3 }}>{item.item}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3, lineHeight: 1.5 }}>{item.reason}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '5px 10px', background: '#fffbeb', borderRadius: 7, width: 'fit-content' }}>
                          <ChevronRight size={11} color="#d97706" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>{item.modification}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avoid */}
              {result.avoid.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--cream-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <XCircle size={15} color="#dc2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Best to avoid</div>
                      <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Based on your triggers</div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {result.avoid.map((item, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.avoid.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3 }}>{item.item}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3, lineHeight: 1.5 }}>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordering tips */}
          {result.tips.length > 0 && (
            <div style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Lightbulb size={17} color="var(--terracotta-500)" />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Ordering tips for this meal</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--terracotta-400)', flexShrink: 0, marginTop: 6 }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log this meal CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '16px 20px', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Utensils size={17} color="var(--forest-500)" />
              <span style={{ fontSize: 14, color: 'var(--ink-700)', fontWeight: 500 }}>
                After your meal, log what you ate to refine your trigger profile.
              </span>
            </div>
            <a href="/log?tab=meal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'var(--forest-500)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              Log this meal
            </a>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
