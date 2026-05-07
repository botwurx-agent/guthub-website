'use client'

import { useState, useTransition } from 'react'
import { logMeal } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, Textarea, SubmitBtn } from './shared'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function LogMeal({ onSuccess }: { onSuccess: () => void }) {
  const [mealType, setMealType] = useState('breakfast')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    formData.set('meal_type', mealType)
    setError(null)
    startTransition(async () => {
      const res = await logMeal(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Meal logged!" />

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
        <Input name="meal_name" placeholder="e.g. Grilled salmon with rice" />
      </Field>

      <Field label="Ingredients (one per line)">
        <Textarea name="ingredients" placeholder={"4oz salmon\n1/2 cup brown rice\nsteamed broccoli"} rows={4} />
      </Field>

      {/* Macros row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Calories (kcal)">
          <Input name="calories" type="number" placeholder="450" />
        </Field>
        <Field label="Protein (g)">
          <Input name="protein" type="number" placeholder="35" />
        </Field>
        <Field label="Carbs (g)">
          <Input name="carbs" type="number" placeholder="42" />
        </Field>
        <Field label="Fat (g)">
          <Input name="fat" type="number" placeholder="12" />
        </Field>
      </div>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log meal" loading={isPending} />
    </form>
  )
}
