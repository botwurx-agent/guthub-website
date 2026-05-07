'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '20px', borderRadius: 14,
      background: '#EEF3EF', border: '1px solid var(--forest-200)',
      color: 'var(--forest-500)',
    }}>
      <CheckCircle size={22} color="var(--forest-400)" />
      <span style={{ fontSize: 15, fontWeight: 600 }}>{message}</span>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px', borderRadius: 10,
      background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
      fontSize: 13.5, color: 'var(--error)', lineHeight: 1.4,
    }}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      {message}
    </div>
  )
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: 'var(--terracotta-500)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input({ name, type = 'text', placeholder, autoComplete }: {
  name: string; type?: string; placeholder?: string; autoComplete?: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input name={name} type={type} placeholder={placeholder} autoComplete={autoComplete}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        padding: '11px 14px', background: '#fff',
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--border)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%', boxSizing: 'border-box',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    />
  )
}

export function Textarea({ name, placeholder, rows = 3 }: { name: string; placeholder?: string; rows?: number }) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea name={name} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        padding: '11px 14px', background: '#fff',
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--border)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%', boxSizing: 'border-box',
        resize: 'vertical',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    />
  )
}

export function SubmitBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick?: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '13px 20px', borderRadius: 999, border: 'none',
        background: loading ? 'var(--ink-300)' : hover ? 'var(--terracotta-500)' : 'var(--terracotta-400)',
        color: '#fff', fontSize: 15, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', transition: 'background 200ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : label}
    </button>
  )
}
