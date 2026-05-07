import { createClient } from '@/lib/supabase/server'
import { computeGutScore, gutScoreLabel } from '@/lib/gut-score'
import GutScoreRing from '@/components/app/GutScoreRing'
import MacroBar from '@/components/app/MacroBar'
import QuickLog from '@/components/app/QuickLog'
import WeightCard from '@/components/app/WeightCard'
import WaterCard from '@/components/app/WaterCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  // Fetch everything in parallel
  const [
    { data: profile },
    { data: macroTarget },
    { data: dailyRecord },
    { data: symptoms },
    { data: bms },
    { data: waterLogs },
    { data: recentWeights },
    { data: gutScoreRow },
  ] = await Promise.all([
    supabase.from('profiles').select('name, weight_kg, height_cm').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('daily_records').select('*').eq('user_id', user.id).eq('record_date', today).single(),
    supabase.from('symptom_logs').select('severity').eq('user_id', user.id).eq('log_date', today),
    supabase.from('bm_logs').select('bristol_type, urgency, pain').eq('user_id', user.id).eq('log_date', today),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('log_date', today),
    supabase.from('weight_logs').select('weight_kg, log_date').eq('user_id', user.id).order('log_date', { ascending: false }).limit(7),
    supabase.from('gut_scores').select('score').eq('user_id', user.id).eq('score_date', today).single(),
  ])

  // Compute gut score from today's logs (or use cached)
  const { score, symptomPenalty, bmPenalty } = gutScoreRow
    ? { score: gutScoreRow.score, symptomPenalty: 0, bmPenalty: 0 }
    : computeGutScore(symptoms ?? [], bms ?? [])

  const scoreInfo = gutScoreLabel(score)

  // Water total
  const waterMl = (waterLogs ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0)
  const waterGlasses = Math.round(waterMl / 240)
  const waterGoalGlasses = 8

  // Consumed macros from daily_record
  const consumed = {
    calories: dailyRecord?.calories_consumed ?? 0,
    protein: dailyRecord?.protein_consumed_g ?? 0,
    carbs: dailyRecord?.carbohydrates_consumed_g ?? 0,
    fat: dailyRecord?.fat_consumed_g ?? 0,
  }

  // Targets
  const targets = {
    calories: macroTarget?.total_calories ?? 2000,
    protein: macroTarget?.protein_g ?? 150,
    carbs: macroTarget?.carbs_g ?? 200,
    fat: macroTarget?.fat_g ?? 65,
  }

  const currentWeight = dailyRecord?.current_weight_kg ?? profile?.weight_kg ?? null
  const goalWeight = dailyRecord?.goal_weight_kg ?? null

  const firstName = (profile?.name ?? '').split(' ')[0] || 'there'

  return (
    <div style={{ padding: '32px 32px 40px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400,
          color: 'var(--ink-900)', margin: '0 0 4px', letterSpacing: '-0.02em',
        }}>
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0 }}>
          {formatDate(today)}
        </p>
      </div>

      {/* Quick log bar */}
      <QuickLog userId={user.id} today={today} />

      {/* Top row: gut score + macros */}
      <div style={{
        display: 'grid', gridTemplateColumns: '280px 1fr',
        gap: 20, marginTop: 20, alignItems: 'start',
      }} className="dashboard-top-row">
        <GutScoreRing
          score={score}
          label={scoreInfo.label}
          color={scoreInfo.color}
          symptomCount={symptoms?.length ?? 0}
          bmCount={bms?.length ?? 0}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Today's nutrition">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Calories</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>
                  {Math.round(consumed.calories)} / {Math.round(targets.calories)} kcal
                </span>
              </div>
              <MacroBar value={consumed.calories} max={targets.calories} color="var(--terracotta-400)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <MacroMini label="Protein" value={consumed.protein} max={targets.protein} unit="g" color="#3F6A4A" />
              <MacroMini label="Carbs" value={consumed.carbs} max={targets.carbs} unit="g" color="#C98A1E" />
              <MacroMini label="Fat" value={consumed.fat} max={targets.fat} unit="g" color="#A64732" />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row: weight + water */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }} className="dashboard-bottom-row">
        <WeightCard
          currentKg={currentWeight}
          goalKg={goalWeight}
          recentWeights={recentWeights ?? []}
        />
        <WaterCard glasses={waterGlasses} goal={waterGoalGlasses} userId={user.id} today={today} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-top-row { grid-template-columns: 1fr !important; }
          .dashboard-bottom-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .dashboard-top-row, .dashboard-bottom-row { padding: 0 4px; }
        }
      `}</style>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 2px 12px rgba(31,45,42,0.06)',
      border: '1px solid var(--ink-100)',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 16px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function MacroMini({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-800)' }}>{Math.round(value)}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 600ms ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>of {Math.round(max)}{unit}</div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
