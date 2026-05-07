'use client'

import { useState, useTransition } from 'react'
import { logWeight } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Input, SubmitBtn } from './shared'

export default function LogWeight({ currentLbs, goalLbs, onSuccess }: {
  currentLbs: number | null; goalLbs: number | null; onSuccess: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await logWeight(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Weight logged!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {currentLbs && (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'var(--cream-100)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', fontSize: 14,
        }}>
          <span style={{ color: 'var(--ink-600)' }}>Last recorded</span>
          <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{currentLbs} lbs</span>
        </div>
      )}
      {goalLbs && (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: '#EEF3EF', border: '1px solid var(--forest-200)',
          display: 'flex', justifyContent: 'space-between', fontSize: 14,
        }}>
          <span style={{ color: 'var(--ink-600)' }}>Goal weight</span>
          <span style={{ fontWeight: 600, color: 'var(--forest-400)' }}>{goalLbs} lbs</span>
        </div>
      )}

      <Field label="Today's weight (lbs)" required>
        <Input name="weight_lbs" type="number" placeholder={currentLbs ? String(currentLbs) : '165'} />
      </Field>

      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Log weight" loading={isPending} />
    </form>
  )
}
