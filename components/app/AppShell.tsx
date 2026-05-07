'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, MessageCircle, Lightbulb, UtensilsCrossed, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log',          label: 'Log',        icon: BookOpen },
  { href: '/coach',        label: 'Coach',      icon: MessageCircle },
  { href: '/insights',     label: 'Insights',   icon: Lightbulb },
  { href: '/meal-planner', label: 'Meals',      icon: UtensilsCrossed },
  { href: '/settings',     label: 'Settings',   icon: Settings },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream-50)', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar — desktop */}
      <aside style={{
        display: 'flex', flexDirection: 'column',
        width: 220, flexShrink: 0,
        background: 'var(--forest-500)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, padding: '28px 0 24px',
      }} className="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400,
              color: 'var(--cream-100)', letterSpacing: '-0.01em',
            }}>GutHub</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.58)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 160ms',
              }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', paddingBottom: 80 }} className="app-main">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--forest-500)', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', zIndex: 100, padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      }} className="app-bottom-nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              textDecoration: 'none', padding: '4px 0',
              color: active ? '#fff' : 'rgba(255,255,255,0.48)',
            }}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .app-bottom-nav { display: none !important; }
          .app-main { padding-bottom: 0 !important; }
        }
        @media (max-width: 767px) {
          .app-sidebar { display: none !important; }
          .app-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
