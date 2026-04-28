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

  const bars = [55, 80, 65, 90, 45, 70, 85];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div ref={ref} style={{ width: 280, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-body)', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 12px' }}>
          <svg viewBox="0 0 110 110" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--cream-100)" strokeWidth="10" />
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--forest-500)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={visible ? 2 * Math.PI * 46 * (1 - 0.64) : 2 * Math.PI * 46}
              style={{ transition: 'stroke-dashoffset 1.2s var(--ease-out)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-900)' }}>64%</div>
            <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>to goal</div>
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>172 lbs → 158 lbs</div>
        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>9 lbs lost · 5 to go</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>Weekly calories</div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 60 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', background: i === 6 ? 'var(--terracotta-400)' : 'var(--forest-400)', borderRadius: 4, height: visible ? `${h}%` : '0%', transition: `height 800ms ${i * 80}ms var(--ease-out)` }} />
            <div style={{ fontSize: 9, color: 'var(--ink-400)' }}>{days[i]}</div>
          </div>
        ))}
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

function MockDashboard() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const symptomData = [30, 55, 40, 70, 35, 20, 15];
  const mealData = [65, 70, 60, 85, 55, 75, 80];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div ref={ref} style={{ width: 320, background: 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', overflow: 'hidden', fontFamily: 'var(--font-body)', padding: '20px', color: 'var(--cream-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Health dashboard</div>
        <div style={{ fontSize: 10, color: 'rgba(250,245,238,0.6)' }}>Last 7 days</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Gut score', val: '82', unit: '/100', color: 'var(--terracotta-300)' },
          { label: 'Avg calories', val: '1,840', unit: 'kcal', color: 'var(--forest-300)' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '12px', background: 'rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: 'rgba(250,245,238,0.6)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: s.color, opacity: visible ? 1 : 0, transition: `opacity 600ms ${i * 150}ms` }}>{s.val}</span>
              <span style={{ fontSize: 11, color: 'rgba(250,245,238,0.5)' }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(250,245,238,0.6)', marginBottom: 8 }}>Symptoms vs meals</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, position: 'relative' }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
              <div style={{ width: '100%', background: 'rgba(224,124,89,0.7)', borderRadius: '2px 2px 0 0', height: visible ? `${symptomData[i]}%` : '0%', transition: `height 700ms ${i * 60}ms var(--ease-out)` }} />
            </div>
            <div style={{ fontSize: 8, color: 'rgba(250,245,238,0.4)' }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(250,245,238,0.6)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(224,124,89,0.7)' }} /> Symptoms
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(250,245,238,0.6)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--forest-400)' }} /> Meals logged
        </div>
      </div>
    </div>
  );
}

/* ── Feature block data ── */

const blocks = [
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
    id: 'goal',
    eyebrow: 'Goal tracker',
    headline: 'See exactly where you stand.',
    body: 'Set your target weight and daily macro goals. Guthub tracks every meal, charts your progress week by week, and nudges you gently when you drift off course.',
    bullets: ['Visual progress ring toward goal weight', 'Daily macro bar charts', 'Gentle nudges when you need them'],
    icon: Target,
    visual: <MockGoal />,
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
  {
    id: 'dashboard',
    eyebrow: 'Health dashboard',
    headline: 'Everything in one view.',
    body: "The dashboard pulls together your gut score, symptom trends, calorie history, and meal logs into a single at-a-glance view — so you always know if you're heading in the right direction.",
    bullets: ['Gut score + symptom trend chart', 'Calorie and macro history', 'Meal-to-symptom correlation view'],
    icon: LayoutDashboard,
    visual: <MockDashboard />,
    bg: 'var(--forest-500)',
    visualRight: false,
    dark: true,
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
  const textColor = block.dark ? 'var(--cream-100)' : 'var(--ink-900)';
  const subColor = block.dark ? 'rgba(250,245,238,0.75)' : 'var(--ink-700)';
  const bulletColor = block.dark ? 'rgba(250,245,238,0.65)' : 'var(--ink-600)';
  const dotColor = block.dark ? 'var(--terracotta-300)' : 'var(--terracotta-400)';
  const eyebrowColor = block.dark ? 'var(--terracotta-300)' : undefined;

  const textCol = (
    <Reveal style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: eyebrowColor ?? 'var(--terracotta-500)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <block.icon size={14} />
        {block.eyebrow}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400, color: textColor, marginBottom: 18 }}>
        {block.headline}
      </h2>
      <p style={{ fontSize: 17, lineHeight: 1.65, color: subColor, marginBottom: 24 }}>
        {block.body}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {block.bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: bulletColor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 7 }} />
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
      {block.dark && (
        <>
          <div aria-hidden style={{ position: 'absolute', top: -100, right: -60, width: 400, height: 400, background: 'radial-gradient(circle, rgba(224,124,89,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div aria-hidden style={{ position: 'absolute', bottom: -120, left: -80, width: 360, height: 360, background: 'radial-gradient(circle, rgba(244,208,162,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </>
      )}
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
