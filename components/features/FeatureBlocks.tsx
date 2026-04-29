'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Zap, MessageCircle, Target, CalendarDays, FileText, LayoutDashboard, TrendingUp, Check } from 'lucide-react';
import { Reveal } from '../ui';
import CoachChat, { CoachScriptItem } from '../CoachChat';

/* ── Mock UIs ── */

function MockSnap() {
  const [phase, setPhase] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timings = [1200, 900, 1000, 3000];
    const t = setTimeout(() => setPhase(p => (p + 1) % 4), timings[phase] ?? 1200);
    return () => clearTimeout(t);
  }, [phase, visible]);

  const macros = [
    { label: 'Calories', val: '420 kcal', color: 'var(--terracotta-400)' },
    { label: 'Protein', val: '18 g', color: 'var(--forest-500)' },
    { label: 'Carbs', val: '52 g', color: 'var(--terracotta-300)' },
    { label: 'Fat', val: '14 g', color: 'var(--forest-400)' },
  ];

  return (
    <div ref={ref} style={{ width: 280, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      {/* Photo area */}
      <div style={{ position: 'relative', height: 160, background: 'linear-gradient(135deg, #d4956a 0%, #c87a4e 50%, #a5602e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'14\' fill=\'rgba(255,255,255,0.06)\'/%3E%3C/svg%3E") center/cover' }} />
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🍝</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', opacity: 0.9 }}>Pasta Arrabiata</div>
        </div>
        {/* Scanner overlay */}
        {phase === 1 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 120, height: 120, border: '2px solid var(--terracotta-300)', borderRadius: 12, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--terracotta-400)', animation: 'scanMove 0.9s ease-in-out infinite alternate' }} />
            </div>
          </div>
        )}
        {phase >= 2 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--forest-500)', color: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={10} /> Analyzed
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 10 }}>Nutrition breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {macros.map((m, i) => (
            <div key={m.label} style={{ padding: '8px 10px', background: 'var(--cream-50)', borderRadius: 8, opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(6px)', transition: `all 350ms ${i * 60}ms var(--ease-out)` }}>
              <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 10px', background: 'rgba(224,124,89,0.08)', borderRadius: 8, border: '1px solid rgba(224,124,89,0.2)', opacity: phase >= 3 ? 1 : 0, transition: 'opacity 400ms 300ms' }}>
          <div style={{ fontSize: 11, color: 'var(--terracotta-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={11} /> Flagged: contains garlic & onion (IBS trigger)
          </div>
        </div>
      </div>
    </div>
  );
}

const featuresChatScript: CoachScriptItem[] = [
  { from: 'user', text: "I've been off dairy for two weeks but my bloating is back.", delay: 100 },
  { from: 'ai', text: "Frustrating. Before I help diagnose, two questions: has your stress changed in the last week? And are you eating any new foods to replace the dairy, like coconut milk, oat milk, or soy?", delay: 1400 },
  { from: 'user', text: "Stress has been higher. And yeah, I've been using oat milk a lot.", delay: 1500 },
  { from: 'ai', text: "Both could be playing in. Oat milk is generally well-tolerated, but it's high in FODMAPs and a common trigger for IBS.", delay: 1400 },
  { from: 'ai', text: "Want to swap to almond or rice milk for 5 days and see if the bloating settles?", delay: 1300 },
];

function MockChat() {
  return <CoachChat script={featuresChatScript} loop={false} />;
}

function MockGoal() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Lower is better — symptoms improving across the week.
  const bloating = [6, 5, 5, 4, 3, 4, 3];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const macros = [
    { label: 'Protein', current: 87, target: 120, unit: 'g' },
    { label: 'Carbs', current: 142, target: 180, unit: 'g' },
    { label: 'Fat', current: 38, target: 55, unit: 'g' },
  ];

  return (
    <div ref={ref} style={{
      width: 300, background: '#fff', borderRadius: 20, border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--ink-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
          Your week
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
          Apr 21 &ndash; Apr 27
        </div>
      </div>

      {/* Symptoms — most prominent */}
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 10 }}>
          Bloating
        </div>
        <svg
          role="img"
          aria-label={`Daily bloating severity (lower is better) — ${days.map((d, i) => `${d} ${bloating[i]}`).join(', ')}`}
          viewBox="0 0 280 100" preserveAspectRatio="none"
          style={{ width: '100%', height: 100, display: 'block' }}
        >
          {bloating.map((v, i) => {
            const barW = 26;
            const gap = (280 - barW * 7) / 6;
            const x = i * (barW + gap);
            const fullH = 80;
            const h = (v / 10) * fullH;
            const y = 90 - h;
            return (
              <g key={i}>
                <rect x={x} y={90 - fullH} width={barW} height={fullH} rx={4} fill="var(--cream-100)" />
                <rect
                  x={x}
                  y={visible ? y : 90}
                  width={barW}
                  height={visible ? h : 0}
                  rx={4}
                  fill="var(--forest-400)"
                  style={{ transition: `y 800ms ${i * 70}ms var(--ease-out), height 800ms ${i * 70}ms var(--ease-out)` }}
                >
                  <title>{`${days[i]}: ${v}/10`}</title>
                </rect>
                <text x={x + barW / 2} y={98} textAnchor="middle" fontSize={9} fill="var(--ink-400)" fontFamily="var(--font-body)">{days[i]}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--forest-400)', fontWeight: 600 }}>
          <TrendingUp size={13} style={{ transform: 'scaleY(-1)' }} aria-hidden />
          Symptoms down 32% this week
        </div>
      </div>

      {/* Macros — medium prominence */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--ink-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 10 }}>
          Today&rsquo;s macros
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {macros.map((m, i) => {
            const pct = Math.round((m.current / m.target) * 100);
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-700)', fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>
                    {m.current} / {m.target}{m.unit}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${m.label}: ${m.current} of ${m.target} ${m.unit}`}
                  aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                  style={{ height: 5, background: 'var(--cream-100)', borderRadius: 99, overflow: 'hidden' }}
                >
                  <div style={{
                    height: '100%',
                    width: visible ? `${pct}%` : '0%',
                    background: 'var(--ink-700)',
                    borderRadius: 99,
                    transition: `width 700ms ${300 + i * 80}ms var(--ease-out)`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight — least prominent */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ink-100)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-700)' }}>
          <strong style={{ color: 'var(--ink-900)', fontWeight: 600 }}>Weight:</strong> 168 lb
        </span>
        <span style={{ fontSize: 11, color: 'var(--forest-400)', fontWeight: 600 }}>
          down 1.2 lb this week
        </span>
      </div>

      {/* Coach insight */}
      <div style={{
        padding: '12px 18px 14px', borderTop: '1px solid var(--ink-100)',
        background: 'var(--terracotta-50)',
        fontSize: 11, lineHeight: 1.5, fontStyle: 'italic',
        color: 'var(--terracotta-700)',
      }}>
        Symptoms improving as you&rsquo;ve cut onion and dairy. Stay the course.
      </div>
    </div>
  );
}

function MockPlanner() {
  const [tab, setTab] = useState(0);
  const tabs = ['Low-FODMAP', 'Mediterranean', 'High-protein'];

  const plans = [
    [
      { day: 'Mon', meal: 'Oat porridge + blueberries' },
      { day: 'Tue', meal: 'Grilled salmon + rice' },
      { day: 'Wed', meal: 'Chicken quinoa bowl' },
      { day: 'Thu', meal: 'Zucchini pasta + turkey' },
    ],
    [
      { day: 'Mon', meal: 'Greek yoghurt + walnuts' },
      { day: 'Tue', meal: 'Tuna niçoise salad' },
      { day: 'Wed', meal: 'Grilled sea bass + veg' },
      { day: 'Thu', meal: 'Lentil soup + pita' },
    ],
    [
      { day: 'Mon', meal: 'Egg white omelette + spinach' },
      { day: 'Tue', meal: 'Chicken breast + broccoli' },
      { day: 'Wed', meal: 'Cottage cheese + berries' },
      { day: 'Thu', meal: 'Turkey meatballs + greens' },
    ],
  ];

  useEffect(() => {
    const t = setInterval(() => setTab(t => (t + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <div style={{ padding: '14px 14px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 10 }}>Your meal plan</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: tab === i ? 'var(--terracotta-400)' : 'var(--cream-100)', color: tab === i ? '#fff' : 'var(--ink-600)', transition: 'all 250ms var(--ease-out)', whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plans[tab].map((row, i) => (
          <div key={row.day} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 1, animation: 'slideUp 300ms var(--ease-out) both', animationDelay: `${i * 50}ms` }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--cream-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--terracotta-500)', flexShrink: 0 }}>{row.day}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.4 }}>{row.meal}</div>
          </div>
        ))}
        <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--cream-50)', borderRadius: 8, fontSize: 11, color: 'var(--ink-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDays size={12} color="var(--terracotta-400)" />
          Grocery list ready · 18 items
        </div>
      </div>
    </div>
  );
}

function MockReports() {
  const biomarkers = [
    { name: 'Calprotectin', val: '42 μg/g', status: 'normal', pct: 28 },
    { name: 'Secretory IgA', val: '1,240 μg/ml', status: 'normal', pct: 62 },
    { name: 'Zonulin', val: '98 ng/ml', status: 'elevated', pct: 82 },
    { name: 'Lactoferrin', val: '12 μg/g', status: 'normal', pct: 40 },
  ];

  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: 300, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--terracotta-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={16} color="var(--terracotta-500)" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)' }}>GI-MAP Results</div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>Uploaded Mar 2024</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {biomarkers.map((b, i) => (
          <div key={b.name} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: `all 450ms ${i * 100}ms var(--ease-out)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-700)', fontWeight: 500 }}>{b.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-600)' }}>{b.val}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: b.status === 'elevated' ? 'rgba(224,124,89,0.12)' : 'rgba(75,120,105,0.12)', color: b.status === 'elevated' ? 'var(--terracotta-600)' : 'var(--forest-600)' }}>
                  {b.status}
                </span>
              </div>
            </div>
            <div style={{ height: 4, background: 'var(--cream-100)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: visible ? `${b.pct}%` : '0%', background: b.status === 'elevated' ? 'var(--terracotta-400)' : 'var(--forest-400)', borderRadius: 99, transition: `width 800ms ${i * 100 + 200}ms var(--ease-out)` }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--cream-50)', borderRadius: 10, fontSize: 11, color: 'var(--ink-700)', lineHeight: 1.5 }}>
        <strong>AI summary:</strong> Zonulin elevation suggests mild intestinal permeability. Recommend reducing gluten, adding L-glutamine.
      </div>
    </div>
  );
}

function MockDailyHome() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const score = 72;
  const ringSize = 72;
  const ringStroke = 7;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const ringPct = score / 100;

  return (
    <div ref={ref} style={{
      width: 340, background: '#fff', borderRadius: 20, border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)',
      padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Greeting */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-700)' }}>
          Tuesday &middot; April 22
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.2, color: 'var(--ink-900)', marginTop: 4 }}>
          Good afternoon, <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>Steve.</em>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
          Your gut score is up 8 points this week.
        </div>
      </div>

      {/* Proactive coach card — most prominent */}
      <div style={{
        background: 'var(--forest-500)', color: 'var(--cream-100)',
        borderRadius: 14, padding: '16px 16px 14px',
        boxShadow: '0 12px 24px -10px rgba(34, 67, 46, 0.45)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--terracotta-300)' }}>
          Coach &middot; Proactive
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.3, marginTop: 8, marginBottom: 6, color: 'var(--cream-100)' }}>
          You bloated <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>4 of 5</em> times after dairy in the last 14 days.
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(250,245,238,0.78)', marginBottom: 12 }}>
          Want to try a 7-day no-dairy window and see what happens?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{
            background: 'var(--terracotta-400)', color: '#fff',
            border: 'none', borderRadius: 999, padding: '9px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>Start the 7-day window</button>
          <button style={{
            background: 'transparent', color: 'var(--cream-100)',
            border: '1px solid rgba(250,245,238,0.32)', borderRadius: 999,
            padding: '8px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>Talk it through with Coach</button>
        </div>
      </div>

      {/* Gut score row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 14px',
        background: 'var(--cream-50)', border: '1px solid var(--ink-100)', borderRadius: 14,
      }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} aria-hidden>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="var(--cream-200)" strokeWidth={ringStroke} />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none"
              stroke="var(--terracotta-400)" strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={visible ? ringC * (1 - ringPct) : ringC}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              style={{ transition: 'stroke-dashoffset 1100ms var(--ease-out)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-900)', lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--ink-500)', marginTop: 2 }}>GUT SCORE</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 4 }}>
            Today
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--forest-400)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <span aria-hidden>&uarr;</span> +8 this week
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 11, color: 'var(--ink-700)' }}>
            <Chip dotColor="var(--forest-400)" label="Sleep good" />
            <Chip dotColor="var(--terracotta-300)" label="Stress mid" />
            <Chip dotColor="var(--forest-400)" label="Bloat" suffix="↓" />
          </div>
        </div>
      </div>

      {/* Today's meals */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--cream-50)', border: '1px solid var(--ink-100)', borderRadius: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)' }}>Today&rsquo;s meals</div>
          <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>3 logged &middot; 1240 kcal</div>
        </div>
        <Meal time="7:42 AM" name="Oatmeal with berries & almond butter" kcal="380 kcal" tags={['high-fiber']} />
        <div style={{ height: 1, background: 'var(--ink-100)', margin: '8px 0' }} />
        <Meal time="12:18 PM" name="Grilled chicken with roasted veg & quinoa" kcal="520 kcal" tags={['lean-protein', 'low-FODMAP']} />
      </div>
    </div>
  );
}

function Chip({ dotColor, label, suffix }: { dotColor: string; label: string; suffix?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} aria-hidden />
      {label}{suffix ? ` ${suffix}` : ''}
    </span>
  );
}

function Meal({ time, name, kcal, tags }: { time: string; name: string; kcal: string; tags: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 2 }}>{time} &middot; {kcal}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-800)', lineHeight: 1.4 }}>{name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
        {tags.map(t => (
          <span key={t} style={{
            padding: '2px 8px', borderRadius: 999,
            background: 'var(--cream-200)', color: 'var(--ink-700)',
            fontSize: 9, fontWeight: 600, letterSpacing: '0.02em',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Feature block data ── */

const blocks = [
  {
    id: 'chat',
    eyebrow: 'AI chat',
    headline: "A coach that builds on every conversation you've had.",
    body: "Guthub's chat doesn't reset between messages. It pulls from your intake, your meal logs, your symptoms, and every conversation you've had, and it gets sharper the more you use it. Most AI chatbots forget you the moment you close the tab. Guthub remembers, connects, and keeps learning.",
    bullets: [
      'Pulls context from your intake, meal logs, and past conversations automatically',
      "Spots patterns across days and weeks you'd never catch on your own",
      'Suggests small adjustments to test, not dramatic eliminations',
      'Asks follow-up questions like a real coach, not one-shot answers',
    ],
    icon: MessageCircle,
    visual: <MockChat />,
    bg: 'var(--cream-100)',
    visualRight: false,
  },
  {
    id: 'snap',
    eyebrow: 'Snap & know',
    headline: 'Point. Snap. Done.',
    body: 'Photograph any meal and Guthub returns full macros in seconds — calories, protein, carbs, and fat. It also flags ingredients that conflict with your sensitivities before you take a single bite.',
    bullets: ['Instant macro breakdown from a photo', 'Auto-flags your personal triggers', 'Logs to your daily tracker automatically'],
    icon: Camera,
    visual: <MockSnap />,
    bg: 'var(--cream-50)',
    visualRight: true,
  },
  {
    id: 'planner',
    eyebrow: 'Meal planner',
    headline: 'A full week, planned around you.',
    body: "Tell Guthub your diet style, whether that's low-FODMAP, gluten-free, vegetarian, Mediterranean, or whatever fits your body, and it builds a 7-day plan that respects your sensitivities, hits your macro targets, and gives you something you'll actually want to cook. Don't like a meal? Swap it with one tap. Guthub rebalances the rest of the week to keep your macros and your goals on track.",
    bullets: [
      'Generates a 7-day plan tailored to your diet style and triggers',
      'Hits your daily macro targets and aligns with your active goals',
      'Swap any meal with one tap, and the plan rebalances around it',
      'Exports a grocery list, grouped by aisle, ready for the store',
    ],
    icon: CalendarDays,
    visual: <MockPlanner />,
    bg: 'var(--cream-100)',
    visualRight: false,
  },
  {
    id: 'goal',
    eyebrow: 'Goal tracker',
    headline: 'Real progress, not just numbers on a scale.',
    body: "Set the goals that matter to you, whether that's reducing bloating, sticking to an elimination protocol, hitting daily macro targets, or working toward a healthy weight. Guthub tracks every dimension you care about, charts your trends week by week, and nudges you gently when something drifts.",
    bullets: [
      'Track weight, macros, symptoms, and adherence in one view',
      'See weekly trends, not just daily snapshots',
      'Gentle nudges when you start to drift, no shame, no shouting',
      'Connects every data point back to what you ate and how you felt',
    ],
    icon: Target,
    visual: <MockGoal />,
    bg: 'var(--cream-50)',
    visualRight: true,
  },
  {
    id: 'daily-home',
    eyebrow: 'Daily home',
    headline: 'Your gut, summarized every morning.',
    body: "Open Guthub and you're not greeted with another empty input field. You're greeted with a coach who's been paying attention. Your gut score, what's trending, what your symptoms looked like this week, what to focus on today. And when Guthub spots a pattern worth acting on, it tells you, with a one-tap suggestion to test it.",
    bullets: [
      'Daily gut score with trend, built from your symptoms, sleep, stress, and meals',
      'Proactive insights when Guthub spots a pattern in your logs',
      "Today's meals, macros, and how you're feeling, all on one screen",
      'One-tap suggestions you can accept, decline, or talk through with your coach',
    ],
    icon: LayoutDashboard,
    visual: <MockDailyHome />,
    bg: 'var(--cream-100)',
    visualRight: false,
  },
  {
    id: 'reports',
    eyebrow: 'Test reports',
    headline: 'Your lab results, finally explained.',
    body: 'Upload a GI-MAP, SIBO, food-sensitivity, or any other gut test. Guthub reads it, explains each biomarker in plain English, and connects the findings to your daily food log.',
    bullets: ['Reads GI-MAP, SIBO, food-sensitivity tests', 'Plain-English biomarker summaries', 'Connects results to your diet patterns'],
    icon: FileText,
    visual: <MockReports />,
    bg: 'var(--cream-50)',
    visualRight: true,
  },
];

export default function FeatureBlocks() {
  return (
    <div>
      {blocks.map((block) => (
        <FeatureBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function FeatureBlock({ block }: { block: typeof blocks[0] }) {
  const textCol = (
    <Reveal style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-500)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <block.icon size={14} />
        {block.eyebrow}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink-900)', marginBottom: 18 }}>
        {block.headline}
      </h2>
      <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-700)', marginBottom: 24 }}>
        {block.body}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {block.bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--ink-600)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--terracotta-400)', flexShrink: 0, marginTop: 7 }} />
            {b}
          </li>
        ))}
      </ul>
    </Reveal>
  );

  const visualCol = (
    <Reveal delay={150} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {block.visual}
    </Reveal>
  );

  return (
    <section className="section-pad section-pad-v" style={{ padding: '96px 32px', background: block.bg, position: 'relative', overflow: 'hidden' }}>

      <div className="stack-to-one" style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative' }}>
        {block.visualRight ? (
          <>
            {textCol}
            {visualCol}
          </>
        ) : (
          <>
            {visualCol}
            {textCol}
          </>
        )}
      </div>
    </section>
  );
}
