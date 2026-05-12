'use client'

import { useState, useEffect } from 'react'

export default function ClientGreeting({ firstName }: { firstName: string }) {
  const [tod, setTod] = useState<string | null>(null)

  useEffect(() => {
    const h = new Date().getHours()
    setTod(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening')
  }, [])

  return (
    <span>
      {tod ? `Good ${tod}, ` : ''}
      <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>{firstName}</em>
      {tod ? '.' : ''}
    </span>
  )
}
