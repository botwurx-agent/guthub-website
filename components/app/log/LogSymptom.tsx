'use client'

import { useState, useTransition, useEffect } from 'react'
import { Utensils } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logSymptom } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

const SYMPTOMS = [
  'Bloating', 'Gas', 'Cramping', 'Nausea', 'Reflux / Heartburn',
  'Constipation', 'Diarrhea', 'Stomach pain', 'Fatigue', 'Headache',
  'Brain fog', 'Skin flare-up', 'Other',
]

const ONSET_OPTIONS = [
  { label: 'Just now',  minutes: 0 },
  { label: '~30 min',   minutes: 30 },
  { label: '~1 hour',   minutes: 60 },
  { label: '2+ hours',  minutes: 120 },
]

type MealLog = { id: string; meal_name: string; meal_type: string; logged_at: string }

function formatMealTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function LogSymptom({ onSuccess }: { onSuccess: () => void }) {
  const [selected, setSelected]         = useState<string | null>(null)
  const [severity, setSeverity]         = useState<number | null>(null)
  const [triggerId, setTriggerId]       = useState<string | null>(null)
  const [onsetMinutes, setOnsetMinutes] = useState<number | null>(null)
  const [todayMeals, setTodayMeals]     = useState<MealLog[]>([])
  const [error, setError]               = useState<string | null>(null)
  const [done, setDone]                 = useState(false)
  const [isPending, startTransition]    = useTransition()

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('meal_logs')
      .select('id, meal_name, meal_type, logged_at')
      .eq('log_date', today)
      .order('logged_at', { ascending: true })
      .then(({ data }) => setTodayMeals(data ?? []))
  }, [])

  function handle(formData: FormData) {
    if (!selected) return setError('Please select a symptom.')
    if (!severity) return setError('Please select a severity.')
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    formData.set('symptom_type', selected.toLowerCase().replace(/[\s/]+/g, '_'))
    formData.set('severity', String(severity))
    if (triggerId) formData.set('suspected_trigger_meal_id', triggerId)
    if (onsetMinutes !== null) formData.set('onset_minutes', String(onsetMinutes))
    setError(null)
    startTransition(async () => {
      const res = await logSymptom(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Symptom logged!" />

  const chip = (active: boolean, color: 'terracotta' | 'forest' = 'terracotta'): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-body)', transition: 'all 160ms',
    border: `1.5px solid ${active ? `var(--${color}-400)` : 'var(--border)'}`,
    background: active ? `var(--${color}-50)` : '#fff',
    color: active ? `var(--${color}-${color === 'forest' ? '700' : '600'})` : 'var(--ink-600)',
    fontWeight: active ? 600 : 400,
  })

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Field label="Symptom" required>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map(s => (
            <button key={s} type="button" onClick={() => setSelected(s)} style={chip(selected === s)}>{s}</button>
          ))}
        </div>
      </Field>

      <Field label="Severity" required>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" onClick={() => setSeverity(n)} style={{
              width: 38, height: 38, borderRadius: 8, border: 'none',
              background: severity === n
                ? n <= 3 ? '#3F6A4A' : n <= 6 ? '#C98A1E' : '#B4422C'
                : 'var(--ink-100)',
              color: severity === n ? '#fff' : 'var(--ink-600)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 160ms', fontFamily: 'var(--font-body)',
            }}>{n}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
          <span>Mild</span><span>Moderate</span><span>Severe</span>
        </div>
      </Field>

      {/* Meal trigger */}
      <Field label="What did you eat before this?">
        {todayMeals.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>
            No meals logged today yet —{' '}
            <a href="/log" style={{ color: 'var(--terracotta-500)', textDecoration: 'none', fontWeight: 600 }}>
              log a meal first
            </a>{' '}
            to link it here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {todayMeals.map(meal => {
              const active = triggerId === meal.id
              return (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => { setTriggerId(active ? null : meal.id); if (active) setOnsetMinutes(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', borderRadius: 10, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 160ms',
                    border: `1.5px solid ${active ? 'var(--forest-400)' : 'var(--border)'}`,
                    background: active ? 'var(--forest-50)' : '#fff',
                    color: active ? 'var(--forest-700)' : 'var(--ink-600)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Utensils size={13} />
                  <span>{meal.meal_name}</span>
                  <span style={{ fontSize: 11, color: active ? 'var(--forest-500)' : 'var(--ink-400)', marginLeft: 2 }}>
                    {formatMealTime(meal.logged_at)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Field>

      {/* Onset — only shown once a meal is selected */}
      {triggerId && (
        <Field label="How long after eating did this start?">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ONSET_OPTIONS.map(opt => (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => setOnsetMinutes(onsetMinutes === opt.minutes ? null : opt.minutes)}
                style={chip(onsetMinutes === opt.minutes)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Other context (optional)">
        <Textarea
          name="notes"
          placeholder="Stress levels, sleep quality, medications, anything else relevant…"
          rows={3}
        />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log symptom" loading={isPending} />
    </form>
  )
}
