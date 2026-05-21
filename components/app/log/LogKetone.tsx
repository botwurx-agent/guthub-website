'use client'

import { useState, useTransition } from 'react'
import { logKetone } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

type KetoneZone = {
  label: string
  range: string
  color: string
  bg: string
  border: string
}

function getZone(mmol: number | null): KetoneZone | null {
  if (mmol === null || isNaN(mmol)) return null
  if (mmol < 0.5)  return { label: 'Not in ketosis', range: '< 0.5', color: '#7A7468', bg: 'rgba(122,116,104,0.1)', border: 'rgba(122,116,104,0.3)' }
  if (mmol < 1.0)  return { label: 'Light ketosis',  range: '0.5–1.0', color: '#C98A1E', bg: 'rgba(201,138,30,0.1)', border: 'rgba(201,138,30,0.35)' }
  if (mmol < 3.0)  return { label: 'Optimal ketosis', range: '1.0–3.0', color: '#3F6A4A', bg: 'rgba(63,106,74,0.1)', border: 'rgba(63,106,74,0.3)' }
  if (mmol < 5.0)  return { label: 'Therapeutic',    range: '3.0–5.0', color: '#4A7AB5', bg: 'rgba(74,122,181,0.1)', border: 'rgba(74,122,181,0.3)' }
  return              { label: 'Very high',          range: '> 5.0', color: '#C85A2A', bg: 'rgba(200,90,42,0.1)', border: 'rgba(200,90,42,0.3)' }
}

const METHOD_OPTIONS = [
  { value: 'blood',  label: 'Blood meter' },
  { value: 'urine',  label: 'Urine strip' },
  { value: 'breath', label: 'Breath meter' },
]

export default function LogKetone({ onSuccess, logDate }: { onSuccess: () => void; logDate?: string }) {
  const [ketoneVal, setKetoneVal] = useState('')
  const [method, setMethod] = useState('blood')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const parsed = ketoneVal !== '' ? parseFloat(ketoneVal) : null
  const zone = getZone(parsed)

  function handle(formData: FormData) {
    formData.set('log_date', logDate ?? new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('method', method)
    setError(null)
    startTransition(async () => {
      const res = await logKetone(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Ketone level logged!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Field label="Ketone level (mmol/L)" required>
        <input
          name="ketone_mmol"
          type="number"
          placeholder="e.g. 1.5"
          step="0.1"
          min="0"
          max="20"
          value={ketoneVal}
          onChange={e => setKetoneVal(e.target.value)}
          style={{
            padding: '11px 14px', background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
            color: 'var(--ink-900)', outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
      </Field>

      {/* Real-time zone indicator */}
      {zone && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: zone.bg, border: `1px solid ${zone.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: zone.color }}>{zone.label}</div>
            <div style={{ fontSize: 11.5, color: zone.color, opacity: 0.8, marginTop: 2 }}>{zone.range} mmol/L</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: zone.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            {parsed?.toFixed(1)}
          </div>
        </div>
      )}

      {/* Zone reference */}
      {!zone && (
        <div style={{ borderRadius: 12, border: '1px solid var(--cream-200)', overflow: 'hidden' }}>
          {[
            { label: 'Not in ketosis', range: '< 0.5', color: '#7A7468' },
            { label: 'Light ketosis',  range: '0.5–1.0', color: '#C98A1E' },
            { label: 'Optimal',        range: '1.0–3.0', color: '#3F6A4A' },
            { label: 'Therapeutic',    range: '3.0–5.0', color: '#4A7AB5' },
            { label: 'Very high',      range: '> 5.0',   color: '#C85A2A' },
          ].map((z, i, arr) => (
            <div key={z.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--cream-200)' : 'none',
              background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{z.label}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>{z.range}</span>
            </div>
          ))}
        </div>
      )}

      {/* Measurement method */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>Method</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {METHOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 140ms',
                border: method === opt.value ? '1.5px solid var(--forest-400)' : '1.5px solid var(--cream-200)',
                background: method === opt.value ? 'rgba(63,106,74,0.08)' : '#fff',
                color: method === opt.value ? 'var(--forest-400)' : 'var(--ink-600)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Any context — fasted, post-workout, etc." rows={2} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log ketones" loading={isPending} />
    </form>
  )
}
