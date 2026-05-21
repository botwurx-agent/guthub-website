'use client'

import { useState, useEffect, useTransition } from 'react'
import { Sparkles, X } from 'lucide-react'
import { logMeal } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, Textarea, SubmitBtn } from './shared'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

type Macros = { calories: string; protein: string; carbs: string; fat: string }

const VISUAL_ANCHORS = [
  { size: '1 cup',    visual: '✊ Fist',          foods: 'rice, pasta, cereal, soup' },
  { size: '½ cup',    visual: '🥚 Tennis ball',   foods: 'beans, cooked grains, fruit' },
  { size: '3 oz',     visual: '🖐 Palm (no fingers)', foods: 'chicken, fish, steak, tofu' },
  { size: '1 oz',     visual: '🎲 4 dice',         foods: 'cheese, nuts, deli meat' },
  { size: '2 tbsp',   visual: '⛳ Golf ball',       foods: 'guacamole, nut butter, hummus, dressing' },
  { size: '1 tbsp',   visual: '👍 Thumb tip',       foods: 'oil, butter, mayo, jam' },
  { size: '1 tsp',    visual: '☝️ Fingertip',       foods: 'sugar, salt, oil drizzle' },
]

const FOOD_REFS = [
  { food: 'Guacamole',       ref: '2 tbsp ≈ 1 oz (30g) ≈ 50 kcal' },
  { food: 'Peanut butter',   ref: '2 tbsp ≈ 1 oz (30g) ≈ 190 kcal' },
  { food: 'Olive oil',       ref: '1 tbsp ≈ 14g ≈ 120 kcal' },
  { food: 'Cooked rice',     ref: '1 cup ≈ 6 oz (175g) ≈ 200 kcal' },
  { food: 'Pasta (cooked)',  ref: '1 cup ≈ 5 oz (140g) ≈ 220 kcal' },
  { food: 'Chicken breast',  ref: '1 palm ≈ 3 oz (85g) ≈ 140 kcal' },
  { food: 'Salmon fillet',   ref: '1 palm ≈ 3 oz (85g) ≈ 175 kcal' },
  { food: 'Cheese (hard)',   ref: '4 dice ≈ 1 oz (28g) ≈ 110 kcal' },
  { food: 'Salad dressing',  ref: '2 tbsp ≈ 1 oz ≈ 100–150 kcal' },
  { food: 'Mixed nuts',      ref: 'small handful ≈ 1 oz (28g) ≈ 170 kcal' },
  { food: 'Avocado (half)',  ref: '½ avocado ≈ 3 oz (85g) ≈ 120 kcal' },
  { food: 'Greek yogurt',    ref: 'small container ≈ 5.3 oz (150g) ≈ 90 kcal' },
]

function PortionGuide({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'visual' | 'foods'>('visual')
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
      />
      {/* Panel — right drawer on desktop, bottom sheet on mobile */}
      <div style={isDesktop ? {
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 380, background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 240ms var(--ease-out)',
      } : {
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, zIndex: 201,
        background: '#fff', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        maxHeight: '72vh', display: 'flex', flexDirection: 'column',
        animation: 'slideInBottom 240ms var(--ease-out)',
      }}>
        {/* Handle + header */}
        <div style={{ padding: isDesktop ? '24px 20px 0' : '12px 20px 0', flexShrink: 0 }}>
          {!isDesktop && <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--cream-200)', margin: '0 auto 16px' }} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>Portion guide</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-400)' }}>Visual references for common portion sizes</p>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'var(--cream-100)', border: 'none', borderRadius: 99, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={15} color="var(--ink-500)" />
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--cream-100)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
            {(['visual', 'foods'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 140ms',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--ink-800)' : 'var(--ink-400)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t === 'visual' ? 'Visual anchors' : 'Common foods'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '0 20px 32px', flex: 1 }}>
          {tab === 'visual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {VISUAL_ANCHORS.map(a => (
                <div key={a.size} style={{ display: 'grid', gridTemplateColumns: '64px 110px 1fr', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--cream-50)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--terracotta-600)' }}>{a.size}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-700)' }}>{a.visual}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{a.foods}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FOOD_REFS.map(f => (
                <div key={f.food} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'var(--cream-50)', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', flexShrink: 0 }}>{f.food}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>{f.ref}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function LogMeal({ onSuccess, logDate }: { onSuccess: () => void; logDate?: string }) {
  const [mealType, setMealType]   = useState('breakfast')
  const [mealName, setMealName]   = useState('')
  const [ingredients, setIngredients] = useState('')
  const [macros, setMacros]       = useState<Macros>({ calories: '', protein: '', carbs: '', fat: '' })
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [showPortionGuide, setShowPortionGuide] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function analyzeMacros() {
    if (!mealName.trim()) return
    setAnalyzing(true)
    setAnalyzed(false)
    setError(null)
    try {
      const res = await fetch('/api/meal-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealName, ingredients }),
      })
      if (res.ok) {
        const data = await res.json()
        setMacros({
          calories: String(data.calories  || ''),
          protein:  String(data.protein_g || ''),
          carbs:    String(data.carbs_g   || ''),
          fat:      String(data.fat_g     || ''),
        })
        setAnalyzed(true)
      } else {
        setError('AI estimate failed — please fill in macros manually.')
      }
    } catch {
      setError('AI estimate failed — please fill in macros manually.')
    } finally {
      setAnalyzing(false)
    }
  }

  function handle(formData: FormData) {
    formData.set('log_date', logDate ?? new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('meal_type', mealType)
    // Inject controlled macro values so server action sees them
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

  if (done) return <SuccessBanner message="Meal logged!" />

  const canAnalyze = mealName.trim().length > 0

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Meal type chips */}
      <Field label="Meal type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MEAL_TYPES.map(t => (
            <button key={t} type="button" onClick={() => setMealType(t)} style={{
              padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${mealType === t ? 'var(--terracotta-400)' : 'var(--border)'}`,
              background: mealType === t ? 'var(--terracotta-50)' : '#fff',
              color: mealType === t ? 'var(--terracotta-600)' : 'var(--ink-600)',
              fontSize: 13, fontWeight: mealType === t ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 160ms',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Meal name" required>
        <Input
          name="meal_name"
          placeholder="e.g. Grilled salmon with rice"
          value={mealName}
          onChange={e => { setMealName(e.target.value); setAnalyzed(false) }}
        />
      </Field>

      <Field label={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Ingredients <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>(one per line — optional)</span></span>
          <button
            type="button"
            onClick={() => setShowPortionGuide(true)}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--terracotta-500)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Portion guide
          </button>
        </div>
      }>
        <Textarea
          name="ingredients"
          placeholder={"4oz salmon\n1/2 cup brown rice\nsteamed broccoli"}
          rows={4}
          value={ingredients}
          onChange={e => { setIngredients(e.target.value); setAnalyzed(false) }}
        />
      </Field>

      {showPortionGuide && <PortionGuide onClose={() => setShowPortionGuide(false)} />}

      {/* AI analyze button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={analyzeMacros}
          disabled={!canAnalyze || analyzing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10,
            border: `1.5px solid ${analyzed ? 'var(--forest-400)' : 'var(--terracotta-300)'}`,
            background: analyzed ? 'var(--forest-50)' : 'var(--terracotta-50)',
            color: analyzed ? 'var(--forest-600)' : 'var(--terracotta-600)',
            fontSize: 13, fontWeight: 600, cursor: canAnalyze && !analyzing ? 'pointer' : 'not-allowed',
            opacity: canAnalyze ? 1 : 0.45,
            transition: 'all 160ms', fontFamily: 'var(--font-body)',
          }}
        >
          <Sparkles size={14} />
          {analyzing ? 'Analyzing…' : analyzed ? 'Macros estimated ✓' : 'Estimate macros with AI'}
        </button>
        {!analyzed && (
          <span style={{ fontSize: 12, color: 'var(--ink-400)', lineHeight: 1.4 }}>
            Or fill in manually below
          </span>
        )}
      </div>

      {/* Macros row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Calories (kcal)">
          <Input
            name="calories"
            type="number"
            placeholder="450"
            value={macros.calories}
            onChange={e => setMacros(m => ({ ...m, calories: e.target.value }))}
          />
        </Field>
        <Field label="Protein (g)">
          <Input
            name="protein"
            type="number"
            placeholder="35"
            value={macros.protein}
            onChange={e => setMacros(m => ({ ...m, protein: e.target.value }))}
          />
        </Field>
        <Field label="Carbs (g)">
          <Input
            name="carbs"
            type="number"
            placeholder="42"
            value={macros.carbs}
            onChange={e => setMacros(m => ({ ...m, carbs: e.target.value }))}
          />
        </Field>
        <Field label="Fat (g)">
          <Input
            name="fat"
            type="number"
            placeholder="12"
            value={macros.fat}
            onChange={e => setMacros(m => ({ ...m, fat: e.target.value }))}
          />
        </Field>
      </div>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log meal" loading={isPending} />
    </form>
  )
}
