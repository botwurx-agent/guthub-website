'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, BarChart2, ArrowLeft, Shield } from 'lucide-react'

const NAV = [
  { href: '/admin',         label: 'Overview',  icon: LayoutDashboard, exact: true },
  { href: '/admin/users',   label: 'Users',     icon: Users },
  { href: '/admin/revenue', label: 'Revenue',   icon: CreditCard },
  { href: '/admin/usage',   label: 'Usage',     icon: BarChart2 },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream-50)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside style={{
        width: 248, flexShrink: 0, background: 'var(--forest-500)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', position: 'sticky', top: 0, height: '100vh',
        borderRight: '1px solid var(--forest-700)',
      }}>
        {/* Logo + badge */}
        <div style={{ padding: '4px 4px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo-dark.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} priority />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px 18px', borderBottom: '1px solid rgba(250,245,238,0.1)', marginBottom: 16 }}>
          <Shield size={13} color="var(--terracotta-400)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--terracotta-400)', textTransform: 'uppercase' }}>
            Admin Panel
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                background: active ? 'var(--terracotta-400)' : 'transparent',
                color: active ? '#fff' : 'rgba(250,245,238,0.75)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 120ms',
              }}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Back to app */}
        <Link href="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
          color: 'rgba(250,245,238,0.5)', fontSize: 13,
          borderTop: '1px solid rgba(250,245,238,0.1)', paddingTop: 16, marginTop: 4,
          transition: 'color 120ms',
        }}>
          <ArrowLeft size={15} />
          Back to app
        </Link>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
