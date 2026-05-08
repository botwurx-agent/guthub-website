'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { Camera, Upload, X, Sparkles, ImagePlus, Loader2 } from 'lucide-react'
import { logMeal } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, SubmitBtn } from './shared'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

type ImageData = { base64: string; type: string; preview: string }
type Macros = { meal_name: string; calories: string; protein: string; carbs: string; fat: string }

function isHeic(file: File) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

export default function LogMealPhoto({ onSuccess }: { onSuccess: () => void }) {
  const [mealType, setMealType]       = useState('breakfast')
  const [image, setImage]             = useState<ImageData | null>(null)
  const [macros, setMacros]           = useState<Macros>({ meal_name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [analyzing, setAnalyzing]     = useState(false)
  const [converting, setConverting]   = useState(false)
  const [analyzed, setAnalyzed]       = useState(false)
  const [dragging, setDragging]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [done, setDone]               = useState(false)
  const [isPending, startTransition]  = useTransition()

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function readFile(file: File) {
    if (!file.type.startsWith('image/') && !isHeic(file)) {
      setError('Please select an image file.')
      return
    }
    setError(null)

    let processedFile = file

    // Convert HEIC/HEIF → JPEG so the browser can display it and OpenAI can read it
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

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const [header, base64] = result.split(',')
      const type = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
      setImage({ base64, type, preview: result })
      setAnalyzed(false)
      setMacros({ meal_name: '', calories: '', protein: '', carbs: '', fat: '' })
    }
    reader.readAsDataURL(processedFile)
  }

  async function analyze() {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/meal-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, imageType: image.type }),
      })
      if (res.ok) {
        const data = await res.json()
        setMacros({
          meal_name: data.meal_name ?? '',
          calories:  String(data.calories  || ''),
          protein:   String(data.protein_g || ''),
          carbs:     String(data.carbs_g   || ''),
          fat:       String(data.fat_g     || ''),
        })
        setAnalyzed(true)
      } else {
        setError('AI analysis failed — please try a clearer photo or fill in manually.')
      }
    } catch {
      setError('AI analysis failed — please check your connection.')
    } finally {
      setAnalyzing(false)
    }
  }

  function handle(formData: FormData) {
    if (!image) return setError('Please upload a photo first.')
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('meal_type', mealType)
    formData.set('meal_name', macros.meal_name || 'Photo meal')
    formData.set('calories', macros.calories)
    formData.set('protein',  macros.protein)
    formData.set('carbs',    macros.carbs)
    formData.set('fat',      macros.fat)
    setError(null)
    startTransition(async () => {
      const res = await logMeal(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (done) return <SuccessBanner message="Meal logged!" />

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-body)', transition: 'all 160ms',
    border: `1.5px solid ${active ? 'var(--terracotta-400)' : 'var(--border)'}`,
    background: active ? 'var(--terracotta-50)' : '#fff',
    color: active ? 'var(--terracotta-600)' : 'var(--ink-600)',
    fontWeight: active ? 600 : 400,
  })

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Meal type */}
      <Field label="Meal type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MEAL_TYPES.map(t => (
            <button key={t} type="button" onClick={() => setMealType(t)} style={chipStyle(mealType === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Field>

      {/* Upload area */}
      <Field label="Photo" required>
        {converting ? (
          <div style={{ border: '2px dashed var(--border)', borderRadius: 14, padding: '48px 20px', background: 'var(--cream-50)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={28} color="var(--terracotta-400)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-500)', fontWeight: 500 }}>Converting HEIC to JPEG…</p>
          </div>
        ) : image ? (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={image.preview} alt="Meal" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={() => { setImage(null); setAnalyzed(false); setMacros({ meal_name: '', calories: '', protein: '', carbs: '', fat: '' }) }}
              style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--terracotta-400)' : 'var(--border)'}`,
              borderRadius: 14, padding: '32px 20px',
              background: dragging ? 'var(--terracotta-50)' : 'var(--cream-50)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              transition: 'all 160ms',
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--cream-100)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImagePlus size={24} color="var(--ink-400)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>Drop a photo here</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>or choose an option below</p>
            </div>

            {/* Upload buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Upload from library — desktop + mobile gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', cursor: 'pointer' }}
              >
                <Upload size={15} /> Upload photo
              </button>

              {/* Take photo — shows camera on mobile, file picker on desktop */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--terracotta-300)', background: 'var(--terracotta-50)', fontSize: 13, fontWeight: 600, color: 'var(--terracotta-600)', cursor: 'pointer' }}
              >
                <Camera size={15} /> Take photo
              </button>
            </div>

            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />
          </div>
        )}
      </Field>

      {/* Analyze button — shown once image is selected */}
      {image && (
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px', borderRadius: 10,
            border: `1.5px solid ${analyzed ? 'var(--forest-400)' : 'var(--terracotta-300)'}`,
            background: analyzed ? 'var(--forest-50)' : 'var(--terracotta-50)',
            color: analyzed ? 'var(--forest-600)' : 'var(--terracotta-600)',
            fontSize: 14, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer',
            transition: 'all 160ms', fontFamily: 'var(--font-body)',
          }}
        >
          <Sparkles size={15} />
          {analyzing ? 'Analyzing photo…' : analyzed ? 'Analysis complete ✓ — edit below if needed' : 'Analyze with AI'}
        </button>
      )}

      {/* Macro fields — shown after analysis */}
      {(analyzed || macros.meal_name) && (
        <>
          <Field label="Meal name">
            <Input
              name="meal_name"
              placeholder="Meal name"
              value={macros.meal_name}
              onChange={e => setMacros(m => ({ ...m, meal_name: e.target.value }))}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Calories (kcal)">
              <Input name="calories" type="number" placeholder="—" value={macros.calories} onChange={e => setMacros(m => ({ ...m, calories: e.target.value }))} />
            </Field>
            <Field label="Protein (g)">
              <Input name="protein" type="number" placeholder="—" value={macros.protein} onChange={e => setMacros(m => ({ ...m, protein: e.target.value }))} />
            </Field>
            <Field label="Carbs (g)">
              <Input name="carbs" type="number" placeholder="—" value={macros.carbs} onChange={e => setMacros(m => ({ ...m, carbs: e.target.value }))} />
            </Field>
            <Field label="Fat (g)">
              <Input name="fat" type="number" placeholder="—" value={macros.fat} onChange={e => setMacros(m => ({ ...m, fat: e.target.value }))} />
            </Field>
          </div>
        </>
      )}

      {error && <ErrorBanner message={error} />}

      {image && (
        <SubmitBtn label={analyzed ? 'Log meal' : 'Log meal (no macros)'} loading={isPending} />
      )}
    </form>
  )
}
