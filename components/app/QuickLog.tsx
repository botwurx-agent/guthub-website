'use client'

import Link from 'next/link'
import { Utensils, Frown, Circle, Droplets, Scale, StickyNote } from 'lucide-react'

const ACTIONS = [
  { href: '/log?type=meal',    label: 'Log meal',    icon: Utensils,   color: '#DB6F56' },
  { href: '/log?type=symptom', label: 'Symptom',     icon: Frown,      color: '#C98A1E' },
  { href: '/log?type=bm',      label: 'Bowel',       icon: Circle,     color: '#6F9477' },
  { href: '/log?type=water',   label: 'Water',       icon: Droplets,   color: '#6FB8A8' },
  { href: '/log?type=weight',  label: 'Weight',      icon: Scale,      color: '#9D978A' },
  { href: '/log?type=note',    label: 'Note',        icon: StickyNote, color: '#7A7468' },
]

export default function QuickLog({ userId, today }: { userId: string; today: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(31,45,42,0.06)',
      border: '1px solid var(--ink-100)',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
        Quick log
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {ACTIONS.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px', borderRadius: 999,
            border: '1.5px solid var(--border)',
            background: 'var(--cream-50)',
            textDecoration: 'none',
            fontSize: 13.5, fontWeight: 500, color: 'var(--ink-700)',
            fontFamily: 'var(--font-body)',
            transition: 'border-color 160ms, background 160ms',
          }}>
            <Icon size={15} color={color} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
