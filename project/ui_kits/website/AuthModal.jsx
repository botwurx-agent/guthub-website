// AuthModal.jsx — sign-up / sign-in modal
// Opens via window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'signup' | 'signin' } }))

function AuthModal() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState('signup');

  React.useEffect(() => {
    const onOpen = (e) => {
      setMode((e.detail && e.detail.mode) || 'signup');
      setOpen(true);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('open-auth', onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('open-auth', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isSignup = mode === 'signup';

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(31, 45, 42, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'authFadeIn 200ms var(--ease-out)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--cream-50)',
          width: '100%', maxWidth: 440,
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 40px 80px -20px rgba(31, 45, 42, 0.5)',
          overflow: 'hidden',
          animation: 'authPopIn 280ms var(--ease-out)',
          position: 'relative',
        }}
      >
        {/* close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 34, height: 34, borderRadius: '50%',
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-600)', zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-100)'; e.currentTarget.style.color = 'var(--ink-900)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-600)'; }}
        >
          <i data-lucide="x" style={{ width: 18, height: 18 }}></i>
        </button>

        <div style={{ padding: '36px 36px 28px' }}>
          {/* logo */}
          <img src="../../assets/logo-full.png" alt="GutHub" style={{ height: 26, marginBottom: 20 }} />

          {/* title */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26, fontWeight: 400, lineHeight: 1.22,
            letterSpacing: '-0.02em', color: 'var(--ink-900)',
            margin: '0 0 8px',
          }}>
            {isSignup ? <>Start your <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>2-day free trial</em></> : <>Welcome back.</>}
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--ink-600)', margin: '0 0 24px', lineHeight: 1.5 }}>
            {isSignup
              ? 'Full access to every feature. Cancel anytime.'
              : 'Sign in to continue your journey.'}
          </p>

          {/* Google button */}
          <GoogleButton label={isSignup ? 'Continue with Google' : 'Sign in with Google'} />

          {/* divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', fontSize: 12, color: 'var(--ink-500)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>{isSignup ? 'or sign up with email' : 'or with email'}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* form fields */}
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isSignup && (
              <Field label="Name" type="text" placeholder="Alex Morgan" autoComplete="name" />
            )}
            <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
            <Field
              label="Password"
              type="password"
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              extra={!isSignup && (
                <a href="#" onClick={e => e.preventDefault()} style={{
                  fontSize: 12, color: 'var(--terracotta-500)', textDecoration: 'none', fontWeight: 500,
                }}>Forgot?</a>
              )}
            />

            <button type="submit" style={{
              marginTop: 8,
              padding: '14px 20px',
              background: 'var(--terracotta-400)', color: '#fff',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              transition: 'background 200ms, box-shadow 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta-500)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--terracotta-400)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {isSignup ? 'Create account · Start 2-day trial' : 'Sign in'}
            </button>
          </form>

          {/* toggle link */}
          <div style={{
            textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-600)',
          }}>
            {isSignup ? 'Already have an account? ' : 'New to Guthub? '}
            <a href="#" onClick={e => { e.preventDefault(); setMode(isSignup ? 'signin' : 'signup'); }}
              style={{ color: 'var(--terracotta-500)', textDecoration: 'none', fontWeight: 600 }}>
              {isSignup ? 'Sign in' : 'Create an account'}
            </a>
          </div>
        </div>

        {/* footer */}
        {isSignup && (
          <div style={{
            padding: '14px 36px', background: 'var(--cream-100)',
            borderTop: '1px solid var(--border)',
            fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.5, textAlign: 'center',
          }}>
            By continuing you agree to our <a href="#" style={{ color: 'var(--ink-800)', fontWeight: 500 }}>Terms</a> and <a href="#" style={{ color: 'var(--ink-800)', fontWeight: 500 }}>Privacy Policy</a>.
          </div>
        )}
      </div>

      <style>{`
        @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes authPopIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function Field({ label, type, placeholder, autoComplete, extra }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', letterSpacing: '0.02em' }}>
          {label}
        </span>
        {extra}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          padding: '12px 14px',
          background: '#fff',
          border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--border)'}`,
          borderRadius: 10,
          fontSize: 15, fontFamily: 'var(--font-body)',
          color: 'var(--ink-900)',
          outline: 'none',
          transition: 'border-color 160ms, box-shadow 160ms',
          boxShadow: focus ? '0 0 0 3px rgba(224,124,89,0.15)' : 'none',
        }}
      />
    </label>
  );
}

function GoogleButton({ label }) {
  return (
    <button
      style={{
        width: '100%', padding: '12px 18px',
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 999, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
        color: 'var(--ink-900)',
        transition: 'background 160ms, border-color 160ms, box-shadow 160ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-100)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      {label}
    </button>
  );
}

window.AuthModal = AuthModal;
