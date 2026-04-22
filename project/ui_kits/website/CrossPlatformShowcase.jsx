// CrossPlatformShowcase.jsx — "Works everywhere" stylized split-screen

function CrossPlatformShowcase() {
  return (
    <section style={{
      padding: '112px 32px',
      background: 'linear-gradient(180deg, var(--cream-50) 0%, var(--cream-100) 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '20%', left: '10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(224,124,89,0.12) 0%, rgba(224,124,89,0) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
      }}>
        <Reveal>
          <Eyebrow>Anywhere you are</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 2.75rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 18, marginBottom: 20, color: 'var(--ink-900)',
            textWrap: 'balance',
          }}>
            Works on the phone in your pocket. <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>Scales to the screen on your desk.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)', marginBottom: 28 }}>
            Snap a plate on your phone at lunch. Review the weekly trends from your laptop in the evening. Guthub syncs everything you log — instantly, silently, across every device.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              'Real-time sync across web and mobile',
              'Camera-first on phone, data-rich on desktop',
              'Your history, everywhere you sign in',
            ].map(b => (
              <li key={b} style={{ display: 'flex', gap: 12, padding: '8px 0', fontSize: 15, color: 'var(--ink-800)' }}>
                <i data-lucide="check" style={{ width: 18, height: 18, color: 'var(--terracotta-500)', flexShrink: 0, marginTop: 3 }}></i>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} y={24}>
          <SplitScreenMock />
        </Reveal>
      </div>
    </section>
  );
}

function SplitScreenMock() {
  return (
    <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%' }}>
      {/* desktop laptop */}
      <div style={{
        position: 'absolute', top: '8%', right: '0%', width: '92%',
        transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)',
        transformStyle: 'preserve-3d',
      }}>
        <LaptopMock />
      </div>
      {/* phone floats on top-left */}
      <div style={{
        position: 'absolute', bottom: '2%', left: '0%', width: '32%',
        transform: 'perspective(1200px) rotateY(6deg) rotateX(-2deg)',
        zIndex: 2,
        animation: 'floatPhone 6s ease-in-out infinite',
      }}>
        <PhoneMock />
      </div>
      <style>{`
        @keyframes floatPhone {
          0%, 100% { transform: perspective(1200px) rotateY(6deg) rotateX(-2deg) translateY(0); }
          50% { transform: perspective(1200px) rotateY(6deg) rotateX(-2deg) translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

function LaptopMock() {
  return (
    <div>
      {/* screen */}
      <div style={{
        aspectRatio: '16/10', background: 'var(--forest-500)',
        borderRadius: '14px 14px 4px 4px',
        padding: 8, border: '1px solid var(--ink-900)',
        boxShadow: '0 30px 60px -20px rgba(42,61,58,0.4)',
      }}>
        <div style={{
          width: '100%', height: '100%', background: 'var(--cream-50)',
          borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
          overflow: 'hidden',
        }}>
          {/* header strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--terracotta-400)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink-900)' }}>Guthub</div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {['Dashboard', 'Meals', 'Chat'].map(t => <div key={t} style={{ fontSize: 9, color: 'var(--ink-600)', padding: '3px 8px', borderRadius: 999, background: t === 'Dashboard' ? 'var(--cream-100)' : 'transparent' }}>{t}</div>)}
            </div>
          </div>
          {/* dashboard area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              ['Weight', '168.4', 'lbs', 'var(--forest-500)'],
              ['Today', '1,842', 'kcal', 'var(--terracotta-500)'],
              ['Streak', '12', 'days', 'var(--ink-800)'],
            ].map(([k, v, u, c]) => (
              <div key={k} style={{ padding: '8px 10px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 8, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: c }}>{v}<span style={{ fontSize: 8, color: 'var(--ink-500)', marginLeft: 2 }}>{u}</span></div>
              </div>
            ))}
          </div>
          {/* chart */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, padding: 8, background: '#fff', borderRadius: 6, border: '1px solid var(--border)' }}>
            {[40, 55, 48, 62, 58, 72, 68, 78, 70, 82, 75, 88, 84, 90].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--terracotta-400)', opacity: 0.5 + i * 0.03, borderRadius: '2px 2px 0 0' }} />
            ))}
          </div>
        </div>
      </div>
      {/* laptop base */}
      <div style={{
        width: '112%', marginLeft: '-6%', height: 10,
        background: 'linear-gradient(180deg, #9CA3A0 0%, #6B7572 100%)',
        borderRadius: '0 0 10px 10px',
        boxShadow: '0 6px 10px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 60, height: 4, margin: '0 auto', background: '#4A5250', borderRadius: '0 0 6px 6px' }} />
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div style={{
      aspectRatio: '9/19.5', background: '#1A1A1A',
      borderRadius: 28, padding: 6,
      boxShadow: '0 20px 40px -10px rgba(42,61,58,0.45)',
      border: '1px solid #2A2A2A',
    }}>
      <div style={{
        width: '100%', height: '100%', background: 'var(--forest-500)',
        borderRadius: 22, overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* notch */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          width: '30%', height: 12, background: '#1A1A1A', borderRadius: 10, zIndex: 2,
        }} />
        {/* content */}
        <div style={{ padding: '36px 14px 14px', color: 'var(--cream-100)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-300)', marginBottom: 4 }}>Snap</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 10, lineHeight: 1.2 }}>Today's plate</div>

          <div style={{
            aspectRatio: '1', borderRadius: 10,
            background: 'radial-gradient(ellipse at 50% 55%, #E8B27A 0%, #C8805A 60%, #8A4A38 100%)',
            marginBottom: 10, position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: '62%', aspectRatio: '1', borderRadius: '50%', background: '#F7E9D0' }}>
              <div style={{ position: 'absolute', top: '20%', left: '20%', width: '32%', height: '28%', borderRadius: '50%', background: '#7FA88F' }} />
              <div style={{ position: 'absolute', top: '22%', right: '18%', width: '28%', height: '26%', borderRadius: '50%', background: '#E07C59' }} />
            </div>
          </div>

          <div style={{ padding: 8, background: 'rgba(250,245,238,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: 8, color: 'var(--terracotta-300)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Detected</div>
            <div style={{ fontSize: 11, color: 'var(--cream-100)', marginBottom: 6 }}>Grain bowl</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['612', 'kcal'], ['28g', 'P'], ['72g', 'C'], ['18g', 'F']].map(([v, l]) => (
                <div key={l} style={{ fontSize: 8, color: 'rgba(250,245,238,0.7)' }}>
                  <div style={{ color: 'var(--cream-100)', fontWeight: 600, fontSize: 9 }}>{v}</div>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--terracotta-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--cream-100)' }}>
              <i data-lucide="camera" style={{ width: 18, height: 18, color: '#fff' }}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CrossPlatformShowcase = CrossPlatformShowcase;
