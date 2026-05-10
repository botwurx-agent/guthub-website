import { createClient } from '@/lib/supabase/server'
import { getUserTimezone, todayInTz, daysAgoInTz } from '@/lib/timezone'
import { computeGutScore, gutScoreLabel } from '@/lib/gut-score'
import { PrintButton, BackButton } from './PrintButton'
import OpenAI from 'openai'
import { AI_MODEL } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Inline SVG trend chart (server-renderable, no client JS) ─────────────
function TrendChart({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', fontSize: 11, color: '#9ca3af' }}>Not enough data yet</div>
  )
  const W = 100, H = 28
  const lo = Math.min(...data)
  const hi = Math.max(...data)
  const range = hi - lo || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - lo) / range) * H}`)
  const path = `M ${pts.join(' L ')}`
  const fill = `${path} L ${W},${H} L 0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <path d={fill} fill={color} opacity={0.15} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Bristol bar chart ─────────────────────────────────────────────────────
function BristolBar({ counts }: { counts: Record<number, number> }) {
  const max = Math.max(...Object.values(counts), 1)
  const BRISTOL_LABELS: Record<number, string> = {
    1: 'Type 1\n(Hard lumps)', 2: 'Type 2\n(Lumpy)', 3: 'Type 3\n(Cracked)',
    4: 'Type 4\n(Smooth)', 5: 'Type 5\n(Soft)', 6: 'Type 6\n(Fluffy)', 7: 'Type 7\n(Liquid)',
  }
  const barColor = (t: number) => t === 4 ? '#3F6A4A' : t === 3 || t === 5 ? '#7FB77E' : t === 2 || t === 6 ? '#C98A1E' : '#B4422C'
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 64 }}>
      {[1, 2, 3, 4, 5, 6, 7].map(t => {
        const count = counts[t] ?? 0
        const pct = (count / max) * 100
        return (
          <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>{count || ''}</div>
            <div style={{ width: '100%', background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', height: 44 }}>
              <div style={{ width: '100%', height: `${pct}%`, background: barColor(t), marginTop: 'auto', transition: 'height 0.3s' }} />
            </div>
            <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', lineHeight: 1.2 }}>T{t}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const { label, color } = gutScoreLabel(score)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{Math.round(score)}</span>
      <div>
        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>/ 100</div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHeader({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #1a3a2e' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a3a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{n}</div>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1a3a2e' }}>{title}</h2>
    </div>
  )
}

// ── Stat cell ─────────────────────────────────────────────────────────────
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f3f4f6' }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', border: '1px solid #e5e7eb' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#374151' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default async function DoctorReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tz = await getUserTimezone()
  const today = todayInTz(tz)
  const since30 = daysAgoInTz(tz, 30)
  const since90 = daysAgoInTz(tz, 90)

  const [
    { data: profile },
    { data: symptomLogs },
    { data: bmLogs },
    { data: weightLogs },
    { data: mealLogs },
    { data: waterLogs },
    { data: macroTarget },
    { data: correlations },
  ] = await Promise.all([
    supabase.from('profiles').select('name, dob, gender, weight_kg, health_profile, starting_weight_kg').eq('id', user.id).single(),
    supabase.from('symptom_logs').select('log_date, symptom_type, severity, notes').eq('user_id', user.id).gte('log_date', since30).order('log_date'),
    supabase.from('bm_logs').select('log_date, bristol_type, urgency, pain, notes').eq('user_id', user.id).gte('log_date', since90).order('log_date'),
    supabase.from('weight_logs').select('log_date, weight_kg').eq('user_id', user.id).gte('log_date', since90).order('log_date'),
    supabase.from('meal_logs').select('log_date, meal_name, calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('log_date', since30).order('log_date'),
    supabase.from('water_logs').select('log_date, amount_ml').eq('user_id', user.id).gte('log_date', since30),
    supabase.from('macro_targets').select('total_calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('correlations').select('food_item, symptom_type, correlation_score, occurrence_count, llm_synthesis').eq('user_id', user.id).order('correlation_score', { ascending: false }).limit(8),
  ])

  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}

  // ── Derived: gut scores per day ─────────────────────────────────────────
  const allDates30 = Array.from(new Set([
    ...(symptomLogs ?? []).map(s => s.log_date),
    ...(bmLogs ?? []).filter(b => b.log_date >= since30).map(b => b.log_date),
  ])).sort()

  const gutScoresByDate = allDates30.map(date => {
    const daySymptoms = (symptomLogs ?? []).filter(s => s.log_date === date)
    const dayBms = (bmLogs ?? []).filter(b => b.log_date === date)
    const { score } = computeGutScore(daySymptoms, dayBms)
    return { date, score }
  })

  const gutScoreValues = gutScoresByDate.map(g => g.score)
  const avgGutScore = gutScoreValues.length > 0
    ? Math.round(gutScoreValues.reduce((s, v) => s + v, 0) / gutScoreValues.length)
    : null
  const latestGutScore = gutScoreValues.at(-1) ?? null
  const gutDelta = gutScoreValues.length >= 2
    ? Math.round((gutScoreValues.at(-1)! - gutScoreValues[0]))
    : null

  // ── Symptom frequency ───────────────────────────────────────────────────
  const symptomStats: Record<string, { count: number; totalSev: number; dates: string[] }> = {}
  for (const s of symptomLogs ?? []) {
    if (!symptomStats[s.symptom_type]) symptomStats[s.symptom_type] = { count: 0, totalSev: 0, dates: [] }
    symptomStats[s.symptom_type].count++
    symptomStats[s.symptom_type].totalSev += s.severity
    symptomStats[s.symptom_type].dates.push(s.log_date)
  }
  const topSymptoms = Object.entries(symptomStats)
    .map(([type, v]) => ({ type, count: v.count, avgSev: Math.round((v.totalSev / v.count) * 10) / 10 }))
    .sort((a, b) => b.count - a.count)

  // ── Bristol distribution ─────────────────────────────────────────────────
  const bristolCounts: Record<number, number> = {}
  for (const b of bmLogs ?? []) {
    bristolCounts[b.bristol_type] = (bristolCounts[b.bristol_type] ?? 0) + 1
  }
  const totalBMs = (bmLogs ?? []).length
  const avgBristol = totalBMs > 0
    ? Math.round((bmLogs ?? []).reduce((s, b) => s + b.bristol_type, 0) / totalBMs * 10) / 10
    : null

  // ── Weight ──────────────────────────────────────────────────────────────
  const latestWeight = weightLogs?.at(-1)?.weight_kg ?? null
  const startingWeight = profile?.starting_weight_kg ?? weightLogs?.[0]?.weight_kg ?? null
  const weightDelta = latestWeight && startingWeight
    ? Math.round((latestWeight - startingWeight) * 10) / 10
    : null
  const weightValues = (weightLogs ?? []).map(w => w.weight_kg)

  // ── Macros ──────────────────────────────────────────────────────────────
  const daysWithMeals = new Set((mealLogs ?? []).map(m => m.log_date)).size || 1
  const avgCalories = mealLogs && mealLogs.length > 0
    ? Math.round(mealLogs.reduce((s, m) => s + (m.calories ?? 0), 0) / daysWithMeals)
    : null
  const avgProtein = mealLogs && mealLogs.length > 0
    ? Math.round(mealLogs.reduce((s, m) => s + (m.protein_g ?? 0), 0) / daysWithMeals)
    : null

  // ── Hydration ───────────────────────────────────────────────────────────
  const totalWaterMl = (waterLogs ?? []).reduce((s, w) => s + Number(w.amount_ml ?? 0), 0)
  const avgWaterOz = totalWaterMl > 0 ? Math.round(totalWaterMl * 0.033814 / 30) : null

  // ── Patient info ─────────────────────────────────────────────────────────
  const patientName = profile?.name ?? user.email ?? 'Patient'
  const dob = profile?.dob as string | null
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null
  const conditions = hp.medical_conditions as string | null
  const goals = Array.isArray(hp.primary_goals)
    ? (hp.primary_goals as string[]).map(g => g.replace(/_/g, ' ')).join(', ')
    : (hp.primary_goals as string | null)?.replace(/_/g, ' ') ?? null
  const allergens = Array.isArray(hp.allergens) ? (hp.allergens as string[]).join(', ') : null
  const eatingStyle = Array.isArray(hp.eating_style)
    ? (hp.eating_style as string[]).join(', ')
    : (hp.eating_style as string | null)

  // ── AI Clinical Narrative ────────────────────────────────────────────────
  let clinicalNarrative = ''
  try {
    const symptomSummary = topSymptoms.slice(0, 5)
      .map(s => `${s.type}: ${s.count} occurrences, avg severity ${s.avgSev}/10`)
      .join('; ')

    const corrSummary = (correlations ?? []).slice(0, 4)
      .map(c => `${c.food_item} → ${c.symptom_type} (${Math.round(c.correlation_score * 100)}%)`)
      .join('; ')

    const prompt = `Write a concise clinical summary for a gastroenterologist or dietitian reviewing this patient's 30-day gut health data. Write in third person. Be specific with numbers. 2-3 short paragraphs. No bullet points.

Patient: ${patientName}${age ? `, age ${age}` : ''}
Conditions: ${conditions || 'none reported'}
Goals: ${goals || 'general gut health'}
Diet: ${eatingStyle || 'standard'}

30-day gut score: avg ${avgGutScore ?? 'N/A'}/100${gutDelta !== null ? `, trend ${gutDelta > 0 ? '+' : ''}${gutDelta} pts` : ''}
Top symptoms: ${symptomSummary || 'none logged'}
Bowel movements logged: ${totalBMs} over 90 days, avg Bristol type ${avgBristol ?? 'N/A'}
Weight: ${latestWeight ? `${(latestWeight * 2.20462).toFixed(1)} lbs` : 'N/A'}${weightDelta ? ` (${weightDelta > 0 ? '+' : ''}${(weightDelta * 2.20462).toFixed(1)} lbs since start)` : ''}
Avg daily calories: ${avgCalories ?? 'N/A'} / target ${macroTarget?.total_calories ? Math.round(macroTarget.total_calories) : 'N/A'}
Avg protein: ${avgProtein ?? 'N/A'}g / target ${macroTarget?.protein_g ? Math.round(macroTarget.protein_g) : 'N/A'}g
Food-symptom correlations: ${corrSummary || 'analysis not yet run'}

Focus on: clinical observations, patterns worth discussing, and 1-2 actionable recommendations for the provider.`

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })
    clinicalNarrative = completion.choices[0].message.content?.trim() ?? ''
  } catch {
    clinicalNarrative = 'Clinical narrative could not be generated at this time. Please review the data sections above.'
  }

  const reportDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const periodStart = new Date(since30 + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const periodEnd   = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f4f6; font-family: 'Inter', sans-serif; }

        .report-screen-chrome {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .report-page {
          max-width: 820px;
          margin: 32px auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          padding: 48px 56px;
        }

        .report-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .report-three-col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .report-four-col {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .report-section {
          margin-bottom: 32px;
        }

        @media print {
          body { background: #fff !important; }
          .report-screen-chrome { display: none !important; }
          .report-page {
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 24px 32px !important;
          }
          .report-section { page-break-inside: avoid; }
          .report-pagebreak { page-break-before: always; }
        }

        @media (max-width: 600px) {
          .report-screen-chrome { padding: 12px 16px; }
          .report-page { margin: 0; border: none; border-radius: 0; padding: 24px 20px; }
          .report-two-col, .report-three-col, .report-four-col { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="report-screen-chrome">
        <BackButton />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>30-day report · {reportDate}</span>
          <PrintButton />
        </div>
      </div>

      {/* Report */}
      <div className="report-page">

        {/* ── Report Header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '3px solid #1a3a2e' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#4a7c6f', marginBottom: 6 }}>
              Patient Gut Health Report
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#111827', lineHeight: 1.2 }}>
              {patientName}
            </h1>
            <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {age && <span>Age: {age}</span>}
              {profile?.gender && <span>Sex: {String(profile.gender)}</span>}
              {conditions && <span>Conditions: {conditions}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1a3a2e' }}>GutHub</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>AI Gut Health Platform</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Report date: {reportDate}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Period: {periodStart} – {periodEnd}</div>
          </div>
        </div>

        {/* ── Patient Context ────────────────────────────────────────────── */}
        {(goals || allergens || eatingStyle) && (
          <div className="report-section" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 8 }}>Patient Context</div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 12, color: '#374151' }}>
              {goals && <div><strong>Goals:</strong> {goals}</div>}
              {allergens && <div><strong>Allergens:</strong> {allergens}</div>}
              {eatingStyle && <div><strong>Diet:</strong> {eatingStyle}</div>}
            </div>
          </div>
        )}

        {/* ── Section 1: Overview ───────────────────────────────────────── */}
        <div className="report-section">
          <SectionHeader n="1" title="30-Day Overview" />
          <div className="report-four-col">
            <Stat
              label="Avg Gut Score"
              value={avgGutScore !== null ? `${avgGutScore}/100` : '—'}
              sub={gutDelta !== null ? `${gutDelta >= 0 ? '+' : ''}${gutDelta} pts trend` : 'Insufficient data'}
            />
            <Stat
              label="Current Weight"
              value={latestWeight ? `${(latestWeight * 2.20462).toFixed(1)} lbs` : '—'}
              sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${(weightDelta * 2.20462).toFixed(1)} lbs change` : undefined}
            />
            <Stat
              label="Symptoms Logged"
              value={String((symptomLogs ?? []).length)}
              sub={`${topSymptoms.length} unique types`}
            />
            <Stat
              label="BMs Logged (90d)"
              value={String(totalBMs)}
              sub={avgBristol !== null ? `Avg Bristol ${avgBristol}` : undefined}
            />
          </div>
        </div>

        {/* ── Section 2: Gut Score Trend ────────────────────────────────── */}
        <div className="report-section">
          <SectionHeader n="2" title="Gut Score Trend (30 Days)" />
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {latestGutScore !== null && <ScoreBadge score={latestGutScore} />}
              <div style={{ marginTop: 12 }}>
                <TrendChart data={gutScoreValues} color="#3F6A4A" height={64} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                <span>{periodStart}</span><span>{periodEnd}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130 }}>
              {[
                ['Average', avgGutScore !== null ? `${avgGutScore}/100` : '—'],
                ['Latest', latestGutScore !== null ? `${Math.round(latestGutScore)}/100` : '—'],
                ['Trend', gutDelta !== null ? `${gutDelta >= 0 ? '↑ +' : '↓ '}${Math.abs(gutDelta)} pts` : '—'],
                ['Days tracked', String(gutScoreValues.length)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>
                  <span style={{ color: '#9ca3af' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 3: Symptom Analysis ───────────────────────────────── */}
        <div className="report-section">
          <SectionHeader n="3" title="Symptom Analysis (30 Days)" />
          {topSymptoms.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No symptoms logged in this period.</p>
          ) : (
            <Table
              headers={['Symptom', 'Occurrences', 'Avg Severity', 'Frequency']}
              rows={topSymptoms.map(s => [
                s.type.charAt(0).toUpperCase() + s.type.slice(1),
                s.count,
                `${s.avgSev} / 10`,
                `${Math.round((s.count / 30) * 100)}% of days`,
              ])}
            />
          )}
        </div>

        {/* ── Section 4: Bowel Movement Patterns ───────────────────────── */}
        <div className="report-section">
          <SectionHeader n="4" title="Bowel Movement Patterns (90 Days)" />
          {totalBMs === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No bowel movements logged in this period.</p>
          ) : (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <BristolBar counts={bristolCounts} />
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>Bristol Stool Scale (Type 4 = ideal)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                {[
                  ['Total logged', String(totalBMs)],
                  ['Avg Bristol type', avgBristol !== null ? String(avgBristol) : '—'],
                  ['Type 3–5 (ideal)', `${Math.round(([3,4,5].reduce((s,t) => s + (bristolCounts[t] ?? 0), 0) / totalBMs) * 100)}%`],
                  ['Type 1–2 (hard)', `${Math.round(([1,2].reduce((s,t) => s + (bristolCounts[t] ?? 0), 0) / totalBMs) * 100)}%`],
                  ['Type 6–7 (loose)', `${Math.round(([6,7].reduce((s,t) => s + (bristolCounts[t] ?? 0), 0) / totalBMs) * 100)}%`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>
                    <span style={{ color: '#9ca3af' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 5: Nutrition ──────────────────────────────────────── */}
        <div className="report-section report-pagebreak">
          <SectionHeader n="5" title="Nutrition (30-Day Averages)" />
          <div className="report-four-col" style={{ marginBottom: 14 }}>
            <Stat label="Avg Daily Calories" value={avgCalories !== null ? String(avgCalories) : '—'} sub={macroTarget?.total_calories ? `Target: ${Math.round(macroTarget.total_calories)}` : undefined} />
            <Stat label="Avg Daily Protein" value={avgProtein !== null ? `${avgProtein}g` : '—'} sub={macroTarget?.protein_g ? `Target: ${Math.round(macroTarget.protein_g)}g` : undefined} />
            <Stat label="Avg Hydration" value={avgWaterOz !== null ? `${avgWaterOz} oz` : '—'} sub="Target: 80 oz/day" />
            <Stat label="Meal Logging Days" value={`${daysWithMeals}/30`} sub={`${Math.round((daysWithMeals / 30) * 100)}% adherence`} />
          </div>
          {weightValues.length >= 2 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Weight trend (90 days)</div>
              <TrendChart data={weightValues} color="#6366f1" height={48} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                <span>{(weightValues[0] * 2.20462).toFixed(1)} lbs</span>
                <span>{latestWeight ? (latestWeight * 2.20462).toFixed(1) : '—'} lbs</span>
              </div>
            </>
          )}
        </div>

        {/* ── Section 6: Food-Symptom Correlations ─────────────────────── */}
        <div className="report-section">
          <SectionHeader n="6" title="Food-Symptom Correlations" />
          {(correlations ?? []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Correlation analysis not yet run. Use the Insights page to generate this data.</p>
          ) : (
            <Table
              headers={['Food / Ingredient', 'Associated Symptom', 'Correlation', 'Occurrences', 'Confidence']}
              rows={(correlations ?? []).map(c => {
                const rate = Math.round(c.correlation_score * 100)
                return [
                  c.food_item.charAt(0).toUpperCase() + c.food_item.slice(1),
                  c.symptom_type.charAt(0).toUpperCase() + c.symptom_type.slice(1),
                  `${rate}%`,
                  String(c.occurrence_count),
                  rate > 65 ? 'High' : rate > 35 ? 'Medium' : 'Low',
                ]
              })}
            />
          )}
        </div>

        {/* ── Section 7: Clinical Notes ──────────────────────────────────── */}
        <div className="report-section">
          <SectionHeader n="7" title="Clinical Notes (AI-Generated Summary)" />
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 18px' }}>
            {clinicalNarrative.split('\n\n').map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? '0 0 12px' : '0 0 12px', fontSize: 12, lineHeight: 1.75, color: '#374151', fontFamily: 'Georgia, serif' }}>
                {para}
              </p>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
            AI-generated summary based on logged data. Clinical judgment of a qualified healthcare provider is required.
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>
            Generated by <strong>GutHub</strong> AI Health Platform · {reportDate}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
            This report is not a medical diagnosis. For clinical use only in conjunction with provider evaluation.
          </div>
        </div>

      </div>
    </>
  )
}
