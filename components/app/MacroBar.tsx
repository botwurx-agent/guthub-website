'use client'

import { useEffect, useState } from 'react'

export default function MacroBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [pct, setPct] = useState(0)
  const target = Math.min(100, max > 0 ? (value / max) * 100 : 0)

  useEffect(() => {
    const t = setTimeout(() => setPct(target), 80)
    return () => clearTimeout(t)
  }, [target])

  const over = value > max

  return (
    <div style={{ height: 8, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: over ? 'var(--error)' : color,
        borderRadius: 999,
        transition: 'width 700ms cubic-bezier(0.34,1.2,0.64,1)',
      }} />
    </div>
  )
}
