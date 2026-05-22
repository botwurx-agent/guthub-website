'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Utensils, Frown, Circle, Droplets, Scale, StickyNote,
  Camera, Sparkles, TrendingDown, TrendingUp, Trash2, RotateCcw, Check, Pill, Heart, FlaskConical, Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deleteMeal, reLogMeal } from '@/app/actions/log'
import LogMeal from '@/components/app/log/LogMeal'
import LogMealPhoto from '@/components/app/log/LogMealPhoto'
import LogSymptom from '@/components/app/log/LogSymptom'
import LogBM from '@/components/app/log/LogBM'
import LogWater from '@/components/app/log/LogWater'
import LogWeight from '@/components/app/log/LogWeight'
import LogNote from '@/components/app/log/LogNote'
import LogSupplement from '@/components/app/log/LogSupplement'
import LogKetone from '@/components/app/log/LogKetone'
import type { TimelineDay, WeekStats, TodayMacros, MacroTargets } from './page'

type FilterId = 'all' | 'meal' | 'symptom' | 'weight' | 'note' | 'supplement' | 'ketone'
type FormId = 'meal' | 'photo-meal' | 'symptom' | 'bm' | 'water' | 'weight' | 'note' | 'supplement' | 'ketone' | 'favourites'

type LikedMeal = {
  id: string
  meal_name: string
  meal_type: string | null
  calories: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
}

const FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'meal', label: 'Meals' },
  { id: 'symptom', label: 'Symptoms' },
  { id: 'weight', label: 'Weight' },
  { id: 'note', label: 'Notes' },
]

const KIND_STYLE: Record<string, { color: string; bg: string }> = {
  meal:       { color: '#DB6F56', bg: 'rgba(219,111,86,0.12)' },
  symptom:    { color: '#C98A1E', bg: 'rgba(201,138,30,0.12)' },
  weight:     { color: '#9D978A', bg: 'rgba(157,151,138,0.12)' },
  bm:         { color: '#6F9477', bg: 'rgba(111,148,119,0.12)' },
  water:      { color: '#6FB8A8', bg: 'rgba(111,184,168,0.12)' },
  note:       { color: '#7A7468', bg: 'rgba(122,116,104,0.12)' },
  supplement: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  ketone:     { color: '#3F6A4A', bg: 'rgba(63,106,74,0.12)' },
}

const KIND_ICON: Record<string, React.ElementType> = {
  meal: Utensils,
  symptom: Frown,
  weight: Scale,
  bm: Circle,
  water: Droplets,
  note: StickyNote,
  supplement: Pill,
  ketone: FlaskConical,
}

function formatTime(iso: string) {
  const d = new Date(iso)
  let h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function EventRow({ item, onDelete, onLogAgain, isFavourited, onFavourite }: {
  item: TimelineDay['items'][number]
  onDelete?: (id: string) => void
  onLogAgain?: (id: string) => Promise<void>
  isFavourited?: boolean
  onFavourite?: () => Promise<void>
}) {
  const style = KIND_STYLE[item.kind] ?? KIND_STYLE.note
  const Icon = KIND_ICON[item.kind] ?? StickyNote
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState(false)
  const [favouriting, setFavouring] = useState(false)

  function handleDelete() {
    if (!onDelete) return
    startTransition(() => onDelete(item.id))
  }

  async function handleLogAgain() {
    if (!onLogAgain || logging) return
    setLogging(true)
    await onLogAgain(item.id)
    setLogging(false)
    setLogged(true)
    setTimeout(() => setLogged(false), 1800)
  }

  async function handleFavourite() {
    if (!onFavourite || favouriting) return
    setFavouring(true)
    await onFavourite()
    setFavouring(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--cream-200)',
    }}>
      <div style={{
        fontSize: 12, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums',
        width: 60, flexShrink: 0, paddingTop: 2, fontWeight: 500,
      }}>
        {formatTime(item.loggedAt)}
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: style.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={style.color} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--ink-900)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 1 }}>{item.meta}</div>
      </div>
      {onLogAgain && !confirming && (
        <button
          onClick={handleLogAgain}
          disabled={logging}
          aria-label="Log this meal again for today"
          title={logged ? 'Logged for today' : 'Log again for today'}
          style={{
            background: logged ? 'rgba(111,148,119,0.14)' : 'none',
            border: 'none', padding: 6, borderRadius: 6,
            cursor: logging ? 'wait' : 'pointer',
            color: logged ? '#3F6A4A' : 'var(--ink-400)',
            flexShrink: 0, display: 'flex', alignItems: 'center',
            transition: 'all 160ms',
          }}
        >
          {logged ? <Check size={14} /> : <RotateCcw size={14} />}
        </button>
      )}
      {onFavourite && !confirming && (
        <button
          onClick={handleFavourite}
          disabled={favouriting}
          title={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
          style={{
            background: isFavourited ? 'rgba(219,111,86,0.1)' : 'none',
            border: 'none', padding: 6, borderRadius: 6,
            cursor: favouriting ? 'wait' : 'pointer',
            color: isFavourited ? 'var(--terracotta-500)' : 'var(--ink-400)',
            flexShrink: 0, display: 'flex', alignItems: 'center',
            transition: 'all 160ms',
          }}
        >
          <Heart size={14} fill={isFavourited ? 'currentColor' : 'none'} />
        </button>
      )}
      {onDelete && (
        confirming ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={handleDelete} disabled={pending} style={{
              fontSize: 11, fontWeight: 600, color: '#fff',
              background: '#B4422C', border: 'none',
              padding: '5px 10px', borderRadius: 7,
              cursor: pending ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}>{pending ? '…' : 'Delete'}</button>
            <button onClick={() => setConfirming(false)} disabled={pending} style={{
              fontSize: 11, color: 'var(--ink-500)', background: 'none',
              border: 'none', padding: '5px 6px', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} aria-label="Delete" style={{
            background: 'none', border: 'none', padding: 6, borderRadius: 6,
            cursor: 'pointer', color: 'var(--ink-400)', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}>
            <Trash2 size={14} />
          </button>
        )
      )}
    </div>
  )
}

function QuickAddTile({ icon: Icon, label, onClick, color }: {
  icon: React.ElementType; label: string; onClick: () => void; color?: string
}) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '16px 12px', borderRadius: 12, border: '1px solid var(--cream-200)',
        background: hover ? 'var(--cream-100)' : '#fff',
        cursor: 'pointer', transition: 'all 140ms', width: '100%',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--cream-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color ?? 'var(--ink-700)',
      }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-800)', textAlign: 'center' }}>{label}</span>
    </button>
  )
}

function StatRow({ label, sub, val, trend }: { label: string; sub: string; val: string; trend?: 'up' | 'down' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--ink-600)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'down' && <TrendingDown size={11} color="var(--forest-400)" />}
          {trend === 'up' && <TrendingUp size={11} color="var(--forest-400)" />}
          {sub}
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', letterSpacing: '-0.02em',
      }}>{val}</div>
    </div>
  )
}

function MacroDonut({ macros, targets }: { macros: TodayMacros; targets: MacroTargets }) {
  // Macro colors aligned with dashboard
  const PROTEIN_COLOR = 'var(--forest-400)'
  const CARBS_COLOR   = '#C98A1E'
  const FAT_COLOR     = '#A64732'

  // Convert grams → kcal for the segmented arc
  const proteinKcal = macros.protein * 4
  const carbsKcal   = macros.carbs * 4
  const fatKcal     = macros.fat * 9
  const macroSum    = proteinKcal + carbsKcal + fatKcal

  const totalCal    = macros.calories
  const goalCal     = Math.max(targets.calories, 1)
  const fillPct     = Math.min(1, totalCal / goalCal)
  const remainingCal = Math.max(0, targets.calories - totalCal)

  // Donut geometry
  const size = 168, stroke = 14, r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filledLen = c * fillPct

  // Three segments (in stroke-dasharray space) sized by kcal contribution
  const segLens = macroSum > 0
    ? [
        (proteinKcal / macroSum) * filledLen,
        (carbsKcal / macroSum) * filledLen,
        (fatKcal / macroSum) * filledLen,
      ]
    : [0, 0, 0]

  // Cumulative offsets for each segment (we draw counter-clockwise from top)
  const offsets = [0, segLens[0], segLens[0] + segLens[1]]

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--cream-200)', padding: '20px 20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Today&apos;s progress</h3>
        <span style={{ fontSize: 12.5, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(fillPct * 100)}% of goal
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={size / 2} cy={size / 2} r={r}
              stroke="var(--cream-200)" strokeWidth={stroke} fill="none" />
            {/* Protein segment */}
            <circle cx={size / 2} cy={size / 2} r={r}
              stroke={PROTEIN_COLOR} strokeWidth={stroke} fill="none" strokeLinecap="butt"
              strokeDasharray={`${segLens[0]} ${c - segLens[0]}`}
              strokeDashoffset={-offsets[0]} />
            {/* Carbs segment */}
            <circle cx={size / 2} cy={size / 2} r={r}
              stroke={CARBS_COLOR} strokeWidth={stroke} fill="none" strokeLinecap="butt"
              strokeDasharray={`${segLens[1]} ${c - segLens[1]}`}
              strokeDashoffset={-offsets[1]} />
            {/* Fat segment */}
            <circle cx={size / 2} cy={size / 2} r={r}
              stroke={FAT_COLOR} strokeWidth={stroke} fill="none" strokeLinecap="butt"
              strokeDasharray={`${segLens[2]} ${c - segLens[2]}`}
              strokeDashoffset={-offsets[2]} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {totalCal}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              of {targets.calories} kcal
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>
              {remainingCal > 0 ? `${remainingCal} remaining` : 'Goal hit'}
            </div>
          </div>
        </div>
      </div>

      {/* Per-macro mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MacroChip label="Protein" cur={macros.protein} goal={targets.protein} color={PROTEIN_COLOR} />
        <MacroChip label="Carbs"   cur={macros.carbs}   goal={targets.carbs}   color={CARBS_COLOR} />
        <MacroChip label="Fat"     cur={macros.fat}     goal={targets.fat}     color={FAT_COLOR} />
      </div>
    </div>
  )
}

function MacroChip({ label, cur, goal, color }: { label: string; cur: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (cur / goal) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
        {cur}<span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>/{goal}g</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--cream-200)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 600ms ease' }} />
      </div>
    </div>
  )
}

export default function LogPageClient({
  initialType, userId, timeline, weekStats, currentLbs, goalLbs, waterGlasses,
  todayMacros, targets,
}: {
  initialType: string
  userId: string
  timeline: TimelineDay[]
  weekStats: WeekStats
  currentLbs: number | null
  goalLbs: number | null
  waterGlasses: number
  todayMacros: TodayMacros
  targets: MacroTargets
}) {
  const router = useRouter()
  const quickAddRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [likedMeals, setLikedMeals] = useState<LikedMeal[]>([])
  const [logDate, setLogDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const supabase = createClient()

  useEffect(() => {
    supabase.from('liked_meals').select('*').order('liked_at', { ascending: false })
      .then(({ data }) => setLikedMeals(data ?? []))
  }, [])

  // Compute today/yesterday in the browser so the user's local timezone is used
  const clientToday = new Date().toLocaleDateString('en-CA')
  const _yd = new Date(); _yd.setDate(_yd.getDate() - 1)
  const clientYesterday = _yd.toLocaleDateString('en-CA')

  const isLogToday = logDate === clientToday
  const isLogYesterday = logDate === clientYesterday

  function formatLogDate(dateStr: string) {
    if (dateStr === clientToday) return 'Today'
    if (dateStr === clientYesterday) return 'Yesterday'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function dayLabel(dateStr: string) {
    if (dateStr === clientToday)     return 'Today'
    if (dateStr === clientYesterday) return 'Yesterday'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }
  const [filter, setFilter] = useState<FilterId>('all')
  const [activeForm, setActiveForm] = useState<FormId | null>(
    (initialType && initialType !== 'all') ? initialType as FormId : null
  )
  const [showAllDays, setShowAllDays] = useState(false)

  function handleSuccess() {
    router.refresh()
    setActiveForm(null)
  }

  async function handleDeleteMeal(id: string) {
    const res = await deleteMeal(id)
    if (res?.error) { alert(res.error); return }
    router.refresh()
  }

  async function handleLogAgain(id: string) {
    const today = new Date().toLocaleDateString('en-CA')
    const res = await reLogMeal(id, today)
    if (res?.error) { alert(res.error); return }
    router.refresh()
  }

  async function handleFavourite(item: TimelineDay['items'][number]) {
    if (item.kind !== 'meal' || !item.mealName) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const existing = likedMeals.find(m => m.meal_name === item.mealName)
    if (existing) {
      await supabase.from('liked_meals').delete().eq('id', existing.id)
      setLikedMeals(prev => prev.filter(m => m.id !== existing.id))
    } else {
      const { data } = await supabase.from('liked_meals').upsert({
        user_id: user.id,
        meal_name: item.mealName,
        meal_type: item.mealType ?? null,
        calories: item.calories ?? null,
        protein_g: item.protein_g ?? null,
        fat_g: item.fat_g ?? null,
        carbs_g: item.carbs_g ?? null,
        source: 'log',
        liked_at: new Date().toISOString(),
      }, { onConflict: 'user_id,meal_name' }).select().single()
      if (data) setLikedMeals(prev => [...prev, data as LikedMeal])
    }
  }

  const totalItems = timeline.reduce((s, d) => s + d.items.length, 0)
  const summaryParts = [
    weekStats.meals ? `${weekStats.meals} meal${weekStats.meals !== 1 ? 's' : ''}` : null,
    weekStats.symptoms ? `${weekStats.symptoms} symptom${weekStats.symptoms !== 1 ? 's' : ''}` : null,
    weekStats.weights ? `${weekStats.weights} weight` : null,
    weekStats.notes ? `${weekStats.notes} note${weekStats.notes !== 1 ? 's' : ''}` : null,
  ].filter(Boolean)

  const FORM_LABELS: Record<FormId, string> = {
    meal: 'Log a meal', 'photo-meal': 'Photo meal', symptom: 'Log a symptom',
    bm: 'Log bowel movement', water: 'Log water', weight: 'Log weight',
    note: 'Add a note', supplement: 'Log supplement', ketone: 'Track ketones', favourites: 'Favourites',
  }

  async function logFavourite(meal: LikedMeal) {
    const today = new Date().toLocaleDateString('en-CA')
    const fd = new FormData()
    fd.set('log_date', today)
    fd.set('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)
    fd.set('meal_name', meal.meal_name)
    fd.set('meal_type', meal.meal_type ?? 'snack')
    fd.set('calories', String(meal.calories ?? ''))
    fd.set('protein', String(meal.protein_g ?? ''))
    fd.set('carbs', String(meal.carbs_g ?? ''))
    fd.set('fat', String(meal.fat_g ?? ''))
    const { logMeal } = await import('@/app/actions/log')
    await logMeal(fd)
    handleSuccess()
  }

  const activeFormContent = activeForm && (
    <div>
      {activeForm === 'meal'        && <LogMeal logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'photo-meal'  && <LogMealPhoto logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'symptom'     && <LogSymptom logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'bm'          && <LogBM logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'water'       && <LogWater logDate={logDate} userId={userId} currentGlasses={waterGlasses} onSuccess={handleSuccess} />}
      {activeForm === 'weight'      && <LogWeight logDate={logDate} currentLbs={currentLbs} goalLbs={goalLbs} onSuccess={handleSuccess} />}
      {activeForm === 'note'        && <LogNote logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'supplement'  && <LogSupplement logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'ketone'      && <LogKetone logDate={logDate} onSuccess={handleSuccess} />}
      {activeForm === 'favourites'  && (
        likedMeals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-400)' }}>
            <Heart size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, margin: 0 }}>No favourites yet.<br />Save meals from the Plan page to see them here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {likedMeals.map(meal => (
              <div key={meal.id} style={{ background: 'var(--cream-50)', borderRadius: 12, border: '1px solid var(--cream-200)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.meal_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                    {[meal.calories && `${Math.round(meal.calories)} kcal`, meal.protein_g && `${Math.round(meal.protein_g)}g protein`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button
                  onClick={() => logFavourite(meal)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none', flexShrink: 0,
                    background: 'var(--terracotta-400)', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <RotateCcw size={11} /> Log
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )

  return (
    <>
    {/* Form overlay — mobile only */}
    {activeForm && (
      <div className="log-overlay-mobile" style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'var(--cream-50)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--cream-50)', zIndex: 1,
        }}>
          <button onClick={() => setActiveForm(null)} style={{
            background: 'none', border: 'none', padding: '6px 10px 6px 0',
            cursor: 'pointer', color: 'var(--ink-600)', fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4,
          }}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-body)' }}>
            {FORM_LABELS[activeForm]}
          </h2>
        </div>
        {/* Date selector strip — mobile overlay */}
        <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid var(--cream-200)', background: 'var(--cream-50)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ label: 'Today', date: clientToday }, { label: 'Yesterday', date: clientYesterday }].map(opt => (
              <button key={opt.date} onClick={() => setLogDate(opt.date)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 140ms',
                fontWeight: logDate === opt.date ? 600 : 400,
                border: `1.5px solid ${logDate === opt.date ? 'var(--forest-400)' : 'var(--cream-200)'}`,
                background: logDate === opt.date ? 'rgba(63,106,74,0.08)' : '#fff',
                color: logDate === opt.date ? 'var(--forest-500)' : 'var(--ink-500)',
              }}>{opt.label}</button>
            ))}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { dateInputRef.current?.showPicker?.(); dateInputRef.current?.click() }}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'all 140ms',
                  fontWeight: (!isLogToday && !isLogYesterday) ? 600 : 400,
                  border: `1.5px solid ${(!isLogToday && !isLogYesterday) ? 'var(--forest-400)' : 'var(--cream-200)'}`,
                  background: (!isLogToday && !isLogYesterday) ? 'rgba(63,106,74,0.08)' : '#fff',
                  color: (!isLogToday && !isLogYesterday) ? 'var(--forest-500)' : 'var(--ink-500)',
                }}
              >{(!isLogToday && !isLogYesterday) ? formatLogDate(logDate) : 'Earlier…'}</button>
              <input ref={dateInputRef} type="date" value={logDate} max={clientToday}
                onChange={e => { if (e.target.value) setLogDate(e.target.value) }}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0 }} />
            </div>
          </div>
          {!isLogToday && (
            <div style={{
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(201,138,30,0.09)', border: '1px solid rgba(201,138,30,0.22)',
              fontSize: 12, color: '#7A4E0A',
            }}>
              <Calendar size={12} style={{ flexShrink: 0 }} />
              <span>Logging to <strong>{formatLogDate(logDate)}</strong></span>
              <button onClick={() => setLogDate(clientToday)} style={{
                marginLeft: 'auto', padding: '2px 7px', borderRadius: 6,
                border: '1px solid rgba(201,138,30,0.3)', background: 'rgba(201,138,30,0.12)',
                fontSize: 11, fontWeight: 600, color: '#7A4E0A',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Back to today</button>
            </div>
          )}
        </div>
        <div style={{ padding: '20px 16px 120px' }}>
          {activeFormContent}
        </div>
      </div>
    )}
    <div className="app-page-content" style={{ padding: '32px 32px 48px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 6 }}>
            Your timeline
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Everything in one <em style={{ color: 'var(--terracotta-500)' }}>thread</em>.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0 }}>
            Meals, symptoms, weight, and notes — together so patterns are easy to spot.
          </p>
        </div>
        <button
          onClick={() => setActiveForm('meal')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'var(--terracotta-400)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
          + Add entry
        </button>
      </div>

      {/* Filter tabs + summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--cream-100)', borderRadius: 12, border: '1px solid var(--cream-200)' }}>
          {FILTER_TABS.map(t => {
            const active = filter === t.id
            return (
              <button key={t.id} onClick={() => setFilter(t.id)} style={{
                padding: '7px 14px', borderRadius: 9, border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? 'var(--ink-900)' : 'var(--ink-500)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxShadow: active ? '0 1px 4px rgba(31,45,42,0.09)' : 'none',
                transition: 'all 140ms',
              }}>{t.label}</button>
            )
          })}
        </div>
        {summaryParts.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
            {summaryParts.join(' · ')} in last 7 days
          </div>
        )}
      </div>

      {/* 2-col grid */}
      <div className="log-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>

        {/* LEFT — timeline */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--cream-200)', overflow: 'hidden' }}>
          {timeline.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-400)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 4 }}>No entries yet</div>
              <div style={{ fontSize: 13 }}>Add your first entry using the quick add panel →</div>
            </div>
          ) : (() => {
            const todayDays  = timeline.filter(d => d.dateStr === clientToday)
            const olderDays  = timeline.filter(d => d.dateStr !== clientToday)
            const visibleDays = showAllDays ? timeline : todayDays
            const hiddenCount = olderDays.reduce((s, d) => s + d.items.filter(it => filter === 'all' || it.kind === filter).length, 0)
            return (
              <div style={{ padding: '4px 24px' }}>
                {visibleDays.map(day => {
                  const visible = day.items.filter(it => filter === 'all' || it.kind === filter)
                  if (!visible.length) return null
                  return (
                    <div key={day.dateStr} style={{ paddingTop: 20, paddingBottom: 8 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{dayLabel(day.dateStr)}</div>
                        {day.dateStr !== clientToday && day.dateStr !== clientYesterday && (
                          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>
                            {new Date(day.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                      {visible.map(item => (
                        <EventRow
                          key={item.id}
                          item={item}
                          onDelete={item.kind === 'meal' ? handleDeleteMeal : undefined}
                          onLogAgain={item.kind === 'meal' ? handleLogAgain : undefined}
                          isFavourited={item.kind === 'meal' ? likedMeals.some(m => m.meal_name === item.mealName) : undefined}
                          onFavourite={item.kind === 'meal' ? () => handleFavourite(item) : undefined}
                        />
                      ))}
                    </div>
                  )
                })}
                {/* Show more / collapse */}
                {olderDays.length > 0 && (
                  <div style={{ padding: '12px 0 16px', borderTop: showAllDays ? '1px solid var(--cream-200)' : 'none', marginTop: showAllDays ? 8 : 0 }}>
                    <button
                      onClick={() => setShowAllDays(v => !v)}
                      style={{
                        width: '100%', padding: '11px 16px', borderRadius: 10,
                        border: '1px dashed var(--cream-300)',
                        background: 'var(--cream-50)', cursor: 'pointer',
                        fontSize: 13, fontWeight: 500, color: 'var(--ink-500)',
                        fontFamily: 'var(--font-body)', transition: 'all 140ms',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      {showAllDays
                        ? '↑ Show today only'
                        : `↓ Show previous days${hiddenCount > 0 ? ` · ${hiddenCount} entries` : ''}`}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* RIGHT — quick add + stats + coach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick add tiles */}
          <div ref={quickAddRef} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--cream-200)', padding: '20px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {activeForm && (
                <button
                  className="log-back-desktop"
                  onClick={() => setActiveForm(null)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    cursor: 'pointer', color: 'var(--ink-500)', fontSize: 13,
                    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >← Back</button>
              )}
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                {activeForm ? FORM_LABELS[activeForm] : 'Quick add'}
              </h3>
            </div>

            {/* Desktop inline form (hidden on mobile — overlay used instead) */}
            <div className="log-form-desktop">
              {activeForm && activeFormContent}
            </div>

            {/* Date selector — hidden on mobile when overlay is open (shown in overlay instead) */}
            <div className={activeForm ? 'log-date-selector log-date-hidden-mobile' : 'log-date-selector'} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Today', date: clientToday },
                  { label: 'Yesterday', date: clientYesterday },
                ].map(opt => (
                  <button key={opt.date} onClick={() => setLogDate(opt.date)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'all 140ms',
                    fontWeight: logDate === opt.date ? 600 : 400,
                    border: `1.5px solid ${logDate === opt.date ? 'var(--forest-400)' : 'var(--cream-200)'}`,
                    background: logDate === opt.date ? 'rgba(63,106,74,0.08)' : '#fff',
                    color: logDate === opt.date ? 'var(--forest-500)' : 'var(--ink-500)',
                  }}>{opt.label}</button>
                ))}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { dateInputRef.current?.showPicker?.(); dateInputRef.current?.click() }}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                      fontFamily: 'var(--font-body)', transition: 'all 140ms',
                      fontWeight: (!isLogToday && !isLogYesterday) ? 600 : 400,
                      border: `1.5px solid ${(!isLogToday && !isLogYesterday) ? 'var(--forest-400)' : 'var(--cream-200)'}`,
                      background: (!isLogToday && !isLogYesterday) ? 'rgba(63,106,74,0.08)' : '#fff',
                      color: (!isLogToday && !isLogYesterday) ? 'var(--forest-500)' : 'var(--ink-500)',
                    }}
                  >
                    {(!isLogToday && !isLogYesterday) ? formatLogDate(logDate) : 'Earlier…'}
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={logDate}
                    max={clientToday}
                    onChange={e => { if (e.target.value) setLogDate(e.target.value) }}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0 }}
                  />
                </div>
              </div>
              {!isLogToday && (
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 11px', borderRadius: 8,
                  background: 'rgba(201,138,30,0.09)', border: '1px solid rgba(201,138,30,0.22)',
                  fontSize: 12.5, color: '#7A4E0A',
                }}>
                  <Calendar size={13} style={{ flexShrink: 0 }} />
                  <span>Logging to <strong>{formatLogDate(logDate)}</strong></span>
                  <button
                    onClick={() => setLogDate(clientToday)}
                    style={{
                      marginLeft: 'auto', padding: '2px 8px', borderRadius: 6,
                      border: '1px solid rgba(201,138,30,0.3)', background: 'rgba(201,138,30,0.12)',
                      fontSize: 11.5, fontWeight: 600, color: '#7A4E0A',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                  >Back to today</button>
                </div>
              )}
            </div>

            {/* Tiles — always visible on mobile; hidden on desktop when a form is open */}
            <div className={activeForm ? 'log-tiles log-tiles-hidden-desktop' : 'log-tiles'} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <QuickAddTile icon={Camera} label="Photo meal" onClick={() => setActiveForm('photo-meal')} color="#DB6F56" />
              <QuickAddTile icon={Utensils} label="Type meal" onClick={() => setActiveForm('meal')} color="#DB6F56" />
              <QuickAddTile icon={Frown} label="Symptom" onClick={() => setActiveForm('symptom')} color="#C98A1E" />
              <QuickAddTile icon={Circle} label="Bowel" onClick={() => setActiveForm('bm')} color="#6F9477" />
              <QuickAddTile icon={Scale} label="Weight" onClick={() => setActiveForm('weight')} color="#9D978A" />
              <QuickAddTile icon={Droplets} label="Water" onClick={() => setActiveForm('water')} color="#6FB8A8" />
              <QuickAddTile icon={StickyNote} label="Note" onClick={() => setActiveForm('note')} color="#7A7468" />
              <QuickAddTile icon={Pill} label="Supplement" onClick={() => setActiveForm('supplement')} color="#8B5CF6" />
              <QuickAddTile icon={FlaskConical} label="Ketones" onClick={() => setActiveForm('ketone')} color="#3F6A4A" />
              <QuickAddTile icon={Heart} label={`Favourites${likedMeals.length > 0 ? ` (${likedMeals.length})` : ''}`} onClick={() => setActiveForm('favourites')} color="var(--terracotta-400)" />
            </div>
          </div>

          {/* Today's progress */}
          <MacroDonut macros={todayMacros} targets={targets} />

          {/* This week at a glance */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--cream-200)', padding: '20px 20px 24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>This week at a glance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StatRow
                label="Meals logged"
                val={`${weekStats.meals}`}
                sub={`of 21 goal (3/day)`}
              />
              <StatRow
                label="Symptoms"
                val={`${weekStats.symptoms}`}
                sub="logged this week"
                trend={weekStats.symptoms === 0 ? undefined : 'down'}
              />
              <StatRow
                label="Weight check-ins"
                val={`${weekStats.weights}`}
                sub="this week"
              />
              <StatRow
                label="Journal notes"
                val={`${weekStats.notes}`}
                sub="this week"
              />
            </div>
          </div>

          {/* Coach noticed */}
          <div style={{ background: 'var(--terracotta-50)', borderRadius: 16, border: '1px solid var(--terracotta-100)', padding: '20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--terracotta-400)', color: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>Coach noticed</div>
                <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6 }}>
                  {weekStats.symptoms > 0
                    ? `You logged ${weekStats.symptoms} symptom${weekStats.symptoms !== 1 ? 's' : ''} this week. Keep tracking meals alongside symptoms — patterns usually emerge within 2–3 weeks.`
                    : `Great week — no symptoms logged. Keep your streak going and I'll flag any food patterns as they emerge.`}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <style>{`
      /* Mobile: overlay is full-screen, tiles always visible, desktop inline form hidden */
      @media (max-width: 767px) {
        .log-form-desktop { display: none !important; }
        .log-back-desktop { display: none !important; }
        .log-tiles-hidden-desktop { display: grid !important; }
        .log-date-hidden-mobile { display: none !important; }
      }
      /* Desktop: overlay hidden, inline form shown, tiles hidden when form open */
      @media (min-width: 768px) {
        .log-overlay-mobile { display: none !important; }
        .log-tiles-hidden-desktop { display: none !important; }
        .log-form-desktop { display: block; }
      }
    `}</style>
    </>
  )
}
