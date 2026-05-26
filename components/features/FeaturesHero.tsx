'use client';

import { useState, useEffect } from 'react';
import { Eyebrow, Reveal } from '../ui';
import { Sparkles, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

/* ── Floating animation keyframe ── */
const FLOAT_CSS = `
  @keyframes floatA { 0%,100%{transform:rotate(-5deg) translateY(20px)} 50%{transform:rotate(-5deg) translateY(10px)} }
  @keyframes floatB { 0%,100%{transform:translateY(0px)}                50%{transform:translateY(-10px)} }
  @keyframes floatC { 0%,100%{transform:rotate(5deg) translateY(20px)}  50%{transform:rotate(5deg) translateY(10px)} }
  @media(max-width:860px){.feat-cards-row{display:none!important}}
`;

/* ── Dashboard card (left) ── */
function DashboardCard({ in: visible }: { in: boolean }) {
  const score = 74;
  const r = 28, stroke = 5;
  const c = 2 * Math.PI * r;

  return (
    <div style={{
      animation: visible ? 'floatA 5s ease-in-out infinite' : 'none',
      marginRight: -32, zIndex: 1, flexShrink: 0,
      opacity: visible ? 0.92 : 0,
      transform: visible ? 'rotate(-5deg) translateY(20px)' : 'rotate(-5deg) translateY(50px)',
      transition: 'opacity 600ms var(--ease-out), transform 600ms var(--ease-out)',
      transitionDelay: '0ms',
    }}>
      <div style={{
        width: 232, background: '#fff',
        borderRadius: 20, border: '1px solid var(--cream-200)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden', fontFamily: 'var(--font-body)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--cream-100)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-600)' }}>Tuesday · May 20</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--ink-900)', marginTop: 3 }}>
            Good morning, <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>Alex.</em>
          </div>
        </div>

        {/* Gut score */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--cream-100)' }}>
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width={64} height={64}>
              <circle cx={32} cy={32} r={r} fill="none" stroke="var(--cream-200)" strokeWidth={stroke} />
              <circle cx={32} cy={32} r={r} fill="none" stroke="var(--terracotta-400)" strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={visible ? c * (1 - score / 100) : c}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dashoffset 1.2s var(--ease-out)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--ink-400)', letterSpacing: '0.04em', marginTop: 1 }}>GUT SCORE</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> +12 this week
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3, lineHeight: 1.4 }}>Bloating down.<br />Sleep trending up.</div>
          </div>
        </div>

        {/* Coach proactive nudge */}
        <div style={{ margin: 12, background: 'var(--forest-500)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
            <Sparkles size={10} color="var(--terracotta-300)" />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--terracotta-300)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coach · Proactive</span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--cream-100)', marginBottom: 10 }}>
            You've bloated 4 of 5 times after dairy this month. Try a 7-day window?
          </div>
          <div style={{ background: 'var(--terracotta-400)', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'inline-block' }}>
            Start the window →
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Coach chat card (center — the hero) ── */
function CoachCard({ in: visible }: { in: boolean }) {
  return (
    <div style={{
      animation: visible ? 'floatB 5s ease-in-out 0.4s infinite' : 'none',
      zIndex: 3, flexShrink: 0, position: 'relative',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(50px)',
      transition: 'opacity 600ms var(--ease-out), transform 600ms var(--ease-out)',
      transitionDelay: '150ms',
    }}>
      <div style={{
        width: 272, background: '#fff',
        borderRadius: 22, border: '1px solid var(--cream-200)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden', fontFamily: 'var(--font-body)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--cream-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-400), var(--forest-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>GutHub Coach</div>
            <div style={{ fontSize: 10, color: 'var(--forest-400)', fontWeight: 600 }}>● Online</div>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{ padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* User message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '82%', padding: '9px 13px',
              background: 'var(--cream-100)', borderRadius: '14px 14px 4px 14px',
              fontSize: 12, lineHeight: 1.55, color: 'var(--ink-800)',
            }}>
              Still bloating even though I've been dairy-free for 2 weeks. Nothing's changing.
            </div>
          </div>

          {/* AI message 1 */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-400), var(--forest-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <Sparkles size={10} color="#fff" />
            </div>
            <div style={{
              maxWidth: '85%', padding: '9px 13px',
              background: 'var(--forest-50)', border: '1px solid var(--forest-100)',
              borderRadius: '4px 14px 14px 14px',
              fontSize: 12, lineHeight: 1.6, color: 'var(--ink-800)',
            }}>
              Looked at your last 14 days. The 4 times you bloated, you'd noted high stress the evening before — not on dairy days. It's a stress-gut pattern, not a food one.
            </div>
          </div>

          {/* AI message 2 */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, flexShrink: 0 }} />
            <div style={{
              maxWidth: '85%', padding: '9px 13px',
              background: 'var(--forest-50)', border: '1px solid var(--forest-100)',
              borderRadius: '4px 14px 14px 14px',
              fontSize: 12, lineHeight: 1.6, color: 'var(--ink-800)',
            }}>
              Want to track stress levels for a week and test if the pattern holds?
            </div>
          </div>
        </div>

        {/* Source tags */}
        <div style={{ padding: '8px 14px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Cross-referenced from</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['Meals', 'Symptoms', 'Notes'].map(tag => (
              <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'var(--terracotta-50)', color: 'var(--terracotta-600)', border: '1px solid var(--terracotta-100)' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* "Most users discover this in week 2" social nudge */}
      <div style={{
        position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
        whiteSpace: 'nowrap', background: 'var(--ink-900)', borderRadius: 999,
        padding: '5px 14px', fontSize: 11, fontWeight: 600, color: 'var(--cream-100)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
      }}>
        ✦ Most users discover their trigger in week 2
      </div>
    </div>
  );
}

/* ── Insights card (right) ── */
function InsightsCard({ in: visible }: { in: boolean }) {
  return (
    <div style={{
      animation: visible ? 'floatC 5s ease-in-out 0.8s infinite' : 'none',
      marginLeft: -32, zIndex: 1, flexShrink: 0,
      opacity: visible ? 0.92 : 0,
      transform: visible ? 'rotate(5deg) translateY(20px)' : 'rotate(5deg) translateY(50px)',
      transition: 'opacity 600ms var(--ease-out), transform 600ms var(--ease-out)',
      transitionDelay: '300ms',
    }}>
      <div style={{
        width: 232, background: '#fff',
        borderRadius: 20, border: '1px solid var(--cream-200)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden', fontFamily: 'var(--font-body)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--cream-100)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta-600)' }}>Your insights</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-900)', marginTop: 3 }}>Apr 21 — Apr 27</div>
        </div>

        {/* What's working */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cream-100)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--forest-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={10} /> What's working
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Bloating down 38% since cutting oat milk',
              'Fewer flare-ups on days with 8+ glasses of water',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--forest-400)', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 11.5, color: 'var(--ink-700)', lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What to watch */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--terracotta-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={10} /> What to watch
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Symptoms spike after high-stress evenings — 3 weeks running',
              'Protein 15g below target on most days',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--terracotta-400)', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 11.5, color: 'var(--ink-700)', lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function FeaturesHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  return (
    <section className="section-pad" style={{
      padding: '120px 32px 100px', textAlign: 'center',
      background: `
        radial-gradient(ellipse 80% 70% at 10% 120%, rgba(219,111,86,0.32) 0%, transparent 60%),
        radial-gradient(ellipse 55% 75% at 92% -5%, rgba(63,106,74,0.20) 0%, transparent 55%),
        var(--cream-50)
      `,
    }}>
      <style>{FLOAT_CSS}</style>

      {/* Copy */}
      <Reveal style={{ maxWidth: 820, margin: '0 auto 80px' }}>
        <Eyebrow>Features</Eyebrow>
        <h1 className="h1-mobile" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5.2vw, 4.25rem)',
          lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
        }}>
          Every feature feeds{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>the same engine.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 640, margin: '0 auto' }}>
          Most health apps collect your data and leave the thinking to you. In Guthub, every meal you log, every symptom you track, every test you upload feeds the same AI — and it uses all of it to actively connect the dots. The longer you use it, the sharper the picture gets.
        </p>
      </Reveal>

      {/* Three mock screens */}
      <div className="feat-cards-row" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        maxWidth: 860, margin: '0 auto', paddingBottom: 40,
      }}>
        <DashboardCard in={mounted} />
        <CoachCard in={mounted} />
        <InsightsCard in={mounted} />
      </div>
    </section>
  );
}
