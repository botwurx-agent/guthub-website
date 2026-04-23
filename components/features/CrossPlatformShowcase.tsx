'use client';

import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const platforms = [
  { icon: Monitor, label: 'Web app', desc: 'Full dashboard experience on any browser' },
  { icon: Smartphone, label: 'iOS & Android', desc: 'Native app with camera snap & offline logs' },
  { icon: Tablet, label: 'Tablet', desc: 'Optimized for meal planning on larger screens' },
];

function LaptopMockup() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Laptop body */}
      <div style={{ position: 'relative' }}>
        {/* Screen */}
        <div style={{ width: 420, background: '#1a1a1c', borderRadius: '12px 12px 0 0', border: '6px solid #2a2a2c', padding: 0, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px -20px rgba(0,0,0,0.6)' }}>
          {/* Menu bar */}
          <div style={{ height: 22, background: '#242426', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6 }}>
            {['#ff5f57', '#ffbe2e', '#28c840'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* App content */}
          <div style={{ background: 'var(--cream-50)', height: 260 }}>
            {/* Top nav */}
            <div style={{ height: 36, background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--forest-500)' }} />
                <div style={{ width: 28, height: 5, borderRadius: 3, background: 'var(--forest-500)' }} />
              </div>
              <div style={{ flex: 1 }} />
              {['#e5e5e5', '#e5e5e5', '#e5e5e5'].map((c, i) => (
                <div key={i} style={{ width: [28, 36, 24][i], height: 5, borderRadius: 3, background: c }} />
              ))}
              <div style={{ width: 52, height: 20, borderRadius: 6, background: 'var(--terracotta-400)' }} />
            </div>
            {/* Dashboard grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0, height: 'calc(100% - 36px)' }}>
              {/* Sidebar */}
              <div style={{ background: '#fff', borderRight: '1px solid var(--border)', padding: '10px 0' }}>
                {[
                  { color: 'var(--terracotta-50)', w: 60, active: true },
                  { color: 'transparent', w: 50 },
                  { color: 'transparent', w: 56 },
                  { color: 'transparent', w: 44 },
                  { color: 'transparent', w: 52 },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: item.active ? item.color : 'transparent', margin: '0 6px', borderRadius: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: item.active ? 'var(--terracotta-400)' : '#e5e5e5' }} />
                    <div style={{ width: item.w, height: 5, borderRadius: 3, background: item.active ? 'var(--terracotta-400)' : '#e5e5e5' }} />
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Gut score', val: '82', color: 'var(--terracotta-400)' },
                    { label: 'Calories', val: '1,480', color: 'var(--forest-500)' },
                    { label: 'Goal', val: '64%', color: 'var(--terracotta-300)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 8, color: 'var(--ink-400)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {/* Chart area */}
                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--border)', padding: '10px', flex: 1 }}>
                  <div style={{ fontSize: 8, color: 'var(--ink-400)', marginBottom: 8 }}>Weekly trend</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                    {[55, 70, 45, 80, 60, 75, 82].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: i === 6 ? 'var(--terracotta-400)' : 'var(--forest-200)', borderRadius: '3px 3px 0 0', height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Hinge */}
        <div style={{ width: 420, height: 8, background: 'linear-gradient(180deg, #2a2a2c 0%, #3a3a3c 100%)', borderRadius: '0 0 2px 2px' }} />
        {/* Base */}
        <div style={{ width: 460, marginLeft: -20, height: 14, background: 'linear-gradient(180deg, #3a3a3c 0%, #2a2a2c 100%)', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 60, height: 5, background: '#2a2a2c', borderRadius: '0 0 4px 4px', margin: '9px auto 0' }} />
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div style={{ position: 'absolute', right: -20, bottom: 40, transform: 'rotateZ(4deg)', filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.35))' }}>
      {/* Phone shell */}
      <div style={{ width: 120, background: '#1a1a1c', borderRadius: 22, border: '5px solid #2a2a2c', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
        {/* Notch */}
        <div style={{ height: 16, background: '#1a1a1c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 30, height: 6, background: '#2a2a2c', borderRadius: 3 }} />
        </div>
        {/* Screen */}
        <div style={{ background: 'var(--cream-50)', minHeight: 200, padding: '8px' }}>
          {/* App header */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--forest-500)' }} />
            <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--ink-900)' }}>Guthub</div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 6 }}>
            {[
              { l: 'Gut score', v: '82', c: 'var(--terracotta-400)' },
              { l: 'Today', v: '1,480', c: 'var(--forest-500)' },
            ].map(s => (
              <div key={s.l} style={{ background: '#fff', borderRadius: 6, padding: '5px 6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 6, color: 'var(--ink-400)', marginBottom: 1 }}>{s.l}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.c, fontFamily: 'var(--font-display)' }}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Camera CTA */}
          <div style={{ background: 'var(--terracotta-400)', borderRadius: 8, padding: '8px', textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>📷</div>
            <div style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>Snap meal</div>
          </div>
          {/* Recent */}
          {[
            { e: '🥗', n: 'Salmon salad', c: '380 kcal' },
            { e: '☕', n: 'Oat milk latte', c: '120 kcal' },
          ].map(r => (
            <div key={r.n} style={{ background: '#fff', borderRadius: 6, padding: '5px 6px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{r.e}</span>
              <div>
                <div style={{ fontSize: 7, fontWeight: 600, color: 'var(--ink-800)' }}>{r.n}</div>
                <div style={{ fontSize: 6, color: 'var(--ink-500)' }}>{r.c}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div style={{ height: 16, background: '#1a1a1c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 28, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

export default function CrossPlatformShowcase() {
  return (
    <section style={{ padding: '112px 32px', background: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(75,120,105,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 72, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow>Works everywhere</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.4vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 18, marginBottom: 18, color: 'var(--ink-900)' }}>
            On every device,{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>always in sync.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)' }}>
            Snap a photo on your phone, review the analysis on your laptop, plan meals on your tablet. Everything stays in sync automatically.
          </p>
        </Reveal>

        {/* Device showcase */}
        <Reveal y={32} duration={900} style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 80 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <LaptopMockup />
            <PhoneMockup />
          </div>
        </Reveal>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 760, margin: '0 auto' }}>
          {platforms.map((p, i) => (
            <Reveal key={p.label} delay={i * 80} y={16}>
              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--forest-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <p.icon size={22} color="var(--forest-500)" />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--ink-900)', marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-600)' }}>{p.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
