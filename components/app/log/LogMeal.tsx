'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { logMeal } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, Textarea, SubmitBtn } from './shared'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

type Macros = { calories: string; protein: string; carbs: string; fat: string }

export default function LogMeal({ onSuccess }: { onSuccess: () => void }) {
  const [mealType, setMealType]   = useState('breakfast')
  const [mealName, setMealName]   = useState('')
  const [ingredients, setIngredients] = useState('')
  const [macros, setMacros]       = useState<Macros>({ calories: '', protein: '', carbs: '', fat: '' })
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [isPending, startTransition] = useTransition()

  async function analyzeMacros() {
    if (!mealName.trim()) return
    setAnalyzing(true)
    setAnalyzed(false)
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
      }
    } finally {
      setAnalyzing(false)
    }
  }

  function handle(formData: FormData) {
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
        <div style={{ display: 'flex', gap: 8 }}>
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

      <Field label="Ingredients (one per line — optional, improves AI accuracy)">
        <Textarea
          name="ingredients"
          placeholder={"4oz salmon\n1/2 cup brown rice\nsteamed broccoli"}
          rows={4}
          value={ingredients}
          onChange={e => { setIngredients(e.target.value); setAnalyzed(false) }}
        />
      </Field>

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
