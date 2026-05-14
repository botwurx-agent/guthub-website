import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserTimezone, todayInTz } from '@/lib/timezone'
import ClientTime from '@/components/app/ClientTime'
import ClientGreeting from '@/components/app/ClientGreeting'
import { computeGutScore, gutScoreLabel } from '@/lib/gut-score'
import { MealIllustration } from '@/components/app/MealIllustration'
import { Resend } from 'resend'
import Link from 'next/link'

const resend = new Resend(process.env.RESEND_API_KEY)
import {
  TrendingUp, Plus, Flame, FlaskConical,
  Clock, Leaf, RefreshCw, Frown, Meh, Smile,
  MapPin, ArrowRight,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tz = await getUserTimezone()
  const today = todayInTz(tz)

  const [
    { data: profile },
    { data: macroTarget },
    { data: dailyRecord },
    { data: symptoms },
    { data: bms },
    { data: gutScoreRow },
    { data: mealLogs },
    { data: gutScoreHistory },
    { data: recentLogDates },
    { data: tonightSlot },
    { data: waterLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('name, weight_kg, health_profile, subscription_status, trial_ends_at, trial_email_sent').eq('id', user.id).single(),
    supabase.from('macro_targets').select('*').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
    supabase.from('daily_records').select('*').eq('user_id', user.id).eq('record_date', today).single(),
    supabase.from('symptom_logs').select('symptom_type, severity, notes, logged_at').eq('user_id', user.id).eq('log_date', today).order('logged_at', { ascending: false }),
    supabase.from('bm_logs').select('bristol_type, urgency, pain').eq('user_id', user.id).eq('log_date', today),
    supabase.from('gut_scores').select('score').eq('user_id', user.id).eq('score_date', today).single(),
    supabase.from('meal_logs').select('id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, logged_at').eq('user_id', user.id).eq('log_date', today).order('logged_at', { ascending: true }),
    supabase.from('gut_scores').select('score, score_date').eq('user_id', user.id).order('score_date', { ascending: false }).limit(8),
    supabase.from('meal_logs').select('log_date').eq('user_id', user.id).order('log_date', { ascending: false }).limit(30),
    supabase.from('meal_plan_slots').select('meal_name, calories, protein_g, carbs_g, fat_g, accepted').eq('user_id', user.id).eq('plan_date', today).eq('meal_type', 'dinner').maybeSingle(),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('log_date', today),
  ])

  // Defense-in-depth: verify subscription even if middleware was bypassed
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const trialActive = trialEndsAt ? trialEndsAt > new Date() : null
  const hasAccess = profile?.subscription_status === 'active' ||
    (profile?.subscription_status === 'trialing' && trialActive !== false)
  if (!hasAccess) redirect('/pricing?reason=subscription_required')

  // Day 5 trial reminder — fire once when ≤ 2 days remain
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000) : null
  if (daysLeft !== null && daysLeft <= 2 && daysLeft > 0 && !profile?.trial_email_sent && user.email) {
    const firstName = (profile?.name ?? '').split(' ')[0] || 'there'
    try {
      await resend.emails.send({
        from: 'GutHub <hello@guthub.ai>',
        to: user.email,
        subject: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — keep your momentum`,
        html: `
          <p>Hi ${firstName},</p>
          <p>Your 7-day free trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>. You've been making real progress — don't let it stop here.</p>
          <p>Subscribe now to keep access to your AI gut coach, meal planner, symptom tracker, and personalized insights.</p>
          <p><a href="https://guthub-website.vercel.app/subscribe" style="background:#c16a4a;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">Subscribe now →</a></p>
          <p style="color:#888;font-size:13px;">Questions? Just reply to this email.</p>
          <p>— The GutHub team</p>
        `,
      })
      const service = await createServiceClient()
      await service.from('profiles').update({ trial_email_sent: true }).eq('id', user.id)
    } catch { /* non-blocking — don't break the dashboard */ }
  }

  // Gut score
  const { score } = gutScoreRow
    ? { score: gutScoreRow.score }
    : computeGutScore(symptoms ?? [], bms ?? [])
  const scoreInfo = gutScoreLabel(score)

  const prevScore = (gutScoreHistory && gutScoreHistory.length > 1) ? gutScoreHistory[1].score : null
  const scoreDelta = prevScore !== null ? Math.round(score - prevScore) : null

  // Macros — sum directly from meal_logs (source of truth); daily_records totals can drift
  const consumed = {
    calories: Math.round((mealLogs ?? []).reduce((s, m) => s + (m.calories ?? 0), 0)),
    protein:  Math.round((mealLogs ?? []).reduce((s, m) => s + (m.protein_g ?? 0), 0)),
    carbs:    Math.round((mealLogs ?? []).reduce((s, m) => s + (m.carbs_g ?? 0), 0)),
    fat:      Math.round((mealLogs ?? []).reduce((s, m) => s + (m.fat_g ?? 0), 0)),
  }
  const targets = {
    calories: Math.round(macroTarget?.total_calories ?? 2000),
    protein:  Math.round(macroTarget?.protein_g ?? 150),
    carbs:    Math.round(macroTarget?.carbs_g ?? 200),
    fat:      Math.round(macroTarget?.fat_g ?? 65),
  }

  const firstName    = (profile?.name ?? '').split(' ')[0] || 'there'
  const meals        = mealLogs ?? []
  const todaySymptoms = symptoms ?? []
  const streak       = calcStreak(recentLogDates ?? [])

  const mealTypeLabel: Record<string, string> = {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
  }

  // Subtitle based on available data
  const subtitle = scoreDelta !== null && scoreDelta > 0
    ? `Your gut score is up ${scoreDelta} point${scoreDelta === 1 ? '' : 's'} since yesterday. Here's what to focus on today.`
    : `Here's your gut health snapshot for today.`

  // Coach Proactive nudge — pick the most relevant scenario
  const timeOfDay = getTimeOfDay()
  const calPct = targets.calories > 0 ? consumed.calories / targets.calories : 0
  const proteinPct = targets.protein > 0 ? consumed.protein / targets.protein : 0
  const waterMl = (waterLogs ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0)
  const waterGoalMl = 2000
  const waterPct = waterMl / waterGoalMl

  let nudgeTitle: React.ReactNode
  let nudgeBody: string
  let nudgePrimaryLabel: string
  let nudgePrimaryHref: string
  let nudgeSecondaryLabel = 'Talk to Coach'
  let nudgeSecondaryHref = '/coach'

  if (meals.length === 0) {
    // Nothing logged yet
    nudgeTitle = <>Ready to <em style={{ fontStyle: 'italic', color: '#e8c870' }}>track your first meal</em> today?</>
    nudgeBody = `Every meal logged helps your coach spot patterns and tailor your plan. It only takes a few seconds.`
    nudgePrimaryLabel = 'Log a meal'
    nudgePrimaryHref = '/log'
  } else if (todaySymptoms.length > 0) {
    // Meals + symptoms → pattern finding is most valuable
    nudgeTitle = <>{`You logged `}<em style={{ fontStyle: 'italic', color: '#e8c870' }}>{todaySymptoms.length} symptom{todaySymptoms.length > 1 ? 's' : ''}</em> today — let&apos;s find what triggered it.</>
    nudgeBody = `Your coach can cross-reference your meals with your symptoms to pinpoint food triggers. ${meals.length > 1 ? `You've logged ${meals.length} meals to work with.` : `Adding more meal logs gives your coach more to work with.`}`
    nudgePrimaryLabel = 'Discuss with Coach'
    nudgePrimaryHref = '/coach?autostart=symptoms'
    nudgeSecondaryLabel = 'Log more meals'
    nudgeSecondaryHref = '/log'
  } else if (waterPct < 0.5 && timeOfDay !== 'morning') {
    // Under half daily water goal past morning
    const cupsLogged = Math.round(waterMl / 250)
    const cupsGoal = Math.round(waterGoalMl / 250)
    nudgeTitle = <>You&apos;ve only had <em style={{ fontStyle: 'italic', color: '#e8c870' }}>{cupsLogged} of {cupsGoal} cups</em> of water today.</>
    nudgeBody = `Hydration has a direct impact on digestion and gut health. Aim to log ${cupsGoal - cupsLogged} more cups before the end of the day.`
    nudgePrimaryLabel = 'Log water'
    nudgePrimaryHref = '/log?tab=water'
    nudgeSecondaryLabel = 'Ask Coach why it matters'
    nudgeSecondaryHref = '/coach'
  } else if (calPct >= 0.9) {
    // Near or at calorie target
    const remaining = Math.max(0, targets.calories - consumed.calories)
    nudgeTitle = <>You&apos;re <em style={{ fontStyle: 'italic', color: '#e8c870' }}>{remaining === 0 ? 'at' : 'close to'} your calorie target</em> for today.</>
    nudgeBody = remaining > 0
      ? `${remaining} kcal remaining. Great progress — your coach can suggest a light option to finish the day strong.`
      : `You've hit your daily calorie target. Ask your coach about optimising tomorrow's meals.`
    nudgePrimaryLabel = 'Get meal ideas'
    nudgePrimaryHref = '/coach'
    nudgeSecondaryLabel = 'Log a meal'
    nudgeSecondaryHref = '/log'
  } else if (meals.length > 0 && proteinPct < 0.5 && timeOfDay !== 'morning') {
    // Protein running low past morning
    nudgeTitle = <>Your <em style={{ fontStyle: 'italic', color: '#e8c870' }}>protein intake is low</em> for where you are in the day.</>
    nudgeBody = `You've hit ${consumed.protein}g of your ${targets.protein}g target. Your coach can suggest high-protein options for your next meal.`
    nudgePrimaryLabel = 'Get suggestions'
    nudgePrimaryHref = '/coach'
    nudgeSecondaryLabel = 'Log a meal'
    nudgeSecondaryHref = '/log'
  } else if (streak >= 3) {
    // Celebrate streak
    nudgeTitle = <><em style={{ fontStyle: 'italic', color: '#e8c870' }}>{streak}-day streak</em> — you&apos;re building real momentum.</>
    nudgeBody = `Consistent logging is how your coach learns your patterns. Check your insights to see what the data is telling you.`
    nudgePrimaryLabel = 'View insights'
    nudgePrimaryHref = '/insights'
    nudgeSecondaryLabel = 'Log a meal'
    nudgeSecondaryHref = '/log'
  } else {
    // Meals logged, no special condition — encourage continued logging
    nudgeTitle = <>{meals.length} meal{meals.length > 1 ? 's' : ''} logged today — <em style={{ fontStyle: 'italic', color: '#e8c870' }}>keep it up.</em></>
    nudgeBody = `Your coach is tracking your patterns. Log your remaining meals to get the most accurate gut health insights today.`
    nudgePrimaryLabel = 'Log a meal'
    nudgePrimaryHref = '/log'
  }

  return (
    <div style={{ padding: '32px 40px 48px' }}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-500)', marginBottom: 6 }}>
            {formatDate(today)}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            <ClientGreeting firstName={firstName} />
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: 0, lineHeight: 1.55, maxWidth: 560 }}>
            {subtitle}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 4 }}>
          <Link href="/insights" style={ghostLinkStyle}>
            <TrendingUp size={15} /> See full trends
          </Link>
          <Link href="/log" style={primaryLinkStyle}>
            <Plus size={15} /> Log a meal
          </Link>
        </div>
      </div>

      {/* ── 2-COL GRID ──────────────────────────────────────────── */}
      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>

        {/* ──── LEFT COLUMN ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AI Nudge */}
          <div style={{
            borderRadius: 20, padding: '26px 30px',
            background: 'linear-gradient(135deg, var(--forest-500), var(--forest-600))',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,245,238,0.6)', marginBottom: 10 }}>
              Coach · proactive
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: '0 0 10px', lineHeight: 1.3, color: 'var(--cream-50)' }}>
              {nudgeTitle}
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(250,245,238,0.88)', margin: '0 0 20px' }}>
              {nudgeBody}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={nudgePrimaryHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 999, background: 'var(--cream-50)', color: 'var(--forest-600)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                {nudgePrimaryLabel}
              </Link>
              <Link href={nudgeSecondaryHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 999, border: '1px solid rgba(250,245,238,0.3)', color: 'var(--cream-100)', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                {nudgeSecondaryLabel}
              </Link>
            </div>
          </div>

          {/* Today's meals */}
          <DCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={cardTitleStyle}>Today&apos;s meals</h3>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 3 }}>
                  {meals.length} logged · {consumed.calories} kcal · {Math.max(0, targets.calories - consumed.calories)} kcal remaining
                </div>
              </div>
              <Link href="/log" style={softBtnStyle}>View timeline</Link>
            </div>

            {meals.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
                No meals logged yet today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {meals.map(meal => (
                  <MealRow key={meal.id} meal={meal} mealTypeLabel={mealTypeLabel} />
                ))}
              </div>
            )}

            <Link href="/log" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 14, padding: '10px 0', borderRadius: 10,
              border: '1.5px dashed var(--cream-200)', color: 'var(--ink-500)',
              fontSize: 13.5, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)',
            }}>
              <Plus size={15} /> Add a meal
            </Link>
          </DCard>

          {/* Tonight's dinner suggestion */}
          <DCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={cardTitleStyle}>Tonight&apos;s suggested dinner</h3>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 3 }}>
                  {tonightSlot ? 'From your meal plan' : 'Picked for your dietary profile'}
                </div>
              </div>
              <Link href="/meal-planner" style={ghostBtnStyle}>See week plan</Link>
            </div>
            {tonightSlot ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 88, height: 88, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--forest-300), var(--forest-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MealIllustration meal="dinner" size={52} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-500)', marginBottom: 5 }}>
                    Dinner{tonightSlot.accepted ? ' · ✓ accepted' : ''}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, margin: '0 0 10px', color: 'var(--ink-900)', lineHeight: 1.3 }}>
                    {tonightSlot.meal_name}
                  </h4>
                  <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-500)', flexWrap: 'wrap' }}>
                    {tonightSlot.calories && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={13} /> {Math.round(tonightSlot.calories)} kcal</span>}
                    {tonightSlot.protein_g && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Leaf size={13} /> {Math.round(tonightSlot.protein_g)}g protein</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <Link href="/meal-planner" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, background: 'var(--terracotta-400)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    View plan
                  </Link>
                  <Link href="/meal-planner" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, border: '1px solid var(--cream-200)', color: 'var(--ink-700)', fontSize: 13, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    <RefreshCw size={13} /> Swap
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 88, height: 88, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--forest-300), var(--forest-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MealIllustration meal="dinner" size={52} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-500)', marginBottom: 5 }}>Dinner</div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, margin: '0 0 10px', color: 'var(--ink-900)', lineHeight: 1.3 }}>
                    No dinner planned yet
                  </h4>
                  <div style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.5 }}>
                    Generate a meal plan to get tonight&apos;s dinner suggestion.
                  </div>
                </div>
                <Link href="/meal-planner" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, background: 'var(--terracotta-400)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Generate plan
                </Link>
              </div>
            )}
          </DCard>
        </div>

        {/* ──── RIGHT COLUMN ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Gut score ring */}
          <DCard style={{ paddingTop: 28, paddingBottom: 24, textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 16 }}>
              Today
            </div>
            <ScoreRing score={score} color={scoreInfo.color} />
            {scoreDelta !== null && (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 12, color: scoreDelta >= 0 ? 'var(--forest-500)' : 'var(--terracotta-500)' }}>
                {scoreDelta > 0 ? `↑ +${scoreDelta}` : scoreDelta < 0 ? `↓ ${scoreDelta}` : '→ No change'} since yesterday
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: 'var(--ink-500)', marginTop: 14, flexWrap: 'wrap' }}>
              <span><Dot color="var(--forest-400)" /> Meals logged</span>
              <span><Dot color="#C98A1E" /> Symptoms</span>
            </div>
          </DCard>

          {/* Macros */}
          <DCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={cardTitleStyle}>Macros today</h3>
              <span style={{ fontSize: 13, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>
                {targets.calories > 0 ? Math.round((consumed.calories / targets.calories) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MacroRow label="Kcal"    cur={consumed.calories} goal={targets.calories} color="var(--terracotta-400)" />
              <MacroRow label="Protein" cur={consumed.protein}  goal={targets.protein}  color="var(--forest-400)" />
              <MacroRow label="Carbs"   cur={consumed.carbs}    goal={targets.carbs}    color="#C98A1E" />
              <MacroRow label="Fat"     cur={consumed.fat}      goal={targets.fat}      color="#A64732" />
            </div>
          </DCard>

          {/* How you're feeling */}
          <DCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={cardTitleStyle}>How you&apos;re feeling</h3>
              <Link href="/log?tab=symptom" style={softBtnStyle}>
                <Plus size={13} /> Log
              </Link>
            </div>
            {todaySymptoms.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '6px 0' }}>No symptoms logged today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {todaySymptoms.slice(0, 3).map((s, i) => (
                  <SymptomRow key={i} symptom={s} />
                ))}
              </div>
            )}
          </DCard>

          {/* Eat Out Safely */}
          <Link href="/eat-out" style={{ textDecoration: 'none', display: 'block', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, var(--terracotta-500), #c0472a)', padding: '20px 22px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>New</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 1 }}>Eating out tonight?</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)', margin: '0 0 14px' }}>
              Tell us where you&apos;re going — we&apos;ll scan the menu against your personal trigger history.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              What can I eat here? <ArrowRight size={13} />
            </div>
          </Link>

          {/* Test report */}
          <div style={{ borderRadius: 16, padding: '20px 22px', background: 'linear-gradient(135deg, var(--forest-500), var(--forest-600))' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250,245,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FlaskConical size={20} color="var(--cream-50)" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,245,238,0.65)' }}>Test report analysis</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream-50)', marginTop: 2 }}>Upload lab work</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(250,245,238,0.88)', margin: '0 0 14px' }}>
              Upload stool tests, food sensitivity panels, or blood work — Coach reads them and explains what to do.
            </p>
            <Link href="/insights?tab=labs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 999, background: 'var(--cream-50)', color: 'var(--forest-700)', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              Go to Test Reports
            </Link>
          </div>

          {/* Streak */}
          <div style={{ borderRadius: 16, padding: '18px 22px', background: 'var(--cream-100)', border: '1px solid var(--cream-200)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--terracotta-400)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame size={24} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
                  {streak > 0 ? `${streak}-day logging streak` : 'Start your streak today'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>
                  {streak > 0 ? 'Keep it going — log dinner tonight.' : 'Log a meal to begin tracking.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .dash-grid > div { padding: 0 4px; }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 70, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg viewBox="0 0 168 168" width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="84" cy="84" r={r} stroke="var(--cream-200)" strokeWidth="10" fill="none" />
          <circle cx="84" cy="84" r={r} stroke="var(--terracotta-400)" strokeWidth="10" fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>Gut score</div>
        </div>
      </div>
    </div>
  )
}

function DCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 8px rgba(31,45,42,0.06)', border: '1px solid var(--cream-200)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function MealRow({ meal, mealTypeLabel }: {
  meal: { meal_name: string; meal_type: string | null; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; logged_at: string }
  mealTypeLabel: Record<string, string>
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--cream-100)' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-400)', minWidth: 52, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}><ClientTime iso={meal.logged_at} /></div>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
      }}>🍽</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meal.meal_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
          {meal.meal_type ? mealTypeLabel[meal.meal_type] ?? meal.meal_type : ''}
          {meal.calories ? ` · ${Math.round(meal.calories)} kcal` : ''}
          {meal.protein_g ? ` · P ${Math.round(meal.protein_g)}g` : ''}
          {meal.carbs_g   ? ` · C ${Math.round(meal.carbs_g)}g`   : ''}
          {meal.fat_g     ? ` · F ${Math.round(meal.fat_g)}g`     : ''}
        </div>
      </div>
    </div>
  )
}

function MacroRow({ label, cur, goal, color }: { label: string; cur: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (cur / goal) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-600)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', fontVariantNumeric: 'tabular-nums' }}>
          {cur} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>/ {goal}</span>
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'var(--cream-200)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 600ms ease' }} />
      </div>
    </div>
  )
}

function SymptomRow({ symptom }: { symptom: { symptom_type: string; severity: number; logged_at: string } }) {
  const Icon = symptom.severity >= 7 ? Frown : symptom.severity >= 4 ? Meh : Smile
  const iconColor = symptom.severity >= 7 ? 'var(--terracotta-500)' : symptom.severity >= 4 ? '#C98A1E' : 'var(--forest-400)'
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', textTransform: 'capitalize' }}>{symptom.symptom_type}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 1 }}><ClientTime iso={symptom.logged_at} /> · severity {symptom.severity}/10</div>
      </div>
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle' }} />
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cardTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', margin: 0,
}

const ghostLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 999,
  border: '1px solid var(--cream-200)', background: 'transparent',
  fontSize: 13.5, fontWeight: 500, color: 'var(--ink-700)',
  textDecoration: 'none', fontFamily: 'var(--font-body)',
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 20px', borderRadius: 999,
  border: 'none', background: 'var(--terracotta-400)',
  fontSize: 13.5, fontWeight: 600, color: '#fff',
  textDecoration: 'none', fontFamily: 'var(--font-body)',
}

const softBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 14px', borderRadius: 999,
  background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
  fontSize: 12.5, fontWeight: 500, color: 'var(--ink-700)',
  textDecoration: 'none', fontFamily: 'var(--font-body)', flexShrink: 0,
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 14px', borderRadius: 999,
  border: '1px solid var(--cream-200)', background: 'transparent',
  fontSize: 12.5, fontWeight: 500, color: 'var(--ink-700)',
  textDecoration: 'none', fontFamily: 'var(--font-body)', flexShrink: 0,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStreak(rows: { log_date: string }[]): number {
  if (!rows.length) return 0
  const dates = [...new Set(rows.map(r => r.log_date))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let expected = today
  for (const d of dates) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().split('T')[0]
    } else break
  }
  return streak
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}
