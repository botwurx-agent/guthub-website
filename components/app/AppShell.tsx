'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home, List, UtensilsCrossed, BarChart3, Sparkles,
  Users, Settings, HelpCircle, Plus, Bell, Search, RotateCcw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
        <div style={{ padding: '4px 4px 12px', display: 'flex', alignItems: 'center' }}>
          <Image src="/logo-dark.png" alt="GutHub" width={140} height={36} style={{ height: 36, width: 'auto', maxWidth: '100%' }} priority />
        </div>

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
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--cream-50)' }}>

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

            <button
              title="Notifications"
              style={{
                width: 38, height: 38, borderRadius: 999,
                border: '1px solid var(--ink-200)',
                background: 'var(--bg-elev)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--ink-700)', position: 'relative',
                transition: 'all 160ms var(--ease-out)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-100)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elev)' }}
            >
              <Bell size={18} strokeWidth={1.8} />
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8,
                background: 'var(--terracotta-400)',
                border: '2px solid var(--bg-elev)',
                borderRadius: '50%',
              }} />
            </button>

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

      <style>{`
        @media (max-width: 900px) {
          .app-grid { grid-template-columns: 1fr !important; }
          .app-sidebar {
            position: static !important;
            height: auto !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            padding: 12px !important;
          }
          .app-sidebar > div:first-child,
          .app-sidebar > div:nth-child(2),
          .app-sidebar > div:last-child {
            display: none !important;
          }
          .app-topbar-search { display: none !important; }
        }
      `}</style>
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
