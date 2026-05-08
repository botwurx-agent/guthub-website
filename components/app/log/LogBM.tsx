'use client'

import { useState, useTransition } from 'react'
import { logBM } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

const BRISTOL = [
  { type: 1, label: 'Type 1', desc: 'Separate hard lumps — severe constipation',    color: '#B4422C', bar: 1 },
  { type: 2, label: 'Type 2', desc: 'Lumpy sausage — mild constipation',             color: '#C85A44', bar: 2 },
  { type: 3, label: 'Type 3', desc: 'Cracked sausage — normal, slightly dry',        color: '#C98A1E', bar: 3 },
  { type: 4, label: 'Type 4', desc: 'Smooth, soft sausage — ideal',                  color: '#3F6A4A', bar: 4 },
  { type: 5, label: 'Type 5', desc: 'Soft blobs — lacking fibre',                    color: '#C98A1E', bar: 5 },
  { type: 6, label: 'Type 6', desc: 'Mushy, fluffy pieces — mild diarrhoea',         color: '#C85A44', bar: 6 },
  { type: 7, label: 'Type 7', desc: 'Entirely liquid — severe diarrhoea',            color: '#B4422C', bar: 7 },
]

const FLAGS = [
  { id: 'urgency',           label: 'Urgency' },
  { id: 'blood_mucus',       label: 'Blood / mucus' },
  { id: 'incomplete',        label: 'Incomplete feeling' },
  { id: 'painful',           label: 'Painful' },
]

export default function LogBM({ onSuccess }: { onSuccess: () => void }) {
  const [bristol, setBristol] = useState<number | null>(null)
  const [flags, setFlags]     = useState<Set<string>>(new Set())
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleFlag(id: string) {
    setFlags(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handle(formData: FormData) {
    if (!bristol) return setError('Please select a Bristol type.')
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('bristol_type', String(bristol))
    formData.set('flags', JSON.stringify([...flags]))
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

      {/* Bristol scale heading */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracotta-500)', marginBottom: 4 }}>
          Bristol Scale
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-400)' }}>
          Your gut tells the story. Select the type that best matches.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {BRISTOL.map(b => {
            const active = bristol === b.type
            return (
              <button key={b.type} type="button" onClick={() => setBristol(b.type)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 14px', borderRadius: 11, textAlign: 'left', width: '100%',
                border: `1.5px solid ${active ? b.color : 'var(--cream-200)'}`,
                background: active ? `${b.color}14` : '#fff',
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 140ms',
              }}>
                {/* Visual bar representing stool consistency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 20, flexShrink: 0 }}>
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} style={{
                      height: 3, borderRadius: 2,
                      background: active ? b.color : 'var(--ink-200)',
                      width: b.type <= 2 ? '100%'          // hard: full bars
                           : b.type === 3 ? (i % 2 === 0 ? '100%' : '60%')  // cracked: alternating
                           : b.type === 4 ? '100%'          // ideal: full
                           : b.type === 5 ? (i % 2 === 0 ? '70%' : '40%')   // soft: shorter
                           : b.type === 6 ? (i % 3 === 0 ? '50%' : '30%')   // mushy: very short
                           : '80%',                          // watery: wavy-ish
                    }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? b.color : 'var(--ink-700)' }}>
                    {b.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>{b.desc}</div>
                </div>
                {b.type === 4 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3F6A4A', background: '#EEF3EF', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>
                    Ideal
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Flags */}
      <Field label="Flags (optional)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FLAGS.map(f => {
            const active = flags.has(f.id)
            return (
              <button key={f.id} type="button" onClick={() => toggleFlag(f.id)} style={{
                padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${active ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
                background: active ? 'var(--terracotta-50)' : '#fff',
                color: active ? 'var(--terracotta-600)' : 'var(--ink-600)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 140ms',
              }}>
                {active && <span style={{ marginRight: 4 }}>✓</span>}{f.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Any other context…" rows={2} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log bowel movement" loading={isPending} />
    </form>
  )
}
