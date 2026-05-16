'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2200)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-50)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center' }}>
        <a href="/">
          <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} />
        </a>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {done ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle2 size={52} color="var(--forest-500)" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 10px' }}>
                Password updated
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-600)', fontFamily: 'var(--font-body)' }}>
                Taking you to your dashboard…
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1.2, margin: '0 0 10px' }}>
                  Set a new password
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink-600)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  Choose something strong and memorable.
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '36px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div>
                    <label style={labelStyle}>New password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        style={{ ...inputStyle, paddingRight: 44 }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: 4,
                      }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm password</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      style={inputStyle}
                    />
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: '#FFF0EE', border: '1px solid #EEB3A0', borderRadius: 8, fontSize: 13, color: '#C85A44', fontFamily: 'var(--font-body)' }}>
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: 4, width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                      background: loading ? 'var(--forest-400)' : 'var(--forest-500)',
                      color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
                      : 'Update password'
                    }
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--ink-600)', marginBottom: 6, fontFamily: 'var(--font-body)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: '1.5px solid var(--border)', fontSize: 15,
  fontFamily: 'var(--font-body)', color: 'var(--ink-900)',
  background: '#fff', outline: 'none',
}
