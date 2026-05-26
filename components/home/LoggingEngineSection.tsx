'use client'

import { useEffect, useRef, useState } from 'react'
import { Utensils, Activity, Pill, FlaskConical, Droplets, Scale, FileText, Microscope, Sparkles } from 'lucide-react'
import { Eyebrow, Reveal } from '../ui'

const LOG_TYPES = [
  { icon: Utensils,     label: 'Meals',       desc: 'What you ate, when, and how much',      color: '#fca98d' },
  { icon: Activity,     label: 'Symptoms',     desc: 'When they hit and what came before',    color: '#fbbf24' },
  { icon: Pill,         label: 'Supplements',  desc: 'What you take and whether it helps',    color: '#c4b5fd' },
  { icon: FlaskConical, label: 'Ketones',      desc: 'Real-time metabolic data',              color: '#6ee7b7' },
  { icon: Droplets,     label: 'Water',        desc: 'Hydration gaps that affect digestion',  color: '#93c5fd' },
  { icon: Scale,        label: 'Weight',       desc: 'Trends over time, not snapshots',       color: '#fda4af' },
  { icon: FileText,     label: 'Notes',        desc: 'Stress, sleep — what charts miss',      color: '#fde68a' },
  { icon: Microscope,   label: 'Lab results',  desc: 'Biomarkers tied to your daily habits',  color: '#a5f3fc' },
]

const INSIGHTS = [
  {
    tag: 'Pattern found',
    connected: ['Meals', 'Symptoms', 'Water'],
    text: "You've logged bloating 4 of 5 times within 2 hours of lunch this week. Your water intake on those days averaged under half your target — not the food.",
  },
  {
    tag: 'Metabolic signal',
    connected: ['Ketones', 'Meals'],
    text: "Your ketones dipped below 0.5 mmol/L on the 3 days you had oat-based breakfasts. Might be worth testing a swap.",
  },
  {
    tag: "What's working",
    connected: ['Symptoms', 'Notes'],
    text: "Symptoms are down 40% this week. Your notes show 3 consecutive nights above 7 hours of sleep — that's the pattern.",
  },
]

export default function LoggingEngineSection() {
  const [visible, setVisible]           = useState(false)
  const [cardsIn, setCardsIn]           = useState<boolean[]>(Array(8).fill(false))
  const [insightVisible, setInsightVisible] = useState(false)
  const [insightIndex, setInsightIndex] = useState(0)
  const [insightFading, setInsightFading] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Trigger when section enters viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Stagger cards in, then reveal insight
  useEffect(() => {
    if (!visible) return
    const timers: ReturnType<typeof setTimeout>[] = []
    LOG_TYPES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCardsIn(prev => { const n = [...prev]; n[i] = true; return n })
      }, i * 110))
    })
    timers.push(setTimeout(() => setInsightVisible(true), LOG_TYPES.length * 110 + 500))
    return () => timers.forEach(clearTimeout)
  }, [visible])

  // Cycle insights
  useEffect(() => {
    if (!insightVisible) return
    const id = setInterval(() => {
      setInsightFading(true)
      const t = setTimeout(() => {
        setInsightIndex(i => (i + 1) % INSIGHTS.length)
        setInsightFading(false)
      }, 380)
      return () => clearTimeout(t)
    }, 4200)
    return () => clearInterval(id)
  }, [insightVisible])

  const insight = INSIGHTS[insightIndex]
  const connected = new Set(insight.connected)

  return (
    <section ref={sectionRef} style={{
      padding: '112px 32px',
      background: 'var(--forest-500)',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Subtle background texture */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 80% 50%, rgba(63,106,74,0.6) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <Reveal style={{ textAlign: 'center', marginBottom: 72, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <Eyebrow color="var(--terracotta-300)">What you track</Eyebrow>
          <h2 className="h2-mobile" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, marginBottom: 18, color: 'var(--cream-50)',
          }}>
            Everything that affects your gut.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>All in one place.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(250,245,238,0.72)' }}>
            Gut health isn't one thing — it's the overlap between what you eat, what you take, how you feel, and how your body responds. Guthub tracks all of it so the AI sees the full picture, not just a slice of it.
          </p>
        </Reveal>

        {/* Two-column layout */}
        <div className="logging-engine-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 56, alignItems: 'center',
        }}>

          {/* Log type cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {LOG_TYPES.map((lt, i) => {
              const active = insightVisible && connected.has(lt.label)
              return (
                <div key={lt.label} style={{
                  background: active ? 'rgba(250,245,238,0.13)' : 'rgba(250,245,238,0.06)',
                  border: `1px solid ${active ? 'rgba(250,245,238,0.32)' : 'rgba(250,245,238,0.1)'}`,
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 11,
                  opacity: cardsIn[i] ? 1 : 0,
                  transform: cardsIn[i] ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.94)',
                  transition: `opacity 380ms var(--ease-out), transform 380ms var(--ease-out), background 450ms, border-color 450ms`,
                  boxShadow: active ? '0 0 20px rgba(63,106,74,0.4)' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: active ? 'rgba(250,245,238,0.14)' : 'rgba(250,245,238,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 450ms',
                  }}>
                    <lt.icon
                      size={15}
                      color={active ? lt.color : 'rgba(250,245,238,0.45)'}
                      style={{ transition: 'color 450ms' }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, marginBottom: 3,
                      color: active ? 'var(--cream-50)' : 'rgba(250,245,238,0.78)',
                      transition: 'color 450ms',
                    }}>{lt.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(250,245,238,0.42)', lineHeight: 1.4 }}>{lt.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column: label + insight card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(250,245,238,0.5)', letterSpacing: '0.01em' }}>
              The AI reads across all of it —
            </div>

            {/* Insight card */}
            <div style={{
              background: 'var(--cream-50)',
              borderRadius: 20,
              padding: '26px 28px',
              boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
              opacity: insightVisible ? (insightFading ? 0 : 1) : 0,
              transform: insightVisible && !insightFading ? 'translateY(0)' : 'translateY(18px)',
              transition: 'opacity 380ms var(--ease-out), transform 380ms var(--ease-out)',
            }}>

              {/* Coach badge + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', background: 'var(--forest-500)', borderRadius: 999,
                }}>
                  <Sparkles size={11} color="var(--terracotta-300)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cream-100)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Coach · Insight
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                  background: 'var(--terracotta-50)', color: 'var(--terracotta-600)',
                }}>{insight.tag}</span>
              </div>

              {/* Text */}
              <p style={{
                fontSize: 16, lineHeight: 1.7,
                color: 'var(--ink-800)', margin: '0 0 22px',
                fontFamily: 'var(--font-display)', fontWeight: 400,
              }}>
                "{insight.text}"
              </p>

              {/* Connected from */}
              <div style={{ borderTop: '1px solid var(--cream-200)', paddingTop: 14 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--ink-400)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
                }}>Connected from</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {insight.connected.map(tag => (
                    <span key={tag} style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 12px',
                      borderRadius: 999, background: 'var(--forest-50)',
                      color: 'var(--forest-600)', border: '1px solid var(--forest-100)',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cycling indicator dots */}
            <div style={{
              display: 'flex', gap: 6, justifyContent: 'center',
              opacity: insightVisible ? 1 : 0, transition: 'opacity 400ms',
            }}>
              {INSIGHTS.map((_, i) => (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  width: i === insightIndex ? 22 : 6,
                  background: i === insightIndex ? 'var(--terracotta-400)' : 'rgba(250,245,238,0.22)',
                  transition: 'all 350ms var(--ease-out)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .logging-engine-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
