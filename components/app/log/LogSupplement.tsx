'use client'

import { useState, useTransition } from 'react'
import { logSupplement } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, Textarea, SubmitBtn } from './shared'

// Common supplements for chronic gut-condition users — quick-tap chips
const COMMON = [
  'L-glutamine',
  'Probiotic',
  'Digestive enzymes',
  'Vitamin D',
  'Magnesium',
  'Zinc',
  'Omega-3',
  'Iron',
  'Slippery elm',
  'Curcumin',
  'NAC',
  'Methylated B-complex',
]

export default function LogSupplement({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [withFood, setWithFood] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    const trimmed = name.trim()
    if (!trimmed) return setError('Please enter a supplement name.')
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    formData.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    formData.set('name', trimmed)
    formData.set('dose', dose.trim())
    formData.set('with_food', withFood ? 'true' : 'false')
    setError(null)
    startTransition(async () => {
      const res = await logSupplement(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Logged!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Supplement" required>
        <Input name="name" placeholder="e.g., Probiotic, L-glutamine" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {COMMON.map(c => {
            const active = name.toLowerCase() === c.toLowerCase()
            return (
              <button key={c} type="button" onClick={() => setName(c)} style={{
                padding: '5px 11px', borderRadius: 999,
                border: `1px solid ${active ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
                background: active ? 'var(--terracotta-50)' : '#fff',
                color: active ? 'var(--terracotta-600)' : 'var(--ink-600)',
                fontSize: 12, fontWeight: active ? 600 : 500,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 140ms',
              }}>
                {c}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Dose (optional)">
        <Input name="dose_input" placeholder="e.g., 1000 IU, 5g, 2 capsules" value={dose} onChange={e => setDose(e.target.value)} />
      </Field>

      <button type="button" onClick={() => setWithFood(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        background: withFood ? 'var(--terracotta-50)' : 'var(--cream-50)',
        border: `1px solid ${withFood ? 'var(--terracotta-300)' : 'var(--cream-200)'}`,
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        textAlign: 'left', transition: 'all 140ms',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5,
          background: withFood ? 'var(--terracotta-400)' : '#fff',
          border: `1.5px solid ${withFood ? 'var(--terracotta-400)' : 'var(--ink-300)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {withFood && '✓'}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: withFood ? 'var(--terracotta-600)' : 'var(--ink-800)' }}>
            Taken with food
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>
            Helps the AI correlate absorption and tolerability
          </div>
        </div>
      </button>

      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Brand, batch, how you felt after…" rows={2} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log supplement" loading={isPending} />
    </form>
  )
}
