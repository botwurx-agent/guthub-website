'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { Check, ShoppingBasket, TrendingUp, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

export default function FeaturesSection() {
  return (
    <section style={{ padding: '96px 32px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 72, maxWidth: 720, margin: '0 auto 72px' }}>
          <Eyebrow>What you get</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)',
          }}>
            Everything you need, <em style={{ fontStyle: 'italic' }}>all in one place.</em>
          </h2>
        </Reveal>

        <FeatureRow eyebrow="Snap & know" title="Take a photo of your meal. Get macros in seconds."
          body="No more guessing portions or hunting through food databases. Guthub identifies ingredients, estimates calories, protein, carbs, and fat — and flags anything that could trigger your symptoms."
          bullets={['Recognizes most meals instantly — including home-cooked dishes', 'Shows macros and gut-health flags side by side', 'Saves to your daily log automatically']}
          visual={<PhotoMacroVisual />} />

        <FeatureRow reverse eyebrow="AI meal planner" title="Meals built around the way you actually eat."
          body="Tell Guthub your diet — low-FODMAP, gluten-free, vegetarian, whatever works for your body — and it generates a week of meals you'll actually want to make, with macros and grocery list included."
          bullets={['Adapts to your dietary preferences and restrictions', 'Swap any meal with one tap — the plan rebalances itself', 'Exports a grocery list, grouped by aisle']}
          visual={<MealPlannerVisual />} />

        <FeatureRow last eyebrow="Goal tracker" title="Watch your progress, day by day."
          body="Set a goal weight and daily macro targets. Log meals manually or via photo, and Guthub gives you visual progress, gentle nudges, and feedback when you're drifting off track."
          bullets={["Set a goal weight — Guthub calculates daily targets", 'Visual rings show protein, carbs, and fat progress', "Weekly check-ins with feedback on what's working"]}
          visual={<GoalTrackerVisual />} />
      </div>
    </section>
  );
}

function FeatureRow({ eyebrow, title, body, bullets, visual, reverse, last }: {
  eyebrow: string; title: string; body: string; bullets: string[];
  visual: React.ReactNode; reverse?: boolean; last?: boolean;
}) {
  return (
    <div style={{
      display: 'grid', gap: 72, alignItems: 'center',
      gridTemplateColumns: '1fr 1fr',
      marginBottom: last ? 0 : 96, paddingBottom: last ? 0 : 96,
      borderBottom: last ? 'none' : '1px solid var(--ink-200)',
      direction: reverse ? 'rtl' : 'ltr',
    }}>
      <Reveal style={{ direction: 'ltr' }} y={20} delay={reverse ? 100 : 0}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1.22,
          letterSpacing: '-0.012em', fontWeight: 400, marginTop: 16, marginBottom: 24,
          color: 'var(--ink-900)',
        }}>{title}</h3>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ink-700)', marginBottom: 20 }}>{body}</p>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bullets.map(t => (
            <li key={t} style={{ display: 'flex', gap: 10, fontSize: 16, color: 'var(--ink-800)', lineHeight: 1.5 }}>
              <Check size={18} color="var(--forest-400)" style={{ flexShrink: 0, marginTop: 4 }} />
              {t}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal style={{ direction: 'ltr', display: 'flex', justifyContent: 'center' }} y={20} delay={reverse ? 0 : 100}>
        {visual}
      </Reveal>
    </div>
  );
}

function PhotoMacroVisual() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    function tick() {
      setPhase(p => {
        const next = (p + 1) % 4;
        id = setTimeout(tick, next === 0 ? 1800 : next === 2 ? 1600 : 2400);
        return next;
      });
    }
    id = setTimeout(tick, 1800);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{
      width: 300, height: 600, borderRadius: 44,
      background: 'var(--ink-900)', padding: 10, boxShadow: 'var(--shadow-xl)', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 26, borderRadius: 14, background: '#000', zIndex: 3,
      }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 36, background: 'var(--cream-50)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 42, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', flexShrink: 0 }}>
          <span>9:41</span>
        </div>
        <div style={{ padding: '10px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--ink-100)', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>Log a meal</div>
        </div>
        <div style={{ flex: 1, position: 'relative', background: 'var(--cream-100)' }}>
          {/* Phase 0: camera prompt */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, opacity: phase === 0 ? 1 : 0, transition: 'opacity 400ms' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--terracotta-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.8s infinite' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>Tap to snap your meal</div>
          </div>
          {/* Phase 1+: plate photo */}
          <div style={{ position: 'absolute', inset: 0, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 400ms' }}>
            <div style={{ position: 'absolute', inset: 16, borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg, #C9A96B 0%, #8B6F3A 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,.25)' }}>
              {/* Plate */}
              <div style={{ position: 'absolute', inset: '18% 14%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #F5EEDF 0%, #E8D9BC 55%, #B8A47B 100%)', boxShadow: '0 8px 24px rgba(0,0,0,.3), inset -12px -12px 20px rgba(0,0,0,.15)' }}>
                <div style={{ position: 'absolute', inset: '14%', borderRadius: '50%', background: `radial-gradient(circle at 30% 35%, #7FB77E 0 18%, transparent 20%), radial-gradient(circle at 65% 28%, #E87A6B 0 14%, transparent 17%), radial-gradient(circle at 45% 65%, #F2C94C 0 16%, transparent 19%), radial-gradient(circle at 72% 70%, #6FB8A8 0 15%, transparent 18%), radial-gradient(circle at 20% 72%, #D97757 0 12%, transparent 15%), radial-gradient(circle at 55% 48%, #B8E0A0 0 14%, transparent 17%), #3F6A4A` }} />
              </div>
              {phase === 2 && (
                <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--terracotta-300), transparent)', boxShadow: '0 0 20px var(--terracotta-400)', animation: 'scanMove 1.5s ease-in-out infinite' }} />
              )}
              {phase >= 2 && [{ x: 38, y: 42 }, { x: 66, y: 36 }, { x: 48, y: 68 }].map((d, i) => (
                <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%,-50%)', animation: `popIn 400ms ${i * 180}ms var(--ease-out) both` }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #fff', background: 'rgba(219,111,86,.9)', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }} />
                </div>
              ))}
            </div>
            {phase === 2 && (
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(27,26,23,.85)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 13 }}>
                <Sparkles size={16} color="var(--terracotta-300)" />
                Analyzing your meal…
                <span style={{ display: 'inline-flex', gap: 3, marginLeft: 'auto' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: `typing 1.2s ${i * 0.15}s infinite`, display: 'block' }} />)}
                </span>
              </div>
            )}
          </div>
          {phase === 3 && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: '#fff', borderRadius: 18, border: '1px solid var(--border)', padding: 16, boxShadow: 'var(--shadow-lg)', animation: 'slideUp 400ms var(--ease-out)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>Chicken plate</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 12 }}>548 kcal · estimated</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                <MacroPill n="46g" label="Protein" tone="terracotta" />
                <MacroPill n="52g" label="Carbs" tone="forest" />
                <MacroPill n="18g" label="Fat" tone="yellow" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--forest-50)', fontSize: 11, color: 'var(--forest-400)', fontWeight: 600 }}>
                <ShieldCheck size={13} />
                Low-FODMAP · good for your gut today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroPill({ n, label, tone }: { n: string; label: string; tone: 'terracotta' | 'forest' | 'yellow' }) {
  const tones = {
    terracotta: { bg: 'var(--terracotta-50)', fg: 'var(--terracotta-700)' },
    forest: { bg: 'var(--forest-50)', fg: 'var(--forest-400)' },
    yellow: { bg: '#FDF4D9', fg: '#8A6B14' },
  };
  const t = tones[tone];
  return (
    <div style={{ background: t.bg, color: t.fg, padding: '8px 6px', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function MealPlannerVisual() {
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveTab(t => (t + 1) % 3), 2600);
    return () => clearInterval(id);
  }, []);
  const tabs = ['Low-FODMAP', 'Mediterranean', 'High-protein'];
  const plans = [
    [{ day: 'Mon', meal: 'Oat bowl + banana', kcal: 420, tag: 'Low FODMAP' }, { day: 'Tue', meal: 'Grilled chicken rice', kcal: 580, tag: 'Low FODMAP' }, { day: 'Wed', meal: 'Salmon + greens', kcal: 540, tag: 'Low FODMAP' }, { day: 'Thu', meal: 'Turkey lettuce wraps', kcal: 460, tag: 'Low FODMAP' }],
    [{ day: 'Mon', meal: 'Greek yogurt + walnuts', kcal: 380, tag: 'Mediterranean' }, { day: 'Tue', meal: 'Tuna farro bowl', kcal: 560, tag: 'Mediterranean' }, { day: 'Wed', meal: 'Chickpea + feta salad', kcal: 490, tag: 'Mediterranean' }, { day: 'Thu', meal: 'Baked cod + lemon', kcal: 440, tag: 'Mediterranean' }],
    [{ day: 'Mon', meal: 'Egg scramble + avocado', kcal: 520, tag: '42g protein' }, { day: 'Tue', meal: 'Steak fajita bowl', kcal: 640, tag: '48g protein' }, { day: 'Wed', meal: 'Chicken + sweet potato', kcal: 580, tag: '45g protein' }, { day: 'Thu', meal: 'Cottage cheese bowl', kcal: 410, tag: '38g protein' }],
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: 22, width: 380, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--terracotta-700)' }}>Your plan</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', marginTop: 2 }}>This week</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--forest-50)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--forest-400)' }}>
          <Sparkles size={12} /> AI-generated
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 4, background: 'var(--cream-100)', borderRadius: 10 }}>
        {tabs.map((t, i) => (
          <div key={t} style={{ flex: 1, textAlign: 'center', padding: '6px 8px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: activeTab === i ? '#fff' : 'transparent', color: activeTab === i ? 'var(--ink-900)' : 'var(--ink-500)', boxShadow: activeTab === i ? 'var(--shadow-xs)' : 'none', transition: 'all 300ms', cursor: 'default' }}>{t}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {plans[activeTab].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--ink-100)' : 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--ink-700)', letterSpacing: '0.04em' }}>{m.day.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-900)', lineHeight: 1.3 }}>{m.meal}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{m.kcal} kcal · {m.tag}</div>
            </div>
            <RefreshCw size={14} color="var(--ink-400)" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ink-100)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-600)' }}>
        <ShoppingBasket size={14} color="var(--forest-400)" /> Grocery list ready · 18 items
      </div>
    </div>
  );
}

function GoalTrackerVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 1200);
    return () => clearInterval(id);
  }, []);
  const targets = { protein: 138, carbs: 210, fat: 72 };
  const current = { protein: 94, carbs: 156, fat: 48 };
  const scale = Math.min(1, (step + 1) / 4);
  const p = {
    protein: (current.protein / targets.protein) * scale,
    carbs: (current.carbs / targets.carbs) * scale,
    fat: (current.fat / targets.fat) * scale,
  };
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: 24, width: 380, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--terracotta-700)' }}>Today</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', marginTop: 2 }}>Goal progress</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>Goal weight</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest-400)' }}>148 lb</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <Ring label="Protein" current={current.protein} target={targets.protein} pct={p.protein} color="var(--terracotta-400)" />
        <Ring label="Carbs" current={current.carbs} target={targets.carbs} pct={p.carbs} color="var(--forest-400)" />
        <Ring label="Fat" current={current.fat} target={targets.fat} pct={p.fat} color="#D4A53A" />
      </div>
      <div style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>Weight · 4 weeks</div>
          <div style={{ fontSize: 11, color: 'var(--forest-400)', fontWeight: 600 }}>−3.2 lb</div>
        </div>
        <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {[62, 58, 60, 54, 52, 48, 50, 42].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--forest-300)', borderRadius: 3, opacity: 0.4 + (i / 8) * 0.6, animation: `barGrow 600ms ${i * 60}ms var(--ease-out) both` }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--forest-50)', borderRadius: 10, fontSize: 12, color: 'var(--forest-400)', lineHeight: 1.45 }}>
        <TrendingUp size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>You're on pace to hit your goal in <strong style={{ fontWeight: 700 }}>6 weeks</strong>. Protein is 44g short — add a snack.</div>
      </div>
    </div>
  );
}

function Ring({ label, current, target, pct, color }: { label: string; current: number; target: number; pct: number; color: string }) {
  const size = 68, stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, pct);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 500ms var(--ease-out)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, color: 'var(--ink-900)', lineHeight: 1 }}>{current}</div>
          <div style={{ fontSize: 9, color: 'var(--ink-500)', marginTop: 2 }}>/ {target}g</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-700)', marginTop: 6, letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}
