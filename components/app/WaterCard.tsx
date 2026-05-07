'use client'

import { useState, useTransition } from 'react'
import { Plus, Minus } from 'lucide-react'
import { logWater } from '@/app/actions/log'

export default function WaterCard({ glasses, goal, userId, today }: {
  glasses: number; goal: number; userId: string; today: string
}) {
  const [count, setCount] = useState(glasses)
  const [isPending, startTransition] = useTransition()

  function addGlass() {
    const next = count + 1
    setCount(next)
    startTransition(async () => {
      await logWater({ userId, date: today, amountMl: 240 })
    })
  }

  function removeGlass() {
    if (count <= 0) return
    setCount(c => c - 1)
  }

  const pct = Math.min(100, goal > 0 ? (count / goal) * 100 : 0)
  const color = pct >= 100 ? 'var(--forest-400)' : pct >= 60 ? 'var(--forest-300)' : '#6FB8A8'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 2px 12px rgba(31,45,42,0.06)',
      border: '1px solid var(--ink-100)',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 16px' }}>
        Water intake
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1 }}>
            {count} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--ink-500)' }}>/ {goal} glasses</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            {Math.round(count * 240 / 1000 * 10) / 10}L today
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={removeGlass} disabled={count <= 0 || isPending}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'transparent', cursor: count > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: count === 0 ? 0.4 : 1, color: 'var(--ink-600)' }}>
            <Minus size={14} />
          </button>
          <button onClick={addGlass} disabled={isPending}
            style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(31,45,42,0.15)', transition: 'background 200ms' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Glass bubbles */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} style={{
            width: 20, height: 28, borderRadius: 4,
            background: i < count ? color : 'var(--ink-100)',
            transition: 'background 200ms',
          }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 999, transition: 'width 400ms ease',
        }} />
      </div>
    </div>
  )
}
