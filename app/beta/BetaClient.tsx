'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

type Step = 'code' | 'signup' | 'activating' | 'done'

export default function BetaClient() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCodeError('')
    setCodeLoading(true)
    const res = await fetch('/api/beta/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })
    const data = await res.json()
    setCodeLoading(false)
    if (!res.ok) {
      setCodeError(data.error ?? 'Invalid code. Please try again.')
      return
    }
    setStep('signup')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const supabase = createClient()

    // Try sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      // If already registered, try signing in instead
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setAuthError('This email already has an account. Check your password and try again.')
          setAuthLoading(false)
          return
        }
      } else {
        setAuthError(signUpError.message)
        setAuthLoading(false)
        return
      }
    }

    // Activate beta
    setStep('activating')
    const activateRes = await fetch('/api/beta/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), name }),
    })
    const activateData = await activateRes.json()

    if (!activateRes.ok) {
      setAuthError(activateData.error ?? 'Activation failed. Please contact support.')
      setStep('signup')
      setAuthLoading(false)
      return
    }

    setStep('done')
    setTimeout(() => router.push('/onboarding'), 1800)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-50)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/">
          <Image src="/logo-full.png" alt="GutHub" width={120} height={32} style={{ height: 32, width: 'auto' }} />
        </a>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-600)', background: 'var(--terracotta-50)', padding: '4px 12px', borderRadius: 999 }}>
          Beta Access
        </span>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle2 size={56} color="var(--forest-500)" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--ink-900)', margin: '0 0 10px' }}>
                You&apos;re in!
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-600)', fontFamily: 'var(--font-body)' }}>
                Setting up your account…
              </p>
            </div>
          )}

          {/* Activating */}
          {step === 'activating' && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Loader2 size={40} color="var(--forest-500)" style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 15, color: 'var(--ink-600)', fontFamily: 'var(--font-body)' }}>
                Activating your beta access…
              </p>
            </div>
          )}

          {/* Step 1: Code */}
          {step === 'code' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1.2, margin: '0 0 12px' }}>
                  Join the <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>beta.</em>
                </h1>
                <p style={{ fontSize: 16, color: 'var(--ink-600)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
                  Got a beta invite? Enter your code below for 14 days of free access — no credit card required.
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '36px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <form onSubmit={handleCodeSubmit}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                    Beta invite code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. GUTHUB-BETA"
                    required
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10, boxSizing: 'border-box',
                      border: `1.5px solid ${codeError ? '#EEB3A0' : 'var(--border)'}`,
                      fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--ink-900)',
                      background: '#fff', outline: 'none', letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  />
                  {codeError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: '#C85A44', fontFamily: 'var(--font-body)' }}>
                      <AlertCircle size={14} /> {codeError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={codeLoading || !code.trim()}
                    style={{
                      marginTop: 20, width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                      background: codeLoading ? 'var(--forest-400)' : 'var(--forest-500)',
                      color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
                      cursor: codeLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 200ms',
                    }}
                  >
                    {codeLoading
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Checking…</>
                      : <>Continue <ArrowRight size={16} /></>
                    }
                  </button>
                </form>
              </div>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--ink-500)', fontFamily: 'var(--font-body)' }}>
                Already have an account?{' '}
                <a href="/?auth=signin" style={{ color: 'var(--terracotta-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
              </p>
            </>
          )}

          {/* Step 2: Sign up */}
          {step === 'signup' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--forest-50)', color: 'var(--forest-600)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 999, marginBottom: 16 }}>
                  <CheckCircle2 size={13} /> Code accepted
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 400, color: 'var(--ink-900)', lineHeight: 1.2, margin: '0 0 10px' }}>
                  Create your account
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink-600)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  14 days free · No credit card required
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '36px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {authError && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: '#FFF0EE', border: '1px solid #EEB3A0', borderRadius: 8, fontSize: 13, color: '#C85A44', fontFamily: 'var(--font-body)' }}>
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      marginTop: 4, width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                      background: authLoading ? 'var(--forest-400)' : 'var(--forest-500)',
                      color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 200ms',
                    }}
                  >
                    {authLoading
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                      : 'Start 14-day free trial'
                    }
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--ink-400)', fontFamily: 'var(--font-body)' }}>
                    <Lock size={12} /> No credit card required
                  </div>
                </form>
              </div>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--ink-500)', fontFamily: 'var(--font-body)' }}>
                <button
                  onClick={() => { setStep('code'); setAuthError('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--terracotta-600)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}
                >
                  ← Change code
                </button>
                {' · '}
                Already have an account?{' '}
                <a href="/?auth=signin" style={{ color: 'var(--terracotta-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: '1.5px solid var(--border)', fontSize: 15,
  fontFamily: 'var(--font-body)', color: 'var(--ink-900)',
  background: '#fff', outline: 'none',
}
