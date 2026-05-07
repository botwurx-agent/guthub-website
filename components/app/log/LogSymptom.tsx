'use client'

import { useState, useTransition } from 'react'
import { logSymptom } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

const SYMPTOMS = [
  'Bloating', 'Gas', 'Cramping', 'Nausea', 'Reflux / Heartburn',
  'Constipation', 'Diarrhea', 'Stomach pain', 'Fatigue', 'Headache',
  'Brain fog', 'Skin flare-up', 'Other',
]

export default function LogSymptom({ onSuccess }: { onSuccess: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [severity, setSeverity] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    if (!selected) return setError('Please select a symptom.')
    if (!severity) return setError('Please select a severity.')
    formData.set('symptom_type', selected.toLowerCase().replace(/[\s/]+/g, '_'))
    formData.set('severity', String(severity))
    setError(null)
    startTransition(async () => {
      const res = await logSymptom(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Symptom logged!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Symptom" required>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map(s => (
            <button key={s} type="button" onClick={() => setSelected(s)} style={{
              padding: '7px 14px', borderRadius: 999,
              border: `1.5px solid ${selected === s ? 'var(--terracotta-400)' : 'var(--border)'}`,
              background: selected === s ? 'var(--terracotta-50)' : '#fff',
              color: selected === s ? 'var(--terracotta-600)' : 'var(--ink-600)',
              fontSize: 13, fontWeight: selected === s ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 160ms',
            }}>{s}</button>
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

      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Any context — what you ate, time of day…" rows={3} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log symptom" loading={isPending} />
    </form>
  )
}
