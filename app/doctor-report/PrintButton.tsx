'use client'

import { Printer, ArrowLeft } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: '#1a3a2e', color: '#fff', border: 'none',
        borderRadius: 8, padding: '9px 18px',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}
    >
      <Printer size={15} /> Print / Save PDF
    </button>
  )
}

export function BackButton() {
  return (
    <a
      href="/insights"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: '#4a7c6f', fontSize: 14, fontWeight: 500,
        textDecoration: 'none', fontFamily: 'var(--font-body)',
      }}
    >
      <ArrowLeft size={15} /> Back to Insights
    </a>
  )
}
