'use client'

function kgToLbs(kg: number) { return Math.round(kg * 2.20462 * 10) / 10 }

type WeightEntry = { weight_kg: number; log_date: string }

export default function WeightCard({ currentKg, goalKg, recentWeights }: {
  currentKg: number | null
  goalKg: number | null
  recentWeights: WeightEntry[]
}) {
  const currentLbs = currentKg ? kgToLbs(currentKg) : null
  const goalLbs = goalKg ? kgToLbs(goalKg) : null

  // Simple progress: how far from start to goal
  const firstWeight = recentWeights.length > 0 ? recentWeights[recentWeights.length - 1].weight_kg : currentKg
  let progress = 0
  if (firstWeight && goalKg && currentKg) {
    if (goalKg < firstWeight) {
      // Weight loss
      progress = Math.max(0, Math.min(100, ((firstWeight - currentKg) / (firstWeight - goalKg)) * 100))
    } else if (goalKg > firstWeight) {
      // Weight gain
      progress = Math.max(0, Math.min(100, ((currentKg - firstWeight) / (goalKg - firstWeight)) * 100))
    } else {
      progress = 100
    }
  }

  // Sparkline data (max 7 points)
  const weights = [...recentWeights].reverse().map(w => w.weight_kg)
  const min = weights.length > 0 ? Math.min(...weights) - 2 : 0
  const max = weights.length > 0 ? Math.max(...weights) + 2 : 100
  const range = max - min || 1

  const W = 200, H = 48
  const points = weights.map((w, i) => {
    const x = weights.length > 1 ? (i / (weights.length - 1)) * W : W / 2
    const y = H - ((w - min) / range) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 2px 12px rgba(31,45,42,0.06)',
      border: '1px solid var(--ink-100)',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 16px' }}>
        Weight
      </h3>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1 }}>
            {currentLbs ?? '—'} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--ink-500)' }}>lbs</span>
          </div>
          {goalLbs && (
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
              Goal: <strong style={{ color: 'var(--forest-400)' }}>{goalLbs} lbs</strong>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {weights.length > 1 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
            <polyline
              points={points}
              fill="none"
              stroke="var(--terracotta-300)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Last point dot */}
            {weights.length > 0 && (() => {
              const last = weights[weights.length - 1]
              const x = W
              const y = H - ((last - min) / range) * H
              return <circle cx={x} cy={y} r={4} fill="var(--terracotta-400)" />
            })()}
          </svg>
        )}
      </div>

      {/* Progress toward goal */}
      {goalKg && currentKg && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-500)' }}>
            <span>Progress toward goal</span>
            <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'var(--forest-400)', borderRadius: 999,
              transition: 'width 700ms ease',
            }} />
          </div>
        </div>
      )}

      {!currentKg && (
        <p style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 8 }}>Log your weight to start tracking.</p>
      )}
    </div>
  )
}
