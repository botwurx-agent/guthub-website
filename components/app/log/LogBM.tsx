'use client'

import { useState, useTransition } from 'react'
import { logBM } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

const BRISTOL = [
  { type: 1, label: 'Type 1', desc: 'Separate hard lumps', emoji: '🪨', color: '#B4422C' },
  { type: 2, label: 'Type 2', desc: 'Lumpy sausage',       emoji: '🌑', color: '#C85A44' },
  { type: 3, label: 'Type 3', desc: 'Cracked sausage',     emoji: '🌗', color: '#C98A1E' },
  { type: 4, label: 'Type 4', desc: 'Smooth sausage',      emoji: '✅', color: '#3F6A4A' },
  { type: 5, label: 'Type 5', desc: 'Soft blobs',          emoji: '🌥️', color: '#C98A1E' },
  { type: 6, label: 'Type 6', desc: 'Mushy pieces',        emoji: '💧', color: '#C85A44' },
  { type: 7, label: 'Type 7', desc: 'Watery, no solids',   emoji: '🌊', color: '#B4422C' },
]

export default function LogBM({ onSuccess }: { onSuccess: () => void }) {
  const [bristol, setBristol] = useState<number | null>(null)
  const [urgency, setUrgency] = useState<number | null>(null)
  const [pain, setPain] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    if (!bristol) return setError('Please select a Bristol type.')
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('bristol_type', String(bristol))
    if (urgency) formData.set('urgency', String(urgency))
    if (pain) formData.set('pain', String(pain))
    setError(null)
    startTransition(async () => {
      const res = await logBM(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Logged!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Field label="Bristol Stool Scale" required>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BRISTOL.map(b => (
            <button key={b.type} type="button" onClick={() => setBristol(b.type)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 12, textAlign: 'left', width: '100%',
              border: `1.5px solid ${bristol === b.type ? b.color : 'var(--border)'}`,
              background: bristol === b.type ? `${b.color}12` : '#fff',
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 160ms',
            }}>
              <span style={{ fontSize: 22 }}>{b.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: bristol === b.type ? b.color : 'var(--ink-800)' }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 1 }}>{b.desc}</div>
              </div>
              {b.type === 4 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#3F6A4A', background: '#EEF3EF', padding: '3px 8px', borderRadius: 999 }}>
                  Ideal
                </span>
              )}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Urgency (optional)">
          <ScaleRow value={urgency} onChange={setUrgency} max={5} lowLabel="None" highLabel="Extreme" />
        </Field>
        <Field label="Pain (optional)">
          <ScaleRow value={pain} onChange={setPain} max={5} lowLabel="None" highLabel="Severe" />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Any relevant context…" rows={2} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log bowel movement" loading={isPending} />
    </form>
  )
}

function ScaleRow({ value, onChange, max, lowLabel, highLabel }: {
  value: number | null; onChange: (v: number) => void; max: number; lowLabel: string; highLabel: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} style={{
            flex: 1, height: 34, borderRadius: 8, border: 'none',
            background: value === n ? 'var(--terracotta-400)' : 'var(--ink-100)',
            color: value === n ? '#fff' : 'var(--ink-600)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 160ms',
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-400)' }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  )
}
