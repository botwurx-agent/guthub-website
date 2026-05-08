'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Home, List, UtensilsCrossed, BarChart3, Sparkles,
  Users, Settings, HelpCircle, Plus, Bell, Search, RotateCcw,
  Info, Zap, Clock, AlertTriangle, X, CheckCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Notif = {
  id: string
  message: string
  type: 'info' | 'insight' | 'reminder' | 'alert'
  read: boolean
  created_at: string
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; badge?: string }

const NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Today',    icon: Home },
  { href: '/log',          label: 'Log',      icon: List },
  { href: '/meal-planner', label: 'Plan',     icon: UtensilsCrossed },
  { href: '/insights',     label: 'Insights', icon: BarChart3 },
  { href: '/coach',        label: 'Coach',    icon: Sparkles, badge: 'AI' },
]

const NAV_FOOT: NavItem[] = [
  { href: '/community', label: 'Community',  icon: Users },
  { href: '/settings',  label: 'Settings',   icon: Settings },
  { href: '/help',      label: 'Need help?', icon: HelpCircle },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [initials, setInitials] = useState('')
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const meta = user.user_metadata ?? {}
      const name: string = meta.name ?? meta.full_name ?? user.email ?? ''
      const parts = name.trim().split(/\s+/)
      const ini = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0]?.[0] ?? '?').toUpperCase()
      setInitials(ini)
    })
  }, [])

  async function handleRestart() {
    if (restarting) return
    if (!confirm('Restart onboarding? Your existing data is preserved, but you\'ll go through the intake form again.')) return
    setRestarting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ onboarding_completed: false }).eq('id', user.id)
    }
    router.push('/onboarding')
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '248px minmax(0, 1fr)',
      minHeight: '100vh',
      background: 'var(--cream-50)',
      fontFamily: 'var(--font-body)',
    }} className="app-grid">


      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="app-sidebar" style={{
        background: 'var(--forest-500)',
        color: 'var(--cream-100)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh',
        borderRight: '1px solid var(--forest-700)',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ padding: '4px 4px 12px', display: 'flex', alignItems: 'center' }}>
          <Image src="/logo-dark.png" alt="GutHub" width={140} height={36} style={{ height: 36, width: 'auto', maxWidth: '100%' }} priority />
        </Link>

        {/* Tagline */}
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
          color: 'rgba(250,245,238,0.55)', textTransform: 'uppercase',
          padding: '0 8px 20px', borderBottom: '1px solid rgba(250,245,238,0.1)',
          marginBottom: 16,
        }}>
          AI Health Assistant
        </div>

        {/* Main nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(item => (
            <NavItemLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(250,245,238,0.1)',
          paddingTop: 16, marginTop: 16,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <button
            onClick={handleRestart}
            disabled={restarting}
            title="Replay the intake form"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '8px 12px', marginBottom: 12,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(250,245,238,0.95)',
              background: 'rgba(250,245,238,0.08)',
              border: '1px solid rgba(250,245,238,0.18)',
              borderRadius: 999, cursor: restarting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 160ms var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,245,238,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,245,238,0.08)' }}
          >
            <RotateCcw size={14} strokeWidth={2} />
            <span>{restarting ? 'Restarting…' : 'Restart onboarding'}</span>
          </button>

          {NAV_FOOT.map(item => (
            <NavItemLink key={item.href} item={item} active={isActive(pathname, item.href)} small />
          ))}
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────────────── */}
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden', background: 'var(--cream-50)' }}>

        {/* Top bar */}
        <header style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: '1px solid var(--ink-200)',
          background: 'rgba(253,250,243,0.86)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 10,
        }} className="app-topbar">
          {/* Mobile logo — hidden on desktop, shown on mobile in place of search */}
          <Link href="/dashboard" className="app-topbar-logo" style={{ display: 'none', alignItems: 'center' }}>
            <Image src="/logo-full.png" alt="GutHub" width={110} height={28} style={{ height: 28, width: 'auto' }} priority />
          </Link>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--cream-100)',
            border: '1px solid var(--ink-200)',
            borderRadius: 999, padding: '8px 16px',
            width: 360, maxWidth: '40vw',
            color: 'var(--ink-500)', fontSize: 14,
          }} className="app-topbar-search">
            <Search size={16} />
            <input
              placeholder="Search meals, symptoms, conversations…"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                flex: 1, fontSize: 14, color: 'var(--ink-900)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/log" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 999,
              background: 'var(--cream-200)', color: 'var(--ink-900)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'background 160ms var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-300)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--cream-200)' }}
            >
              <Plus size={14} strokeWidth={2.4} /> Quick log
            </Link>

            <NotificationsBell />

            <Link href="/settings" style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-coral), var(--brand-yellow))',
              color: 'var(--forest-700)',
              fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', textDecoration: 'none',
              border: '2px solid var(--bg-elev)',
              boxShadow: '0 0 0 1px var(--ink-200)',
            }} title="Account">
              {initials || '·'}
            </Link>
          </div>
        </header>

        {children}
      </main>

      {/* ─── MOBILE BOTTOM NAV ─────────────────────────────────────── */}
      <nav className="app-bottom-nav" style={{ display: 'none' }}>
        {NAV.map(item => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '8px 4px', textDecoration: 'none',
              color: active ? 'var(--terracotta-400)' : 'var(--ink-400)',
              fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.02em',
              transition: 'color 160ms',
            }}>
              <Icon size={22} strokeWidth={active ? 2 : 1.75} />
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  position: 'absolute', top: 8, marginLeft: 18,
                  fontSize: 8, fontWeight: 700, background: 'var(--terracotta-400)',
                  color: '#fff', padding: '1px 4px', borderRadius: 999,
                }}>{item.badge}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .app-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
          }
          .app-sidebar { display: none !important; }
          .app-topbar { padding: 0 16px !important; }
          .app-topbar-logo { display: flex !important; }
          .app-topbar-search { display: none !important; }
          .app-bottom-nav {
            display: flex !important;
            position: fixed !important;
            bottom: 0 !important; left: 0 !important; right: 0 !important;
            background: rgba(253,250,243,0.97) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border-top: 1px solid var(--ink-200) !important;
            z-index: 40 !important;
            height: 68px !important;
            padding-bottom: env(safe-area-inset-bottom, 0) !important;
          }
        }
      `}</style>
    </div>
  )
}

const NOTIF_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  info:     Info,
  insight:  Zap,
  reminder: Clock,
  alert:    AlertTriangle,
}
const NOTIF_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
  info:     { icon: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  insight:  { icon: 'var(--terracotta-500)', bg: 'var(--terracotta-50)', border: 'var(--terracotta-200)' },
  reminder: { icon: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  alert:    { icon: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

function timeAgoShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotificationsBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loaded, setLoaded] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Check for unread on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setHasUnread((count ?? 0) > 0)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const load = useCallback(async () => {
    if (loaded) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch stored notifications
    const { data: stored } = await supabase
      .from('notifications')
      .select('id, message, type, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Derive smart notifications from other tables if inbox is empty
    const derived: Omit<Notif, 'id'>[] = []
    const today = new Date().toISOString().split('T')[0]

    const [
      { data: profile },
      { data: todayMeals },
      { data: recentPlan },
      { data: recentInsight },
    ] = await Promise.all([
      supabase.from('profiles').select('trial_ends_at, subscription_status, name').eq('id', user.id).single(),
      supabase.from('meal_logs').select('id').gte('logged_at', today + 'T00:00:00').eq('user_id', user.id).limit(1),
      supabase.from('meal_plan_slots').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('insights').select('created_at, insight_text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ])

    // Trial ending alert
    if (profile?.subscription_status === 'trialing' && profile.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000)
      if (daysLeft <= 3 && daysLeft >= 0) {
        derived.push({ message: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Add a payment method to keep access.`, type: 'alert', read: false, created_at: new Date().toISOString() })
      }
    }

    // No meal logged today nudge
    if (todayMeals?.length === 0) {
      derived.push({ message: `You haven't logged a meal yet today. Tap "Quick log" to add one.`, type: 'reminder', read: false, created_at: new Date().toISOString() })
    }

    // Recent meal plan
    if (recentPlan?.[0]) {
      const planAge = Date.now() - new Date(recentPlan[0].created_at).getTime()
      if (planAge < 7 * 86400000) {
        derived.push({ message: 'Your personalized meal plan is ready. Check the Plan tab to see your week.', type: 'info', read: false, created_at: recentPlan[0].created_at })
      }
    }

    // Recent insight
    if (recentInsight?.[0]) {
      const insightAge = Date.now() - new Date(recentInsight[0].created_at).getTime()
      if (insightAge < 7 * 86400000) {
        derived.push({ message: recentInsight[0].insight_text ?? 'New insight available — check your Insights tab.', type: 'insight', read: false, created_at: recentInsight[0].created_at })
      }
    }

    // Merge: stored first, then derived if inbox empty
    const merged: Notif[] = [
      ...(stored ?? []) as Notif[],
      ...(stored?.length ? [] : derived.map((d, i) => ({ ...d, id: `derived-${i}` }))),
    ]

    setNotifs(merged)
    setLoaded(true)
    setHasUnread(merged.some(n => !n.read))
  }, [loaded, supabase])

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setHasUnread(false)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        title="Notifications"
        onClick={handleOpen}
        style={{
          width: 38, height: 38, borderRadius: 999,
          border: '1px solid var(--ink-200)',
          background: open ? 'var(--cream-100)' : 'var(--bg-elev)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--ink-700)', position: 'relative',
          transition: 'all 160ms var(--ease-out)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-100)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'var(--bg-elev)' }}
      >
        <Bell size={18} strokeWidth={1.8} />
        {hasUnread && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 8, height: 8,
            background: 'var(--terracotta-400)',
            border: '2px solid var(--bg-elev)',
            borderRadius: '50%',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, background: '#fff',
          border: '1px solid var(--cream-200)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--cream-100)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Notifications</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {notifs.some(n => !n.read) && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: 'var(--cream-100)', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', cursor: 'pointer' }}
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-500)' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {!loaded ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--ink-400)' }}>Loading…</div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 4 }}>You&apos;re all caught up</div>
                <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>We&apos;ll notify you when something needs your attention.</div>
              </div>
            ) : notifs.map(n => {
              const Icon = NOTIF_ICONS[n.type] ?? Info
              const colors = NOTIF_COLORS[n.type] ?? NOTIF_COLORS.info
              return (
                <div key={n.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--cream-50)', background: n.read ? '#fff' : 'var(--cream-50)', transition: 'background 150ms' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={15} color={colors.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--ink-800)', lineHeight: 1.5, fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                    <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{timeAgoShort(n.created_at)}</span>
                  </div>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--terracotta-400)', flexShrink: 0, marginTop: 6 }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

function NavItemLink({ item, active, small }: { item: NavItem; active: boolean; small?: boolean }) {
  const Icon = item.icon
  const [hover, setHover] = useState(false)

  const bg = active
    ? 'var(--terracotta-400)'
    : hover ? 'rgba(250,245,238,0.06)' : 'transparent'
  const color = active ? '#fff' : hover ? 'var(--cream-50)' : 'rgba(250,245,238,0.78)'

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: small ? '9px 12px' : '11px 12px',
        borderRadius: 10,
        color, background: bg,
        fontSize: small ? 14 : 15, fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 160ms var(--ease-out)',
      }}
    >
      <Icon size={small ? 16 : 18} strokeWidth={1.75} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: active ? 'rgba(255,255,255,0.22)' : 'rgba(250,245,238,0.16)',
          color: 'var(--cream-50)',
          padding: '2px 8px', borderRadius: 999,
        }}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}
