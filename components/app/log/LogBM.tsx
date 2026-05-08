'use client'

import { useState, useTransition } from 'react'
import { logBM } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

const BRISTOL = [
  { type: 1, label: 'Type 1', desc: 'Separate hard lumps — severe constipation',    color: '#B4422C' },
  { type: 2, label: 'Type 2', desc: 'Lumpy sausage — mild constipation',             color: '#C85A44' },
  { type: 3, label: 'Type 3', desc: 'Cracked sausage — normal, slightly dry',        color: '#C98A1E' },
  { type: 4, label: 'Type 4', desc: 'Smooth, soft sausage — ideal',                  color: '#3F6A4A' },
  { type: 5, label: 'Type 5', desc: 'Soft blobs — lacking fibre',                    color: '#C98A1E' },
  { type: 6, label: 'Type 6', desc: 'Mushy, fluffy pieces — mild diarrhoea',         color: '#C85A44' },
  { type: 7, label: 'Type 7', desc: 'Entirely liquid — severe diarrhoea',            color: '#B4422C' },
]

const FLAGS = [
  { id: 'urgency',           label: 'Urgency' },
  { id: 'blood_mucus',       label: 'Blood / mucus' },
  { id: 'incomplete',        label: 'Incomplete feeling' },
  { id: 'painful',           label: 'Painful' },
]

// Clinical line-drawing icons for each Bristol type — neutral, no photographs.
function BristolIcon({ type, color }: { type: number; color: string }) {
  const sw = 1.6
  const props = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      {type === 1 && (
        // Separate hard lumps — three small distinct hard circles, well-spaced
        <g {...props}>
          <circle cx="8"  cy="16" r="2.6" />
          <circle cx="16" cy="16" r="2.6" />
          <circle cx="24" cy="16" r="2.6" />
        </g>
      )}
      {type === 2 && (
        // Lumpy sausage — five overlapping circles forming a chain (one connected mass)
        <g {...props}>
          <circle cx="6"  cy="16" r="3" />
          <circle cx="11" cy="16" r="3" />
          <circle cx="16" cy="16" r="3" />
          <circle cx="21" cy="16" r="3" />
          <circle cx="26" cy="16" r="3" />
        </g>
      )}
      {type === 3 && (
        // Cracked sausage — elongated oval with crack lines across it
        <g {...props}>
          <rect x="4" y="12" width="24" height="8" rx="4" />
          <path d="M11 12 v8 M17 12 v8 M22 12 v8" strokeWidth={sw * 0.8} opacity="0.85" />
        </g>
      )}
      {type === 4 && (
        // Smooth sausage — clean elongated oval (ideal)
        <g {...props}>
          <rect x="4" y="13" width="24" height="6" rx="3" />
        </g>
      )}
      {type === 5 && (
        // Soft blobs — three softer, larger ellipses (clearly "soft" not "hard")
        <g {...props}>
          <ellipse cx="8"  cy="16" rx="4" ry="3.2" />
          <ellipse cx="17" cy="16" rx="4.5" ry="3.4" />
          <ellipse cx="26" cy="16" rx="3.8" ry="3" />
        </g>
      )}
      {type === 6 && (
        // Mushy pieces — cloud-like irregular fragments
        <g {...props}>
          <path d="M4 18 q0 -3 3 -3 q1 -3 4 -2 q2 -2 4 0 q2 -2 4 0 q3 -1 4 2 q3 0 3 3 q-1 2 -3 2 H7 q-2 0 -3 -2 z" />
          <path d="M9 14.5 q1 -1 2 0" strokeWidth={sw * 0.8} />
          <path d="M16 13.5 q1 -1 2 0" strokeWidth={sw * 0.8} />
          <path d="M22 14.5 q1 -1 2 0" strokeWidth={sw * 0.8} />
        </g>
      )}
      {type === 7 && (
        // Watery — wavy liquid lines
        <g {...props}>
          <path d="M3 12 q3 -2 6 0 q3 2 6 0 q3 -2 6 0 q3 2 6 0" />
          <path d="M3 17 q3 -2 6 0 q3 2 6 0 q3 -2 6 0 q3 2 6 0" />
          <path d="M3 22 q3 -2 6 0 q3 2 6 0 q3 -2 6 0 q3 2 6 0" />
        </g>
      )}
    </svg>
  )
}

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
                padding: '10px 14px', borderRadius: 11, textAlign: 'left', width: '100%',
                border: `1.5px solid ${active ? b.color : 'var(--cream-200)'}`,
                background: active ? `${b.color}14` : '#fff',
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 140ms',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: active ? '#fff' : 'var(--cream-50)',
                  border: `1px solid ${active ? `${b.color}40` : 'var(--cream-200)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BristolIcon type={b.type} color={active ? b.color : 'var(--ink-500)' as string} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
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

