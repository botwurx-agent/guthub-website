'use client'

import { useState, useTransition } from 'react'
import { logWater } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, SubmitBtn } from './shared'

const PRESETS = [
  { label: '½ glass', ml: 120 },
  { label: '1 glass', ml: 240 },
  { label: '1 bottle', ml: 500 },
  { label: '1 litre', ml: 1000 },
]

export default function LogWater({ userId, currentGlasses, onSuccess, logDate }: {
  userId: string; currentGlasses: number; onSuccess: () => void; logDate?: string
}) {
  const [selected, setSelected] = useState<number>(240)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle() {
    setError(null)
    const date = logDate ?? new Date().toLocaleDateString('en-CA')
    startTransition(async () => {
      const res = await logWater({ userId, date, amountMl: selected })
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1000) }
    })
  }

  if (done) return <SuccessBanner message="Water logged!" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current count */}
      <div style={{
        textAlign: 'center', padding: '20px',
        background: 'var(--cream-100)', borderRadius: 16,
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1 }}>
          {currentGlasses}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>
          {logDate && logDate !== new Date().toLocaleDateString('en-CA') ? 'glasses logged today (adding to past date)' : 'glasses today'}
        </div>
      </div>

      {/* Presets */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
          How much to add?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PRESETS.map(p => (
            <button key={p.ml} type="button" onClick={() => setSelected(p.ml)} style={{
              padding: '14px', borderRadius: 12, border: `1.5px solid ${selected === p.ml ? 'var(--terracotta-400)' : 'var(--border)'}`,
              background: selected === p.ml ? 'var(--terracotta-50)' : '#fff',
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 160ms',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: selected === p.ml ? 'var(--terracotta-600)' : 'var(--ink-800)' }}>
                {p.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{p.ml}ml</div>
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label={`Add ${selected}ml`} loading={isPending} onClick={handle} />
    </div>
  )
}
