// FeatureMocks.jsx — stylized visual placeholders for feature blocks (not real app UI)

function MockFrame({ children, tilt = 0, accent }) {
  return (
    <div style={{
      position: 'relative', aspectRatio: '4/3', width: '100%',
      borderRadius: 'var(--radius-2xl)',
      background: accent || 'linear-gradient(135deg, var(--cream-100) 0%, var(--cream-50) 100%)',
      boxShadow: 'var(--shadow-xl)',
      border: '1px solid var(--border)',
      overflow: 'hidden', transform: `rotate(${tilt}deg)`,
    }}>
      {children}
    </div>
  );
}

// 1. Snap & know — phone viewfinder with meal + emerging macro card
function MockSnap() {
  return (
    <div style={{ position: 'relative', paddingTop: 20, paddingBottom: 20 }}>
      <MockFrame accent="linear-gradient(160deg, #2E4944 0%, #1F3532 100%)">
        {/* simulated viewfinder */}
        <div style={{
          position: 'absolute', inset: 24, borderRadius: 24,
          background: 'radial-gradient(ellipse at 50% 60%, #E8B27A 0%, #C8805A 45%, #8A4A38 100%)',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)',
        }}>
          {/* plate */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '68%', aspectRatio: '1', borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F7E9D0 70%, #E8D5B5 100%)',
            boxShadow: '0 14px 36px rgba(0,0,0,0.38), inset 0 -4px 10px rgba(0,0,0,0.08)',
          }}>
            {/* inner plate ring */}
            <div style={{
              position: 'absolute', inset: '7%', borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.05)',
            }} />
            {/* chicken breast — top */}
            <div style={{
              position: 'absolute', top: '18%', left: '22%',
              width: '36%', height: '32%',
              background: 'radial-gradient(ellipse at 40% 30%, #E8C7A0 0%, #C89872 60%, #A67A54 100%)',
              borderRadius: '52% 48% 60% 40% / 50% 55% 45% 50%',
              boxShadow: '0 3px 6px rgba(0,0,0,0.15), inset -3px -3px 6px rgba(0,0,0,0.12)',
              transform: 'rotate(-8deg)',
            }}>
              {/* grill marks */}
              <div style={{ position: 'absolute', top: '30%', left: '20%', width: '60%', height: '2px', background: 'rgba(90,50,20,0.35)', borderRadius: 2, transform: 'rotate(-15deg)' }} />
              <div style={{ position: 'absolute', top: '55%', left: '20%', width: '60%', height: '2px', background: 'rgba(90,50,20,0.35)', borderRadius: 2, transform: 'rotate(-15deg)' }} />
            </div>
            {/* rice — right */}
            <div style={{
              position: 'absolute', top: '20%', right: '14%',
              width: '32%', height: '32%',
              background: '#F5EEDE',
              borderRadius: '48% 52% 45% 55% / 50%',
              boxShadow: 'inset -2px -3px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              {/* rice grain texture */}
              {Array.from({ length: 18 }).map((_, i) => {
                const x = (i * 37) % 100;
                const y = (i * 53) % 100;
                const r = (i * 23) % 45 - 22;
                return <div key={i} style={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`,
                  width: 6, height: 2, background: '#fff', borderRadius: 2,
                  transform: `rotate(${r}deg)`, opacity: 0.85,
                }} />;
              })}
            </div>
            {/* salad — bottom left (leafy greens) */}
            <div style={{
              position: 'absolute', bottom: '14%', left: '16%',
              width: '32%', height: '28%',
              borderRadius: '50% 55% 45% 55%',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: '#7FA88F', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '10%', left: '20%', width: '36%', height: '40%', background: '#9BC0A8', borderRadius: '50% 60% 50% 60%', transform: 'rotate(-15deg)' }} />
              <div style={{ position: 'absolute', top: '40%', left: '50%', width: '30%', height: '36%', background: '#6B927A', borderRadius: '60% 50% 60% 50%', transform: 'rotate(20deg)' }} />
              <div style={{ position: 'absolute', top: '20%', right: '15%', width: '22%', height: '22%', background: '#C24D3B', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '18%', left: '24%', width: '20%', height: '20%', background: '#C24D3B', borderRadius: '50%' }} />
            </div>
            {/* mixed veggies — bottom right */}
            <div style={{
              position: 'absolute', bottom: '14%', right: '14%',
              width: '32%', height: '28%',
            }}>
              {/* broccoli */}
              <div style={{ position: 'absolute', top: '10%', left: '8%', width: '40%', height: '50%', background: '#5A8A6E', borderRadius: '50% 50% 40% 40%' }}>
                <div style={{ position: 'absolute', top: '20%', left: '20%', width: '25%', height: '25%', background: '#6FA181', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '15%', right: '15%', width: '25%', height: '25%', background: '#6FA181', borderRadius: '50%' }} />
              </div>
              {/* carrot coins */}
              <div style={{ position: 'absolute', top: '12%', right: '12%', width: '28%', height: '28%', background: '#E67E3E', borderRadius: '50%' }}>
                <div style={{ position: 'absolute', inset: '25%', background: '#F09B5D', borderRadius: '50%' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '14%', right: '28%', width: '26%', height: '26%', background: '#E67E3E', borderRadius: '50%' }}>
                <div style={{ position: 'absolute', inset: '25%', background: '#F09B5D', borderRadius: '50%' }} />
              </div>
              {/* yellow pepper */}
              <div style={{ position: 'absolute', bottom: '10%', left: '14%', width: '34%', height: '26%', background: '#E8C34A', borderRadius: '50% 30% 50% 30% / 50%', transform: 'rotate(-10deg)' }} />
            </div>
          </div>
          {/* corner reticles */}
          {[[8, 8, 'tl'], [8, 'r', 'tr'], ['b', 8, 'bl'], ['b', 'r', 'br']].map(([t, l, k]) => {
            const pos = {};
            if (t === 'b') pos.bottom = 14; else pos.top = 14;
            if (l === 'r') pos.right = 14; else pos.left = 14;
            return <div key={k} style={{ position: 'absolute', ...pos, width: 22, height: 22, borderColor: 'rgba(255,255,255,0.85)', borderStyle: 'solid', borderWidth: 0, ...(k.includes('t') ? { borderTopWidth: 2 } : { borderBottomWidth: 2 }), ...(k.includes('l') ? { borderLeftWidth: 2 } : { borderRightWidth: 2 }) }} />;
          })}
        </div>
        {/* floating macro card */}
        <div style={{
          position: 'absolute', bottom: 32, right: 32,
          background: '#fff', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          minWidth: 180, transform: 'rotate(-3deg)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 6 }}>Detected</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)', marginBottom: 10 }}>Chicken plate</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
            <div><div style={{ color: 'var(--ink-500)' }}>kcal</div><div style={{ fontWeight: 700, color: 'var(--ink-900)' }}>548</div></div>
            <div><div style={{ color: 'var(--ink-500)' }}>P</div><div style={{ fontWeight: 700, color: 'var(--forest-500)' }}>46g</div></div>
            <div><div style={{ color: 'var(--ink-500)' }}>C</div><div style={{ fontWeight: 700, color: 'var(--terracotta-500)' }}>54g</div></div>
            <div><div style={{ color: 'var(--ink-500)' }}>F</div><div style={{ fontWeight: 700, color: 'var(--ink-700)' }}>14g</div></div>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

// 2. Chat — conversation bubbles
function MockChat() {
  return (
    <div style={{ padding: '20px 0' }}>
      <MockFrame>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--terracotta-400)', color: '#fff', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', fontSize: 14, lineHeight: 1.5 }}>
            Is oatmeal OK tomorrow? My stomach felt off yesterday.
          </div>
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#fff', color: 'var(--ink-800)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.5, border: '1px solid var(--border)' }}>
            Based on your FODMAP sensitivity, rolled oats should be fine at ½ cup. Skip the dried fruit — that was likely yesterday's trigger.
          </div>
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, paddingLeft: 4, marginTop: -4 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-400)', opacity: 0.6 - i * 0.18 }} />)}
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

// 3. Goal tracker — progress ring + metrics
function MockGoal() {
  return (
    <div style={{ padding: '20px 0' }}>
      <MockFrame accent="linear-gradient(150deg, #FAF5EE 0%, #F4D0A2 100%)">
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-600)', textTransform: 'uppercase', marginBottom: 8 }}>This week</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink-900)', marginBottom: 24, lineHeight: 1.2 }}>Down 2.1 lbs · on track</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1 }}>
            {/* ring */}
            <svg viewBox="0 0 120 120" style={{ width: 140, height: 140 }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(42,61,58,0.12)" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--terracotta-500)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * 0.72} ${2 * Math.PI * 50}`} transform="rotate(-90 60 60)" />
              <text x="60" y="58" textAnchor="middle" fontFamily="Poppins" fontSize="22" fontWeight="400" fill="var(--ink-900)">72%</text>
              <text x="60" y="76" textAnchor="middle" fontFamily="Poppins" fontSize="10" fill="var(--ink-600)" letterSpacing="1">TO GOAL</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
                ['Current', '168.4 lbs'],
                ['Target', '158 lbs'],
                ['Streak', '12 days'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed rgba(42,61,58,0.15)' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>{k}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

// 4. Meal planner — week grid
function MockPlanner() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const colors = ['#7FA88F', '#E07C59', '#C4A97E', '#7FA88F', '#E07C59', '#C4A97E', '#7FA88F'];
  return (
    <div style={{ padding: '20px 0' }}>
      <MockFrame>
        <div style={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)' }}>This week's plan</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', padding: '4px 10px', borderRadius: 999, background: 'var(--cream-100)' }}>21 meals · gut-friendly</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, flex: 1 }}>
            {days.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-600)', textAlign: 'center', paddingBottom: 2 }}>{d}</div>
                {[0, 1, 2].map(m => (
                  <div key={m} style={{
                    flex: 1, borderRadius: 8,
                    background: colors[(i + m) % colors.length],
                    opacity: 0.35 + m * 0.2,
                    minHeight: 22,
                  }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--cream-100)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-700)' }}>Grocery list ready</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--terracotta-500)' }}>42 items →</span>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

// 5. Test report — lab values with flags
function MockReports() {
  const rows = [
    ['Vitamin D', '18 ng/mL', 'low', '#E07C59'],
    ['Ferritin', '42 ng/mL', 'ok', '#7FA88F'],
    ['hs-CRP', '3.8 mg/L', 'high', '#E07C59'],
    ['B12', '520 pg/mL', 'ok', '#7FA88F'],
    ['Zonulin', '68 ng/mL', 'elevated', '#D9A84A'],
  ];
  return (
    <div style={{ padding: '20px 0' }}>
      <MockFrame>
        <div style={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)' }}>Lab panel</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>Uploaded · 2 min ago</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 16 }}>3 of 12 markers out of range</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {rows.map(([name, val, flag, color]) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--cream-50)', borderRadius: 8,
              }}>
                <div style={{ width: 6, height: 24, background: color, borderRadius: 3 }} />
                <span style={{ fontSize: 13, color: 'var(--ink-800)', flex: 1 }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{val}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 4, color, background: `${color}22`,
                }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

// 6. Health dashboard — multi-metric overview
function MockDashboard() {
  const bars = [35, 58, 42, 68, 75, 62, 82];
  return (
    <div style={{ padding: '20px 0' }}>
      <MockFrame accent="linear-gradient(150deg, #2E4944 0%, #1F3532 100%)">
        <div style={{ padding: 28, height: '100%', color: 'var(--cream-100)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-300)', marginBottom: 6 }}>Dashboard</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20 }}>30-day overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['Weight', '-3.2', 'lbs'],
              ['Adherence', '86', '%'],
              ['Symptoms', '-48', '%'],
            ].map(([k, v, u]) => (
              <div key={k} style={{ padding: '12px 14px', background: 'rgba(250,245,238,0.06)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: 'rgba(250,245,238,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{v}<span style={{ fontSize: 12, color: 'rgba(250,245,238,0.6)', marginLeft: 2 }}>{u}</span></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--terracotta-400)', opacity: 0.55 + i * 0.06, borderRadius: '4px 4px 0 0' }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(250,245,238,0.5)', marginTop: 8, textAlign: 'center', letterSpacing: '0.08em' }}>WEEKLY ENERGY · TRENDING UP</div>
        </div>
      </MockFrame>
    </div>
  );
}

Object.assign(window, { MockSnap, MockChat, MockGoal, MockPlanner, MockReports, MockDashboard });
