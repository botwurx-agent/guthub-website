'use client'

import { useState, useRef } from 'react'
import { Camera, Search, CheckCircle2, AlertTriangle, XCircle, Lightbulb, ChevronRight, RotateCcw, Utensils, Sparkles, AlertCircle, ImagePlus, X, Check } from 'lucide-react'

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
  great:  { label: 'Great choice!',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🎉' },
  okay:   { label: 'Manageable',     color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '👍' },
  tricky: { label: 'Tricky spot',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '⚠️' },
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function LogButton({ itemName, calories }: { itemName: string; calories?: number | null }) {
  const [open, setOpen] = useState(false)
  const [mealType, setMealType] = useState<string>('dinner')
  const [logging, setLogging] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    setLogging(true)
    const today = new Date().toLocaleDateString('en-CA')
    const fd = new FormData()
    fd.set('log_date', today)
    fd.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    fd.set('meal_name', itemName)
    fd.set('meal_type', mealType)
    if (calories) fd.set('calories', String(calories))
    const { logMeal } = await import('@/app/actions/log')
    await logMeal(fd)
    setLogging(false)
    setDone(true)
    setOpen(false)
    setTimeout(() => setDone(false), 3000)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#16a34a', padding: '5px 10px', background: '#f0fdf4', borderRadius: 7, border: '1px solid #bbf7d0' }}>
        <Check size={11} /> Logged
      </div>
    )
  }

  if (open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <select
          value={mealType}
          onChange={e => setMealType(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 7, border: '1px solid var(--cream-300)', background: '#fff', color: 'var(--ink-700)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
        >
          {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <button
          onClick={submit}
          disabled={logging}
          style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--forest-500)', border: 'none', padding: '5px 10px', borderRadius: 7, cursor: logging ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
        >
          {logging ? '…' : 'Log it'}
        </button>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-400)' }}>
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      title="Log this meal"
      style={{ fontSize: 11, fontWeight: 600, color: 'var(--forest-600)', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      + Log
    </button>
  )
}

export default function EatOutClient({ topTriggers, allergens }: { topTriggers: Trigger[]; allergens: string[] }) {
  const [mode, setMode]           = useState<'photo' | 'search'>('photo')
  const [restaurant, setRestaurant] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState<string>('image/jpeg')
  const [converting, setConverting] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<AnalysisResult | null>(null)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function isHeic(file: File) {
    return file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)
  }

  async function handleImage(file: File) {
    setError('')
    let processedFile = file

    if (isHeic(file)) {
      setConverting(true)
      try {
        const heic2any = (await import('heic2any')).default
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }) as Blob
        processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
      } catch {
        setError('Could not convert HEIC image. Please export it as JPEG from your Photos app and try again.')
        setConverting(false)
        return
      }
      setConverting(false)
    }

    setImageMime(processedFile.type || 'image/jpeg')
    setImageFile(processedFile)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(processedFile)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function analyze() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let body: Record<string, unknown> = { mode, restaurant: restaurant.trim() }

      if (mode === 'photo' && imageFile) {
        const base64 = await fileToBase64(imageFile)
        body = { ...body, imageBase64: base64, imageMime }
      }

      const res = await fetch('/api/eat-out/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    clearImage()
    setError('')
  }

  const canAnalyze = mode === 'photo' ? !!imageFile && !converting : !!restaurant.trim()
  const verdictCfg = result ? VERDICT_CONFIG[result.overall_verdict] : null

  return (
    <div className="app-page-content" style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
          Eat Out Safely
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
          What can I eat <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>here?</em>
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-400)', maxWidth: 520 }}>
          Snap a photo of the menu — we'll scan every item against your personal trigger history in seconds.
        </p>
      </div>

      {/* Trigger pills */}
      {(topTriggers.length > 0 || allergens.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
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
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--cream-200)' }}>
            {([['photo', Camera, 'Take / upload a photo'], ['search', Search, 'Search by name']] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError('') }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px 20px', border: 'none', cursor: 'pointer',
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

          <div className="eat-out-input-pad" style={{ padding: '28px 28px 24px' }}>

            {mode === 'photo' ? (
              <div>
                {/* Photo drop zone / preview */}
                {!imagePreview ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: '100%', border: '2px dashed var(--cream-300)', borderRadius: 16,
                      padding: '48px 24px', background: 'var(--cream-50)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 140ms',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--terracotta-400)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--terracotta-50)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cream-300)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--cream-50)'
                    }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--terracotta-50)', border: '1.5px solid var(--terracotta-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={26} color="var(--terracotta-500)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                        Take a photo of the menu
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.5 }}>
                        On mobile, this opens your camera directly.<br />
                        Or drag &amp; drop / choose an existing photo.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-300)', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 6, padding: '3px 10px' }}>JPG</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-300)', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 6, padding: '3px 10px' }}>PNG</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-300)', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 6, padding: '3px 10px' }}>HEIC</span>
                    </div>
                  </button>
                ) : (
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--cream-200)' }}>
                    <img src={imagePreview} alt="Menu" style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={clearImage}
                      style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={15} color="#fff" />
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-body)' }}
                    >
                      <ImagePlus size={13} /> Retake
                    </button>
                  </div>
                )}

                {/* Hidden file input — capture="environment" opens rear camera on mobile */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f) }}
                />

                {/* Optional restaurant name */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6 }}>
                    Restaurant name <span style={{ fontWeight: 400, color: 'var(--ink-300)' }}>(optional — helps if menu is hard to read)</span>
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
                      boxSizing: 'border-box', transition: 'border-color 120ms',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--terracotta-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--cream-200)')}
                  />
                </div>

                {converting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 10, fontSize: 13, color: 'var(--ink-600)' }}>
                    <span style={{ width: 15, height: 15, border: '2px solid var(--cream-300)', borderTopColor: 'var(--forest-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                    Converting HEIC to JPEG…
                  </div>
                )}
                <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--ink-300)', lineHeight: 1.5 }}>
                  Tip: shoot in good lighting, frame the full menu page. Handwritten or dim menus may need a retake.
                </p>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
                  Restaurant name
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={17} color="var(--ink-300)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={restaurant}
                    onChange={e => setRestaurant(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canAnalyze && !loading && analyze()}
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
                  Works with any restaurant — chains, fast food, local spots. Best for planning ahead.
                </p>
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
              disabled={loading || converting || !canAnalyze}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                width: '100%', marginTop: 20, padding: '14px 24px',
                background: !canAnalyze || loading || converting ? 'var(--ink-200)' : 'var(--terracotta-500)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: !canAnalyze || loading || converting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 140ms',
              }}
            >
              {converting ? (
                <>
                  <span style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Converting image…
                </>
              ) : loading ? (
                <>
                  <span style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Scanning menu against your triggers…
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  {mode === 'photo' ? 'Analyze this menu' : 'Analyze this restaurant'}
                </>
              )}
            </button>
          </div>

          {/* How it works */}
          <div className="eat-out-how-it-works" style={{ borderTop: '1px solid var(--cream-100)', padding: '14px 28px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['📸', 'Snap the menu'],
              ['🔍', 'AI reads every item'],
              ['✅', 'Get your safe picks instantly'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── RESULTS ─────────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Verdict banner */}
          <div className="eat-out-verdict" style={{ borderRadius: 16, padding: '20px 24px', background: verdictCfg!.bg, border: `1.5px solid ${verdictCfg!.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
              <RotateCcw size={13} /> Scan another
            </button>
          </div>

          <div className="eat-out-results-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>

            {/* Safe */}
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
              <div>
                {result.safe.map((item, i) => (
                  <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.safe.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3 }}>{item.item}</span>
                          {item.calories_estimate && (
                            <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>~{item.calories_estimate} kcal</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4, lineHeight: 1.5 }}>{item.reason}</div>
                      </div>
                      <LogButton itemName={item.item} calories={item.calories_estimate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution + Avoid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <div>
                    {result.caution.map((item, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.caution.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>{item.item}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3, lineHeight: 1.5 }}>{item.reason}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '5px 10px', background: '#fffbeb', borderRadius: 7, width: 'fit-content' }}>
                              <ChevronRight size={11} color="#d97706" />
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>{item.modification}</span>
                            </div>
                          </div>
                          <LogButton itemName={item.item} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div>
                    {result.avoid.map((item, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.avoid.length - 1 ? '1px solid var(--cream-100)' : 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>{item.item}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3, lineHeight: 1.5 }}>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Lightbulb size={17} color="var(--terracotta-500)" />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Ordering tips</div>
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

          {/* Post-meal reminder */}
          <div className="eat-out-log-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '16px 20px', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Utensils size={17} color="var(--forest-500)" />
              <span style={{ fontSize: 14, color: 'var(--ink-700)', fontWeight: 500 }}>
                After eating, tap <strong>+ Log</strong> next to the item you ordered — or log any symptoms if they come up.
              </span>
            </div>
            <a href="/log?type=symptom" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--cream-200)', background: 'var(--cream-50)', color: 'var(--ink-700)', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              Log a symptom
            </a>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix, keep only the base64 part
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
