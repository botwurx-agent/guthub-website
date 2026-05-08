'use client'

import { useState, useTransition } from 'react'
import { logNote } from '@/app/actions/log'
import { SuccessBanner, ErrorBanner, Field, Textarea, SubmitBtn } from './shared'

export default function LogNote({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(formData: FormData) {
    formData.set('log_date', new Date().toLocaleDateString('en-CA'))
    setError(null)
    startTransition(async () => {
      const res = await logNote(formData)
      if (res?.error) setError(res.error)
      else { setDone(true); setTimeout(onSuccess, 1200) }
    })
  }

  if (done) return <SuccessBanner message="Note saved!" />

  return (
    <form action={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Journal entry" required>
        <Textarea
          name="content"
          placeholder="How are you feeling today? Any changes, observations, or things you want to remember…"
          rows={6}
        />
      </Field>
      <p style={{ fontSize: 12.5, color: 'var(--ink-400)', margin: 0, lineHeight: 1.5 }}>
        Notes are private and visible only to you and your GutHub coach context.
      </p>
      {error && <ErrorBanner message={error} />}
      <SubmitBtn label="Save note" loading={isPending} />
    </form>
  )
}
