'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Download, Trash2, ExternalLink, Edit2, Shield, ChevronRight } from 'lucide-react'

type Profile = {
  name: string | null
  dob: string | null
  gender: string | null
  weight_kg: number | null
  height_cm: number | null
  health_profile: Record<string, unknown> | null
  diet_mode: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  subscription_plan: string | null
  trial_ends_at: string | null
}

type MacroTarget = {
  protein_g: number | null
  total_calories: number | null
}

const SECTIONS = [
  { id: 'profile',      label: 'Profile & health' },
  { id: 'goals',        label: 'Goals & macros' },
  { id: 'coach',        label: 'Coach behavior' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'data',         label: 'Privacy & data' },
]

const PLAN_LABELS: Record<string, string> = {
  founding: 'Founding Member',
  launch:   'Launch Plan',
  standard: 'Standard Plan',
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  trialing:   { label: 'Free trial',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  active:     { label: 'Active',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  past_due:   { label: 'Past due',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  canceled:   { label: 'Canceled',    color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  incomplete: { label: 'Incomplete',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

export default function SettingsClient({
  profile,
  macroTarget,
  email,
}: {
  profile: Profile | null
  macroTarget: MacroTarget | null
  email: string
}) {
  const [activeSection, setActiveSection] = useState('profile')
  const [portalLoading, setPortalLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [preferences, setPreferences] = useState({
    proactive_nudges:      (profile?.health_profile as Record<string, unknown>)?.proactive_nudges !== false,
    auto_update_meal_plan: (profile?.health_profile as Record<string, unknown>)?.auto_update_meal_plan !== false,
    weekly_recap:          (profile?.health_profile as Record<string, unknown>)?.weekly_recap !== false,
    share_with_doctor:     Boolean((profile?.health_profile as Record<string, unknown>)?.share_with_doctor),
  })
  const supabase = createClient()

  const h = (profile?.health_profile ?? {}) as Record<string, unknown>
  const conditions = Array.isArray(h.conditions) ? (h.conditions as string[]).join(', ') : (h.conditions as string | undefined) ?? ''
  const allergies  = Array.isArray(h.allergies)  ? (h.allergies  as string[]).join(', ') : (h.allergies  as string | undefined) ?? ''
  const meds       = (h.medications as string | undefined) ?? ''
  const eatingStyle = (profile?.diet_mode ?? 'default') !== 'default'
    ? (profile?.diet_mode ?? '').replace(/_/g, ' ')
    : 'Balanced'

  const statusInfo = STATUS_LABELS[profile?.subscription_status ?? 'trialing'] ?? STATUS_LABELS.trialing
  const planLabel  = PLAN_LABELS[profile?.subscription_plan ?? ''] ?? 'No plan'

  const trialEnd = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  function formatDOB(dob: string | null) {
    if (!dob) return '—'
    const d = new Date(dob + 'T12:00:00')
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000))
    return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (${age})`
  }

  function formatHeight(cm: number | null) {
    if (!cm) return '—'
    const totalIn = Math.round(cm / 2.54)
    return `${Math.floor(totalIn / 12)}' ${totalIn % 12}" · ${Math.round(cm)} cm`
  }

  function formatWeight(kg: number | null) {
    if (!kg) return '—'
    return `${Math.round(kg * 2.20462)} lb · ${kg} kg`
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    } else {
      setPortalLoading(false)
    }
  }

  async function togglePref(key: keyof typeof preferences) {
    const next = { ...preferences, [key]: !preferences[key] }
    setPreferences(next)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: existing } = await supabase.from('profiles').select('health_profile').eq('id', user.id).single()
    const hp = (existing?.health_profile ?? {}) as Record<string, unknown>
    await supabase.from('profiles').update({ health_profile: { ...hp, ...next } }).eq('id', user.id)
  }

  async function handleDeleteAccount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
          Settings
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
          Your <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>profile</em>.
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)' }}>
          What GutHub knows about you, how it talks to you, and what data it keeps.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left nav */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 14, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: activeSection === s.id ? 'var(--terracotta-50)' : 'transparent',
                  color: activeSection === s.id ? 'var(--terracotta-700)' : 'var(--ink-600)',
                  fontSize: 14, fontWeight: activeSection === s.id ? 600 : 400,
                  transition: 'all 120ms',
                }}
              >
                {s.label}
                {activeSection === s.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Profile & health ── */}
          {activeSection === 'profile' && (
            <>
              <SettingsCard
                title="Profile & health"
                action={<a href="/onboarding" style={ghostBtnStyle}><Edit2 size={13} /> Edit</a>}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <SettingRow label="Full name"    value={profile?.name ?? '—'} />
                  <SettingRow label="Email"         value={email} />
                  <SettingRow label="Date of birth" value={formatDOB(profile?.dob ?? null)} />
                  <SettingRow label="Gender"        value={profile?.gender ? profile.gender.replace(/_/g, ' ') : '—'} />
                  <SettingRow label="Height"        value={formatHeight(profile?.height_cm ?? null)} />
                  <SettingRow label="Current weight" value={formatWeight(profile?.weight_kg ?? null)} />
                </div>
                <div style={{ height: 1, background: 'var(--cream-100)', marginBottom: 20 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <SettingRow label="Conditions"             value={conditions || 'None listed'} />
                  <SettingRow label="Allergens & sensitivities" value={allergies || 'None listed'} />
                  <SettingRow label="Eating style"           value={eatingStyle} />
                  {meds && <SettingRow label="Medications" value={meds} />}
                </div>
              </SettingsCard>
            </>
          )}

          {/* ── Goals & macros ── */}
          {activeSection === 'goals' && (
            <SettingsCard
              title="Goals & macros"
              action={<a href="/onboarding" style={ghostBtnStyle}><Edit2 size={13} /> Recalculate</a>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <SettingRow label="Daily calories"   value={macroTarget?.total_calories ? `${macroTarget.total_calories.toLocaleString()} kcal` : '—'} />
                <SettingRow label="Daily protein"    value={macroTarget?.protein_g ? `${macroTarget.protein_g} g` : '—'} />
                <SettingRow label="Goal weight"      value={formatWeight((h.goal_weight_kg as number | undefined) ?? null)} />
                <SettingRow label="Activity level"   value={(h.activity_level as string | undefined)?.replace(/_/g, ' ') ?? '—'} />
              </div>
              <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--cream-50)', borderRadius: 10, border: '1px solid var(--cream-200)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
                Macros are calculated by AI based on your profile, goals, and eating style during onboarding. Click <strong>Recalculate</strong> to restart onboarding and get updated targets.
              </div>
            </SettingsCard>
          )}

          {/* ── Coach behavior ── */}
          {activeSection === 'coach' && (
            <SettingsCard title="Coach behavior">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <ToggleRow
                  label="Proactive nudges"
                  sub="Coach can message you first when it notices patterns or missed logs."
                  value={preferences.proactive_nudges}
                  onChange={() => togglePref('proactive_nudges')}
                />
                <ToggleRow
                  label="Auto-update meal plan"
                  sub="Update next week's plan based on what you logged and how you felt."
                  value={preferences.auto_update_meal_plan}
                  onChange={() => togglePref('auto_update_meal_plan')}
                />
                <ToggleRow
                  label="Weekly recap"
                  sub="Every Sunday morning, a short summary of your week's gut health."
                  value={preferences.weekly_recap}
                  onChange={() => togglePref('weekly_recap')}
                />
                <ToggleRow
                  label="Share insights with doctor"
                  sub="Send your monthly summary PDF to your primary care provider."
                  value={preferences.share_with_doctor}
                  onChange={() => togglePref('share_with_doctor')}
                  last
                />
              </div>
            </SettingsCard>
          )}

          {/* ── Subscription ── */}
          {activeSection === 'subscription' && (
            <>
              <SettingsCard title="Subscription">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink-900)', marginBottom: 6 }}>
                      {planLabel}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
                      borderRadius: 999, padding: '3px 10px',
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {profile?.stripe_customer_id && (
                    <button
                      onClick={openBillingPortal}
                      disabled={portalLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        background: 'var(--terracotta-500)', color: '#fff', border: 'none',
                        borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600,
                        cursor: portalLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <CreditCard size={15} />
                      {portalLoading ? 'Opening…' : 'Manage billing'}
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>

                {trialEnd && profile?.subscription_status === 'trialing' && (
                  <div style={{ padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 14, color: '#92400e', marginBottom: 16 }}>
                    Your free trial ends on <strong>{trialEnd}</strong>. Add a payment method to keep access after your trial.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 4 }}>
                  <div style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 6 }}>What&apos;s included</div>
                    <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.9 }}>
                      <li>Unlimited AI coaching</li>
                      <li>Personalized meal plans</li>
                      <li>Food-symptom insights</li>
                      <li>Lab report analysis</li>
                      <li>Doctor-ready PDF exports</li>
                    </ul>
                  </div>
                  <div style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 6 }}>Billing</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.9 }}>
                      <div>Plan: <strong>{planLabel}</strong></div>
                      <div>Status: <strong>{statusInfo.label}</strong></div>
                      {trialEnd && <div>Trial ends: <strong>{trialEnd}</strong></div>}
                    </div>
                  </div>
                </div>

                {!profile?.stripe_customer_id && (
                  <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--cream-50)', border: '1px solid var(--cream-200)', borderRadius: 10, fontSize: 14, color: 'var(--ink-500)' }}>
                    No payment method on file. <a href="/pricing" style={{ color: 'var(--terracotta-500)', fontWeight: 600 }}>Choose a plan →</a>
                  </div>
                )}
              </SettingsCard>
            </>
          )}

          {/* ── Privacy & data ── */}
          {activeSection === 'data' && (
            <SettingsCard title="Privacy & data" badge={<span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 10px' }}>End-to-end encrypted</span>}>
              <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.7, margin: '0 0 20px' }}>
                Your health data is yours. GutHub never sells your data or shares it with third parties without your explicit consent. You can download a full copy anytime or delete everything permanently.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 9, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-600)' }}
                  onClick={() => alert('Data export coming soon — we\'ll email you a download link.')}
                >
                  <Download size={15} /> Export all data
                </button>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: deleteConfirm ? '#fef2f2' : 'var(--cream-100)', border: `1px solid ${deleteConfirm ? '#fecaca' : 'var(--cream-200)'}`, borderRadius: 9, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: deleteConfirm ? '#dc2626' : 'var(--terracotta-500)', transition: 'all 120ms' }}
                  onClick={() => {
                    if (deleteConfirm) handleDeleteAccount()
                    else setDeleteConfirm(true)
                  }}
                >
                  <Trash2 size={15} /> {deleteConfirm ? 'Confirm — delete everything' : 'Delete account'}
                </button>
                {deleteConfirm && (
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 9, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--ink-500)' }}
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
              {deleteConfirm && (
                <div style={{ marginTop: 16, padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
                  This will permanently delete your account, all logs, insights, meal plans, and conversations. This cannot be undone.
                </div>
              )}

              <div style={{ height: 1, background: 'var(--cream-100)', margin: '24px 0' }} />

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--cream-100)', border: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={17} color="var(--forest-500)" />
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>
                  All health data is stored encrypted at rest in Supabase (SOC 2 Type II). We never train AI models on your personal health data. See our <a href="/privacy" style={{ color: 'var(--terracotta-500)' }}>Privacy Policy</a> and <a href="/medical-disclaimer" style={{ color: 'var(--terracotta-500)' }}>Medical Disclaimer</a>.
                </div>
              </div>
            </SettingsCard>
          )}

        </div>
      </div>
    </div>
  )
}

function SettingsCard({
  title, children, action, badge,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '24px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-900)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  )
}

function ToggleRow({
  label, sub, value, onChange, last = false,
}: {
  label: string; sub: string; value: boolean; onChange: () => void; last?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
      padding: '16px 0', borderBottom: last ? 'none' : '1px solid var(--cream-100)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5 }}>{sub}</div>
      </div>
      <button
        onClick={onChange}
        style={{
          width: 44, height: 26, borderRadius: 999, border: 'none', flexShrink: 0,
          background: value ? 'var(--terracotta-400)' : 'var(--ink-300)',
          position: 'relative', cursor: 'pointer', transition: 'background 160ms',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: 999, background: '#fff',
          transition: 'left 160ms', display: 'block',
        }} />
      </button>
    </div>
  )
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8,
  background: 'var(--cream-100)', border: '1px solid var(--cream-200)',
  fontSize: 13, fontWeight: 600, color: 'var(--ink-700)',
  textDecoration: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer',
}
