'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3 } from 'lucide-react'

type GutScorePoint  = { score_date: string; score: number }
type WeightPoint    = { log_date: string; weight_kg: number }
type SymptomCount   = { symptom_type: string; count: number; avgSeverity: number }
type Correlation    = { id: string; food_item: string; symptom_type: string; correlation_score: number; occurrence_count: number; llm_synthesis: string }
type Insight        = { id: string; insight_type: string; title: string; body: string }

const SYMPTOM_COLORS: Record<string, string> = {
  bloating: '#e07b54', gas: '#f0a070', cramping: '#c05030',
  diarrhea: '#4a7c6f', constipation: '#2d5a4e', nausea: '#8b5cf6',
  pain: '#ef4444', fatigue: '#6b7280', other: '#9ca3af',
}

// ── Simple SVG line chart ─────────────────────────────────────────────────────
function LineChart({
  data, color = '#4a7c6f', height = 100,
  yMin, yMax, showDots = true,
}: {
  data: { x: number; y: number; label: string }[]
  color?: string; height?: number
  yMin?: number; yMax?: number; showDots?: boolean
}) {
  if (data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 13 }}>
      Not enough data yet
    </div>
  )

  const W = 400
  const H = height
  const PAD = { t: 10, r: 10, b: 20, l: 36 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const ys = data.map(d => d.y)
  const minY = yMin ?? Math.min(...ys)
  const maxY = yMax ?? Math.max(...ys)
  const rangeY = maxY - minY || 1

  const px = (i: number) => PAD.l + (i / (data.length - 1)) * innerW
  const py = (v: number) => PAD.t + (1 - (v - minY) / rangeY) * innerH

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(d.y).toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${px(data.length - 1).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L ${PAD.l.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`

  // Y-axis grid lines
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: PAD.t + (1 - t) * innerH,
    label: Math.round(minY + t * rangeY).toString(),
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {/* Grid */}
      {gridYs.map((g, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={g.y} x2={W - PAD.r} y2={g.y} stroke="var(--cream-200)" strokeWidth={1} />
          <text x={PAD.l - 4} y={g.y + 4} textAnchor="end" fontSize={9} fill="var(--ink-300)">{g.label}</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaD} fill={color} fillOpacity={0.08} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {showDots && data.map((d, i) => (
        <circle key={i} cx={px(i)} cy={py(d.y)} r={3} fill={color} />
      ))}
      {/* X-axis labels (first, middle, last) */}
      {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--ink-300)">
          {data[i]?.label}
        </text>
      ))}
    </svg>
  )
}

// ── Correlation strength bar ──────────────────────────────────────────────────
function CorrelationBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f97316' : '#eab308'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--cream-200)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 30 }}>{pct}%</span>
    </div>
  )
}

// ── Insight type icon ─────────────────────────────────────────────────────────
function InsightIcon({ type }: { type: string }) {
  const props = { size: 18 }
  if (type === 'trend') return <TrendingUp {...props} color="var(--forest-500)" />
  if (type === 'correlation') return <AlertCircle {...props} color="var(--terracotta-500)" />
  return <BarChart3 {...props} color="var(--ink-400)" />
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InsightsClient() {
  const [gutScores,    setGutScores]    = useState<GutScorePoint[]>([])
  const [weights,      setWeights]      = useState<WeightPoint[]>([])
  const [symptomCounts, setSymptomCounts] = useState<SymptomCount[]>([])
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [insights,     setInsights]     = useState<Insight[]>([])
  const [loading,      setLoading]      = useState(true)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [analysisMsg,  setAnalysisMsg]  = useState('')
  const supabase = createClient()

  const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { data: scores },
      { data: wts },
      { data: syms },
      { data: corrs },
      { data: ins },
    ] = await Promise.all([
      supabase.from('gut_scores').select('score_date, score').gte('score_date', since).order('score_date'),
      supabase.from('weight_logs').select('log_date, weight_kg').gte('log_date', since).order('log_date'),
      supabase.from('symptom_logs').select('symptom_type, severity').gte('log_date', since),
      supabase.from('correlations').select('*').order('correlation_score', { ascending: false }),
      supabase.from('insights').select('*').eq('dismissed', false).order('created_at', { ascending: false }).limit(10),
    ])

    setGutScores(scores ?? [])
    setWeights(wts ?? [])

    // Aggregate symptoms
    const counts: Record<string, { count: number; totalSev: number }> = {}
    ;(syms ?? []).forEach(s => {
      if (!counts[s.symptom_type]) counts[s.symptom_type] = { count: 0, totalSev: 0 }
      counts[s.symptom_type].count++
      counts[s.symptom_type].totalSev += s.severity ?? 0
    })
    setSymptomCounts(
      Object.entries(counts)
        .map(([symptom_type, v]) => ({ symptom_type, count: v.count, avgSeverity: Math.round(v.totalSev / v.count) }))
        .sort((a, b) => b.count - a.count)
    )

    setCorrelations(corrs ?? [])
    setInsights(ins ?? [])
    setLoading(false)
  }, [since])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function runAnalysis() {
    setAnalyzing(true)
    setAnalysisMsg('Analyzing your last 30 days…')
    const res = await fetch('/api/insights/analyze', { method: 'POST' })
    if (res.status === 422) {
      setAnalysisMsg('Log at least a few meals and symptoms first, then run analysis again.')
    } else if (!res.ok) {
      setAnalysisMsg('Analysis failed — please try again.')
    } else {
      setAnalysisMsg('')
      await fetchAll()
    }
    setAnalyzing(false)
  }

  // Chart data helpers
  const gutChartData = gutScores.map(g => ({
    x: 0, y: g.score,
    label: new Date(g.score_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const weightChartData = weights.map(w => ({
    x: 0, y: w.weight_kg,
    label: new Date(w.log_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  // Gut score trend direction
  const gutTrend = (() => {
    if (gutScores.length < 3) return 'flat'
    const half = Math.floor(gutScores.length / 2)
    const avg1 = gutScores.slice(0, half).reduce((s, g) => s + g.score, 0) / half
    const avg2 = gutScores.slice(half).reduce((s, g) => s + g.score, 0) / (gutScores.length - half)
    return avg2 - avg1 > 3 ? 'up' : avg1 - avg2 > 3 ? 'down' : 'flat'
  })()

  const TrendIcon = gutTrend === 'up' ? TrendingUp : gutTrend === 'down' ? TrendingDown : Minus
  const trendColor = gutTrend === 'up' ? '#16a34a' : gutTrend === 'down' ? '#dc2626' : 'var(--ink-400)'
  const trendLabel = gutTrend === 'up' ? 'Improving' : gutTrend === 'down' ? 'Declining' : 'Stable'

  const latestScore = gutScores.at(-1)?.score ?? null

  if (loading) {
    return (
      <div style={{ padding: '32px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--cream-200)', borderTopColor: 'var(--forest-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0, color: 'var(--ink-900)' }}>
            Insights
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-400)' }}>
            30-day patterns, trends, and food-symptom correlations
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: analyzing ? 'var(--ink-200)' : 'var(--forest-500)',
            color: analyzing ? 'var(--ink-400)' : '#fff',
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontSize: 14, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={16} />
          {analyzing ? 'Analyzing…' : 'Run Analysis'}
        </button>
      </div>

      {analysisMsg && (
        <div style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--ink-600)' }}>
          {analysisMsg}
        </div>
      )}

      {/* Row 1: Gut score chart + summary card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Card title="Gut Score — Last 30 Days">
          <LineChart data={gutChartData} color="var(--forest-500)" height={130} yMin={0} yMax={100} />
        </Card>
        <Card title="Score Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
            {latestScore !== null && (
              <div>
                <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-display)', color: scoreColor(latestScore), lineHeight: 1 }}>
                  {Math.round(latestScore)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>Latest score</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendIcon size={18} color={trendColor} />
              <span style={{ fontSize: 14, fontWeight: 600, color: trendColor }}>{trendLabel}</span>
            </div>
            {gutScores.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>Log symptoms and BMs to see your gut score.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Weight + Symptoms */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 16 }}>
        <Card title="Weight Trend">
          {weightChartData.length >= 2
            ? <LineChart data={weightChartData} color="var(--terracotta-500)" height={120} showDots />
            : <EmptyCard msg="Log weight to see your trend." />
          }
        </Card>
        <Card title="Symptom Frequency">
          {symptomCounts.length === 0
            ? <EmptyCard msg="No symptoms logged in the last 30 days." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {symptomCounts.slice(0, 6).map(s => (
                  <div key={s.symptom_type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: SYMPTOM_COLORS[s.symptom_type] ?? SYMPTOM_COLORS.other,
                    }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-700)', flex: 1, textTransform: 'capitalize' }}>
                      {s.symptom_type}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{s.count}×</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>avg {s.avgSeverity}/10</span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* Row 3: Correlations */}
      <Card title="Food–Symptom Correlations" style={{ marginBottom: 16 }}>
        {correlations.length === 0 ? (
          <EmptyCard msg='Click "Run Analysis" to find which foods may be triggering your symptoms.' />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, paddingTop: 8 }}>
            {correlations.map(c => (
              <div key={c.id} style={{
                background: 'var(--cream-50)', border: '1px solid var(--cream-200)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-800)', textTransform: 'capitalize' }}>{c.food_item}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-400)', textTransform: 'capitalize', marginTop: 2 }}>→ {c.symptom_type}</div>
                  </div>
                  {c.occurrence_count > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--ink-300)', background: 'var(--cream-100)', borderRadius: 6, padding: '2px 7px' }}>
                      {c.occurrence_count}× observed
                    </span>
                  )}
                </div>
                <CorrelationBar score={c.correlation_score} />
                {c.llm_synthesis && (
                  <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '10px 0 0', lineHeight: 1.6 }}>
                    {c.llm_synthesis}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Row 4: AI Insights */}
      {insights.length > 0 && (
        <Card title="AI Observations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            {insights.map(ins => (
              <div key={ins.id} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 10,
              }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <InsightIcon type={ins.insight_type} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>{ins.title}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>{ins.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: '18px 20px', ...style }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-400)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function EmptyCard({ msg }: { msg: string }) {
  return (
    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.6 }}>{msg}</p>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#ca8a04'
  return '#dc2626'
}
