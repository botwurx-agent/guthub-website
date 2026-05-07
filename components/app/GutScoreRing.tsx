'use client'

import { useEffect, useState } from 'react'

const R = 80
const CIRC = 2 * Math.PI * R

export default function GutScoreRing({ score, label, color, symptomCount, bmCount }: {
  score: number; label: string; color: string
  symptomCount: number; bmCount: number
}) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120)
    return () => clearTimeout(t)
  }, [score])

  const dashOffset = CIRC - (animated / 100) * CIRC

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '24px 22px',
      boxShadow: '0 2px 12px rgba(31,45,42,0.06)',
      border: '1px solid var(--ink-100)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 20px', alignSelf: 'flex-start' }}>
        Gut score
      </h3>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width={200} height={200} viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={100} cy={100} r={R} fill="none" stroke="var(--ink-100)" strokeWidth={14} />
          {/* Score arc */}
          <circle
            cx={100} cy={100} r={R} fill="none"
            stroke={color} strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${color}44)` }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1, fontFamily: 'var(--font-body)' }}>
            {Math.round(score)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color, marginTop: 4 }}>{label}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ width: '100%', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ScoreRow icon="🤢" label="Symptoms logged" value={symptomCount} suffix="today" />
        <ScoreRow icon="🪠" label="BMs logged" value={bmCount} suffix="today" />
      </div>

      {score === 100 && (
        <p style={{ fontSize: 12.5, color: 'var(--forest-400)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          No symptoms logged today — keep it up!
        </p>
      )}
      {score < 100 && (
        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Log meals and symptoms to refine your score.
        </p>
      )}
    </div>
  )
}

function ScoreRow({ icon, label, value, suffix }: { icon: string; label: string; value: number; suffix: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-600)' }}>{icon} {label}</span>
      <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{value} {suffix}</span>
    </div>
  )
}
