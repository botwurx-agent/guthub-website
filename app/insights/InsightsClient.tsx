'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeGutScore } from '@/lib/gut-score'
import { Sparkles, TrendingUp, TrendingDown, Minus, Download, FileText, ArrowRight, Paperclip, MessageSquare } from 'lucide-react'

type GutScorePoint = { score_date: string; score: number }
type WeightPoint   = { log_date: string; weight_kg: number }
type SymptomLog    = { symptom_type: string; severity: number; log_date: string }
type BmLog         = { log_date: string; bristol_type: number; urgency?: number | null; pain?: number | null }
type Correlation   = { id: string; food_item: string; symptom_type: string; correlation_score: number; occurrence_count: number; llm_synthesis: string }
type Insight       = { id: string; insight_type: string; title: string; body: string }
type LabReport     = { id: string; filename: string; report_date: string | null; analysis_summary: string | null; storage_path: string }
type MealStat      = { protein_g: number | null; calories: number | null }
type MacroTarget   = { protein_g: number | null; total_calories: number | null }

// ── Simple fill chart (no axis labels) ───────────────────────────────────────
function TrendChart({
  data, color = 'var(--terracotta-400)', height = 80,
  min, max,
}: {
  data: number[]
  color?: string; height?: number
  min?: number; max?: number
}) {
  if (data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 12 }}>
      Not enough data
    </div>
  )
  const W = 100, H = 28
  const lo = min ?? Math.min(...data)
  const hi = max ?? Math.max(...data)
  const range = hi - lo || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - lo) / range) * H}`)
  const path = `M ${pts.join(' L ')}`
  const fill = `${path} L ${W},${H} L 0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <path d={fill} fill={color} opacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Correlation bar ────────────────────────────────────────────────────────
function CorrelationBar({ rate, tone }: { rate: number; tone: 'bad' | 'warn' | 'good' }) {
  const bg = tone === 'bad' ? 'var(--terracotta-400)' : tone === 'warn' ? '#f59e0b' : 'var(--forest-400)'
  return (
    <div style={{ height: 6, background: 'var(--cream-200)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${rate}%`, height: '100%', background: bg, borderRadius: 3 }} />
    </div>
  )
}

// ── Confidence pill ────────────────────────────────────────────────────────
function ConfidencePill({ label, tone }: { label: string; tone: 'bad' | 'warn' | 'good' }) {
  const colors = {
    bad:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    warn: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    good: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  }
  const c = colors[tone]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 999, padding: '3px 10px', flexShrink: 0 }}>
      {label}
    </span>
  )
}

export default function InsightsClient() {
  const [tab, setTab]               = useState<'trends' | 'patterns' | 'labs'>('trends')
  const [gutScores, setGutScores]   = useState<GutScorePoint[]>([])
  const [weights,   setWeights]     = useState<WeightPoint[]>([])
  const [symptoms,  setSymptoms]    = useState<SymptomLog[]>([])
  const [bmLogs,    setBmLogs]      = useState<BmLog[]>([])
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [insights,  setInsights]    = useState<Insight[]>([])
  const [labReports, setLabReports] = useState<LabReport[]>([])
  const [mealStats, setMealStats]   = useState<MealStat[]>([])
  const [waterTotal, setWaterTotal] = useState<number>(0)
  const [macroTarget, setMacroTarget] = useState<MacroTarget | null>(null)
  const [loading,   setLoading]     = useState(true)
  const [analyzing, setAnalyzing]   = useState(false)
  const [analysisMsg, setAnalysisMsg] = useState('')
  const [uploading, setUploading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const [
        { data: wts },
        { data: syms },
        { data: bms },
        { data: corrs },
        { data: ins },
        { data: labs },
        { data: meals },
        { data: water },
        { data: macTarget },
      ] = await Promise.all([
        supabase.from('weight_logs').select('log_date, weight_kg').gte('log_date', since).order('log_date'),
        supabase.from('symptom_logs').select('symptom_type, severity, log_date').gte('log_date', since).order('log_date'),
        supabase.from('bm_logs').select('log_date, bristol_type, urgency, pain').gte('log_date', since).order('log_date'),
        supabase.from('correlations').select('*').order('correlation_score', { ascending: false }),
        supabase.from('insights').select('*').eq('dismissed', false).order('created_at', { ascending: false }).limit(10),
        user ? supabase.from('lab_reports').select('id, filename, report_date, analysis_summary, storage_path').eq('user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        supabase.from('meal_logs').select('protein_g, calories').gte('log_date', since),
        supabase.from('water_logs').select('amount_ml').gte('log_date', since),
        supabase.from('macro_targets').select('protein_g, total_calories').eq('user_id', user?.id ?? '').order('target_date', { ascending: false }).limit(1).single(),
      ])

      // Compute daily gut scores from symptom + BM logs (same formula as dashboard)
      const allDates = Array.from(new Set([
        ...(syms ?? []).map(s => s.log_date),
        ...(bms ?? []).map(b => b.log_date),
      ])).sort()
      const computedScores: GutScorePoint[] = allDates.map(date => {
        const daySymptoms = (syms ?? []).filter(s => s.log_date === date)
        const dayBms = (bms ?? []).filter(b => b.log_date === date)
        const { score } = computeGutScore(daySymptoms, dayBms)
        return { score_date: date, score }
      })

      setGutScores(computedScores)
      setWeights(wts ?? [])
      setSymptoms(syms ?? [])
      setBmLogs(bms ?? [])
      setCorrelations(corrs ?? [])
      setInsights(ins ?? [])
      setLabReports((labs ?? []) as LabReport[])
      setMealStats(meals ?? [])
      setWaterTotal((water ?? []).reduce((sum, w) => sum + Number(w.amount_ml ?? 0), 0))
      if (macTarget) setMacroTarget(macTarget as MacroTarget)
    } catch {
      // network/auth error — still stop the spinner
    } finally {
      setLoading(false)
    }
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

  async function uploadLab(file: File) {
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('lab-reports').upload(path, file)
    if (!upErr) {
      await supabase.from('lab_reports').insert({
        user_id: user.id, filename: file.name, storage_path: path,
        report_date: new Date().toISOString().split('T')[0],
      })
      await fetchAll()
    }
    setUploading(false)
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const gutScoreValues  = gutScores.map(g => g.score)
  const weightValues    = weights.map(w => w.weight_kg)
  const latestScore     = gutScores.at(-1)?.score ?? null
  const latestWeight    = weights.at(-1)?.weight_kg ?? null

  const gutDelta = gutScores.length >= 2
    ? Math.round(gutScores.at(-1)!.score - gutScores[0].score)
    : null

  const weightDelta = weights.length >= 2
    ? Math.round((weights.at(-1)!.weight_kg - weights[0].weight_kg) * 10) / 10
    : null

  const bloatingByDate: Record<string, { sum: number; count: number }> = {}
  symptoms.filter(s => s.symptom_type === 'bloating').forEach(s => {
    if (!bloatingByDate[s.log_date]) bloatingByDate[s.log_date] = { sum: 0, count: 0 }
    bloatingByDate[s.log_date].sum += s.severity
    bloatingByDate[s.log_date].count++
  })
  const bloatingValues = Object.entries(bloatingByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => Math.round(v.sum / v.count * 10) / 10)

  const avgProtein = mealStats.length > 0
    ? Math.round(mealStats.reduce((s, m) => s + Number(m.protein_g ?? 0), 0) / mealStats.length)
    : null
  const avgCalories = mealStats.length > 0
    ? Math.round(mealStats.reduce((s, m) => s + Number(m.calories ?? 0), 0) / mealStats.length)
    : null
  const avgWaterOz = waterTotal > 0 ? Math.round(waterTotal * 0.033814 / 30) : null

  const gutTrend = (() => {
    if (gutScores.length < 3) return 'flat'
    const half = Math.floor(gutScores.length / 2)
    const avg1 = gutScores.slice(0, half).reduce((s, g) => s + g.score, 0) / half
    const avg2 = gutScores.slice(half).reduce((s, g) => s + g.score, 0) / (gutScores.length - half)
    return avg2 - avg1 > 3 ? 'up' : avg1 - avg2 > 3 ? 'down' : 'flat'
  })()
  const TrendIcon = gutTrend === 'up' ? TrendingUp : gutTrend === 'down' ? TrendingDown : Minus
  const trendColor = gutTrend === 'up' ? '#16a34a' : gutTrend === 'down' ? '#dc2626' : 'var(--ink-400)'

  // Sort symptom counts
  const symptomCounts: { type: string; count: number; avgSev: number }[] = Object.entries(
    symptoms.reduce((acc, s) => {
      if (!acc[s.symptom_type]) acc[s.symptom_type] = { count: 0, total: 0 }
      acc[s.symptom_type].count++
      acc[s.symptom_type].total += s.severity
      return acc
    }, {} as Record<string, { count: number; total: number }>)
  ).map(([type, v]) => ({ type, count: v.count, avgSev: Math.round(v.total / v.count) }))
    .sort((a, b) => b.count - a.count)

  const goodInsights = insights.filter(i => ['positive', 'achievement', 'goal'].includes(i.insight_type))
  const warnInsights = insights.filter(i => !['positive', 'achievement', 'goal'].includes(i.insight_type))

  if (loading) {
    return (
      <div style={{ padding: '32px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--cream-200)', borderTopColor: 'var(--forest-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="app-page-content" style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
            Insights
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
            Patterns become <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>clarity</em>.
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)', maxWidth: 520 }}>
            Your gut score, weight, symptoms, and food patterns — together.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
              borderRadius: 10, padding: '9px 16px',
              fontSize: 14, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer',
              color: analyzing ? 'var(--ink-400)' : 'var(--ink-600)', transition: 'all 140ms',
            }}
          >
            <Sparkles size={15} />
            {analyzing ? 'Analyzing…' : 'Run analysis'}
          </button>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--terracotta-500)', border: 'none',
              borderRadius: 10, padding: '9px 16px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff',
            }}
            onClick={() => window.print()}
          >
            <Download size={15} /> Doctor report
          </button>
        </div>
      </div>

      {analysisMsg && (
        <div style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--ink-600)' }}>
          {analysisMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--cream-200)', paddingBottom: 0 }}>
        {([['trends', 'Trends'], ['patterns', 'Patterns'], ['labs', 'Test reports']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === id ? 700 : 500,
              color: tab === id ? 'var(--ink-900)' : 'var(--ink-400)',
              borderBottom: `2px solid ${tab === id ? 'var(--terracotta-500)' : 'transparent'}`,
              marginBottom: -1, transition: 'all 120ms',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TRENDS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'trends' && (
        <div className="insights-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Gut score — large chart */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)' }}>Gut score</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1, marginTop: 4 }}>
                    {latestScore !== null ? Math.round(latestScore) : '—'}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>30-day</span>
              </div>
              <TrendChart data={gutScoreValues} color="var(--terracotta-400)" height={100} min={0} max={100} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 13 }}>
                {gutDelta !== null ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: gutDelta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    <TrendIcon size={14} color={trendColor} />
                    {gutDelta >= 0 ? '+' : ''}{gutDelta} from 30 days ago
                  </span>
                ) : <span style={{ color: 'var(--ink-300)' }}>Log symptoms to see score</span>}
                {gutScores.length > 0 && (
                  <span style={{ color: 'var(--ink-400)' }}>
                    Average · {Math.round(gutScoreValues.reduce((s, v) => s + v, 0) / gutScoreValues.length)}
                  </span>
                )}
              </div>
            </div>

            {/* Weight + Bloating — 2-col */}
            <div className="insights-chart-pair" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)' }}>Weight</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1, marginTop: 4 }}>
                      {latestWeight !== null ? `${latestWeight} kg` : '—'}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>30-day</span>
                </div>
                <TrendChart data={weightValues} color="var(--forest-400)" height={70} />
                {weightDelta !== null && (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-400)' }}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta} kg in 30 days
                  </div>
                )}
                {weightValues.length < 2 && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-300)' }}>Log weight to see trend</div>}
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)' }}>Bloating · severity</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1, marginTop: 4 }}>
                      {bloatingValues.length > 0 ? `${bloatingValues.at(-1)}/10` : '—'}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>30-day</span>
                </div>
                <TrendChart data={bloatingValues} color="#f59e0b" height={70} min={0} max={10} />
                {bloatingValues.length >= 2 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-400)' }}>
                    Avg {(bloatingValues.reduce((s, v) => s + v, 0) / bloatingValues.length).toFixed(1)}/10
                  </div>
                )}
                {bloatingValues.length < 2 && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-300)' }}>Log symptoms to see trend</div>}
              </div>
            </div>

            {/* Macros this month */}
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 16 }}>Macros, this month</div>
              <div className="insights-symptom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricStat
                  label="Avg protein"
                  val={avgProtein !== null ? `${avgProtein} g` : '—'}
                  sub={macroTarget?.protein_g ? `Target ${macroTarget.protein_g} g` : 'No target set'}
                  trend={avgProtein && macroTarget?.protein_g ? (avgProtein >= macroTarget.protein_g * 0.9 ? 'good' : 'warn') : 'neutral'}
                />
                <MetricStat
                  label="Avg calories"
                  val={avgCalories !== null ? `${avgCalories.toLocaleString()}` : '—'}
                  sub={macroTarget?.total_calories ? `Target ${macroTarget.total_calories.toLocaleString()}` : 'No target set'}
                  trend={avgCalories && macroTarget?.total_calories ? (Math.abs(avgCalories - macroTarget.total_calories) / macroTarget.total_calories < 0.15 ? 'good' : 'warn') : 'neutral'}
                />
                <MetricStat
                  label="Avg hydration"
                  val={avgWaterOz !== null ? `${avgWaterOz} oz` : '—'}
                  sub="Target 80 oz / day"
                  trend={avgWaterOz !== null ? (avgWaterOz >= 72 ? 'good' : 'warn') : 'neutral'}
                />
              </div>
              {symptomCounts.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--cream-100)', margin: '16px 0' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 12 }}>
                    Symptom frequency
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {symptomCounts.slice(0, 5).map(s => (
                      <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: SYMPTOM_COLORS[s.type] ?? '#9ca3af' }} />
                        <span style={{ fontSize: 13, color: 'var(--ink-700)', flex: 1, textTransform: 'capitalize' }}>{s.type}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{s.count}×</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>avg {s.avgSev}/10</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 14 }}>What&apos;s working</div>
              {goodInsights.length === 0 && insights.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>Run analysis to see what&apos;s improving.</p>
              ) : goodInsights.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>No positive trends detected yet — keep logging.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goodInsights.slice(0, 3).map(i => <InsightRow key={i.id} insight={i} tone="good" />)}
                </div>
              )}
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 14 }}>What to watch</div>
              {warnInsights.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>
                  {correlations.length > 0
                    ? 'Looking good — no major concerns flagged.'
                    : 'Run analysis to find potential triggers.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {warnInsights.slice(0, 3).map(i => <InsightRow key={i.id} insight={i} tone="warn" />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PATTERNS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'patterns' && (
        <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>Trigger food correlations</h3>
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>Last 30 days · symptoms within 6 hrs of eating</span>
          </div>

          {correlations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={22} color="var(--ink-300)" />
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--ink-600)' }}>No patterns analyzed yet</p>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--ink-400)' }}>
                Click <strong>Run analysis</strong> above to discover which foods may be triggering your symptoms.
              </p>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--terracotta-500)', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Sparkles size={15} /> {analyzing ? 'Analyzing…' : 'Run analysis'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {correlations.map((c, idx) => {
                const rate = Math.round(c.correlation_score * 100)
                const tone: 'bad' | 'warn' | 'good' = rate > 65 ? 'bad' : rate > 35 ? 'warn' : 'good'
                const confidence = rate > 65 ? 'High' : rate > 35 ? 'Medium' : 'Low'
                return (
                  <div key={c.id} style={{
                    display: 'flex', gap: 20, alignItems: 'flex-start',
                    padding: '14px 0',
                    borderBottom: idx < correlations.length - 1 ? '1px solid var(--cream-100)' : 'none',
                  }}>
                    <div style={{ width: 200, flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-800)', textTransform: 'capitalize' }}>{c.food_item}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--ink-500)' }}>→ <span style={{ textTransform: 'capitalize' }}>{c.symptom_type}</span></span>
                        <span style={{ color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>
                          {c.occurrence_count > 0 ? `${Math.round(c.occurrence_count * c.correlation_score)}/${c.occurrence_count} occurrences` : `${rate}%`}
                        </span>
                      </div>
                      <CorrelationBar rate={rate} tone={tone} />
                      {c.llm_synthesis && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.6 }}>{c.llm_synthesis}</p>
                      )}
                    </div>
                    <ConfidencePill label={confidence} tone={tone} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TEST REPORTS TAB ─────────────────────────────────────────────────── */}
      {tab === 'labs' && (
        <div className="insights-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          {/* Left: report detail or empty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {labReports.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FileText size={24} color="var(--forest-500)" />
                </div>
                <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink-800)' }}>No reports uploaded yet</p>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-400)', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                  Upload a stool test, food sensitivity panel, or blood work — Coach will read and explain your markers.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'var(--terracotta-500)', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Paperclip size={15} /> Choose file
                </button>
              </div>
            ) : (
              labReports.map(r => (
                <div key={r.id} style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{r.filename}</h3>
                      {r.report_date && (
                        <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
                          Uploaded {new Date(r.report_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    {r.analysis_summary && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 10px' }}>
                        Analyzed
                      </span>
                    )}
                  </div>
                  {r.analysis_summary ? (
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.7, background: 'var(--cream-50)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--cream-200)' }}>
                      {r.analysis_summary}
                    </p>
                  ) : (
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-400)' }}>
                      No analysis yet — ask Coach to review this report.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => window.location.href = '/coach'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        background: 'var(--terracotta-500)', color: '#fff', border: 'none',
                        borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <MessageSquare size={14} /> Ask Coach about this
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: upload + past reports */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Upload card */}
            <div style={{ background: 'var(--cream-100)', border: '2px dashed var(--cream-200)', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileText size={22} color="var(--forest-500)" />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink-800)', marginBottom: 6 }}>Upload a lab report</div>
              <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 16, lineHeight: 1.5 }}>
                PDF, photo, or screenshot. Coach reads stool tests, food sensitivity panels, blood work, and more.
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'var(--terracotta-500)', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                <Paperclip size={14} /> {uploading ? 'Uploading…' : 'Choose file'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLab(f) }}
              />
              <div style={{ fontSize: 12, color: 'var(--ink-300)', marginTop: 12 }}>Encrypted · HIPAA-aligned · never shared</div>
            </div>

            {/* Past reports */}
            {labReports.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 14 }}>Past reports</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {labReports.map((r, i) => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: i < labReports.length - 1 ? '1px solid var(--cream-100)' : 'none',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={15} color="var(--forest-500)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.filename}</div>
                        {r.report_date && (
                          <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                            {new Date(r.report_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <button style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowRight size={13} color="var(--ink-400)" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function MetricStat({ label, val, sub, trend }: { label: string; val: string; sub: string; trend: 'good' | 'warn' | 'neutral' }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>{val}</div>
      <div style={{ fontSize: 12, marginTop: 2, color: trend === 'good' ? '#16a34a' : trend === 'warn' ? '#d97706' : 'var(--ink-400)' }}>{sub}</div>
    </div>
  )
}

function InsightRow({ insight, tone }: { insight: { title: string; body: string }; tone: 'good' | 'warn' }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: tone === 'good' ? '#f0fdf4' : '#fef9ec',
        border: `1px solid ${tone === 'good' ? '#bbf7d0' : '#fde68a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {tone === 'good'
          ? <TrendingUp size={15} color="#16a34a" />
          : <Minus size={15} color="#d97706" />
        }
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 2 }}>{insight.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.55 }}>{insight.body}</div>
      </div>
    </div>
  )
}

const SYMPTOM_COLORS: Record<string, string> = {
  bloating: '#e07b54', gas: '#f0a070', cramping: '#c05030',
  diarrhea: '#4a7c6f', constipation: '#2d5a4e', nausea: '#8b5cf6',
  pain: '#ef4444', fatigue: '#6b7280', other: '#9ca3af',
}
