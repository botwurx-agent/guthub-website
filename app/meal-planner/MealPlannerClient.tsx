'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, RefreshCw, Check, Sparkles, UtensilsCrossed } from 'lucide-react'

type Slot = {
  id: string
  plan_date: string
  meal_type: string
  meal_name: string
  ingredients: string[]
  directions: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  accepted: boolean
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export default function MealPlannerClient() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regeneratingSlot, setRegeneratingSlot] = useState<string | null>(null)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [acceptingSlot, setAcceptingSlot] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    const startStr = toDateStr(weekStart)
    const endStr   = toDateStr(addDays(weekStart, 6))
    const { data } = await supabase
      .from('meal_plan_slots')
      .select('*')
      .gte('plan_date', startStr)
      .lte('plan_date', endStr)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true })
    setSlots(data ?? [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  function getSlot(date: string, mealType: string): Slot | undefined {
    return slots.find(s => s.plan_date === date && s.meal_type === mealType)
  }

  async function generateWeek() {
    setGenerating(true)
    await fetch('/api/meal-planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart: toDateStr(weekStart), regenerate: null }),
    })
    await fetchSlots()
    setGenerating(false)
  }

  async function regenerateMeal(date: string, mealType: string) {
    const key = `${date}-${mealType}`
    setRegeneratingSlot(key)
    await fetch('/api/meal-planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart: toDateStr(weekStart), regenerate: { date, mealType } }),
    })
    await fetchSlots()
    setRegeneratingSlot(null)
  }

  async function toggleAccept(slot: Slot) {
    setAcceptingSlot(slot.id)
    await supabase
      .from('meal_plan_slots')
      .update({ accepted: !slot.accepted })
      .eq('id', slot.id)
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, accepted: !s.accepted } : s))
    setAcceptingSlot(null)
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)))
  const hasAnyMeals = slots.length > 0

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0, color: 'var(--ink-900)' }}>
            Meal Planner
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-400)' }}>
            AI-generated, gut-friendly meals tailored to your macros
          </p>
        </div>

        <button
          onClick={generateWeek}
          disabled={generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: generating ? 'var(--ink-200)' : 'var(--terracotta-500)',
            color: generating ? 'var(--ink-400)' : '#fff',
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'all 160ms',
          }}
        >
          <Sparkles size={16} />
          {generating ? 'Generating…' : hasAnyMeals ? 'Regenerate Week' : 'Generate Week'}
        </button>
      </div>

      {/* Week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setWeekStart(w => addDays(w, -7))}
          style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={18} color="var(--ink-500)" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', minWidth: 160, textAlign: 'center' }}>
          {formatWeekRange(weekStart)}
        </span>
        <button
          onClick={() => setWeekStart(w => addDays(w, 7))}
          style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={18} color="var(--ink-500)" />
        </button>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div style={{
          background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 14,
          padding: '32px', textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--cream-200)', borderTopColor: 'var(--terracotta-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink-700)' }}>Building your meal plan…</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-400)' }}>AI is crafting 21 gut-friendly meals</p>
        </div>
      )}

      {/* Empty state */}
      {!generating && !loading && !hasAnyMeals && (
        <div style={{
          background: 'var(--cream-100)', border: '2px dashed var(--cream-200)', borderRadius: 14,
          padding: '48px 32px', textAlign: 'center',
        }}>
          <UtensilsCrossed size={40} color="var(--ink-300)" style={{ marginBottom: 16 }} />
          <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink-600)', margin: '0 0 8px' }}>No meals planned yet</p>
          <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>
            Click <strong>Generate Week</strong> to get AI-crafted meals based on your macros.
          </p>
        </div>
      )}

      {/* Meal grid */}
      {!generating && hasAnyMeals && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: 90, textAlign: 'left', paddingBottom: 8, color: 'var(--ink-400)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }} />
                {weekDates.map((date, i) => {
                  const isToday = date === toDateStr(new Date())
                  return (
                    <th key={date} style={{ textAlign: 'center', paddingBottom: 8, minWidth: 130 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: isToday ? 'var(--terracotta-500)' : 'var(--ink-400)',
                      }}>
                        {DAY_LABELS[i]}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--terracotta-500)' : 'var(--ink-600)' }}>
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mealType => (
                <tr key={mealType}>
                  <td style={{ verticalAlign: 'top', paddingTop: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--ink-400)', background: 'var(--cream-100)', borderRadius: 6,
                      padding: '3px 8px', display: 'inline-block',
                    }}>
                      {mealType}
                    </span>
                  </td>
                  {weekDates.map(date => {
                    const slot = getSlot(date, mealType)
                    const key = `${date}-${mealType}`
                    const isExpanded = expandedSlot === (slot?.id ?? key)
                    const isRegenerating = regeneratingSlot === key
                    const isAccepting = acceptingSlot === slot?.id

                    if (!slot && !isRegenerating) {
                      return (
                        <td key={date} style={{ verticalAlign: 'top' }}>
                          <button
                            onClick={() => regenerateMeal(date, mealType)}
                            style={{
                              width: '100%', minHeight: 80, background: 'var(--cream-100)',
                              border: '1px dashed var(--cream-200)', borderRadius: 10,
                              cursor: 'pointer', color: 'var(--ink-300)', fontSize: 12,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                          >
                            <Sparkles size={14} /> Generate
                          </button>
                        </td>
                      )
                    }

                    if (isRegenerating) {
                      return (
                        <td key={date} style={{ verticalAlign: 'top' }}>
                          <div style={{
                            minHeight: 80, background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
                            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ width: 20, height: 20, border: '2px solid var(--cream-200)', borderTopColor: 'var(--terracotta-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={date} style={{ verticalAlign: 'top' }}>
                        <div style={{
                          background: slot!.accepted ? '#f0faf4' : '#fff',
                          border: `1px solid ${slot!.accepted ? '#86efac' : 'var(--cream-200)'}`,
                          borderRadius: 10, overflow: 'hidden',
                          transition: 'all 160ms',
                        }}>
                          {/* Card header */}
                          <div
                            style={{ padding: '10px 10px 8px', cursor: 'pointer' }}
                            onClick={() => setExpandedSlot(isExpanded ? null : slot!.id)}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3, marginBottom: 6 }}>
                              {slot!.meal_name}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <MacroPill label={`${Math.round(slot!.calories)} cal`} color="var(--ink-400)" />
                              <MacroPill label={`P ${Math.round(slot!.protein_g)}g`} color="var(--forest-500)" />
                              <MacroPill label={`C ${Math.round(slot!.carbs_g)}g`} color="var(--terracotta-400)" />
                              <MacroPill label={`F ${Math.round(slot!.fat_g)}g`} color="var(--ink-300)" />
                            </div>
                          </div>

                          {/* Expanded recipe */}
                          {isExpanded && (
                            <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--cream-100)' }}>
                              <div style={{ paddingTop: 8 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-400)', margin: '0 0 4px' }}>Ingredients</p>
                                <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.7 }}>
                                  {(slot!.ingredients ?? []).map((ing, i) => (
                                    <li key={i}>{ing}</li>
                                  ))}
                                </ul>
                              </div>
                              {slot!.directions && (
                                <div style={{ marginTop: 8 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-400)', margin: '0 0 4px' }}>Directions</p>
                                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.6 }}>{slot!.directions}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', borderTop: '1px solid var(--cream-100)' }}>
                            <button
                              onClick={() => toggleAccept(slot!)}
                              disabled={isAccepting}
                              style={{
                                flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                                background: slot!.accepted ? '#dcfce7' : 'var(--cream-50)',
                                color: slot!.accepted ? '#16a34a' : 'var(--ink-400)',
                                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                transition: 'all 120ms',
                              }}
                              title={slot!.accepted ? 'Unaccept' : 'Accept meal'}
                            >
                              <Check size={13} />
                              {slot!.accepted ? 'Saved' : 'Save'}
                            </button>
                            <div style={{ width: 1, background: 'var(--cream-100)' }} />
                            <button
                              onClick={() => regenerateMeal(date, mealType)}
                              style={{
                                flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                                background: 'var(--cream-50)', color: 'var(--ink-400)',
                                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                transition: 'all 120ms',
                              }}
                              title="Regenerate this meal"
                            >
                              <RefreshCw size={13} />
                              Swap
                            </button>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function MacroPill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: 'var(--cream-50)', borderRadius: 4, padding: '1px 5px', border: '1px solid var(--cream-200)' }}>
      {label}
    </span>
  )
}
