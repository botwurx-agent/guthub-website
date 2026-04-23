'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const items = [
  { q: 'How does Guthub AI work?', a: 'You share context about your diet, symptoms, and goals. Guthub then holds ongoing conversations with you — answering questions, spotting patterns, and adapting as you learn more about your body.' },
  { q: 'Is my data secure?', a: 'Yes. Your health data is encrypted at rest and in transit, never sold, and never used to train public models. You can delete everything at any time.' },
  { q: "Can Guthub replace my doctor?", a: "No — and it's not designed to. Guthub complements your professional care by giving you grounded guidance between appointments. For diagnosis, medication, and acute issues, always see a clinician." },
  { q: 'How often should I use it?', a: "As often as a question comes up. Most members chat 2–5 times a week, but there's no minimum. The more context you share, the more helpful Guthub becomes." },
  { q: 'What happens after the founding period?', a: "Regular pricing is $19.95/month. If you join the Founders Cohort, your $9.95/month rate is locked in for life — as long as your subscription stays active." },
  { q: 'Can I cancel?', a: "Any time, from your account page. No calls, no friction. 30-day money-back guarantee on your first month." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section-pad section-pad-v" style={{ padding: '96px 32px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)' }}>
            Questions, <em style={{ fontStyle: 'italic' }}>answered.</em>
          </h2>
        </Reveal>
        <Reveal delay={150} y={16}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {items.map((it, i) => (
              <div key={i} style={{ borderTop: i ? '1px solid var(--ink-100)' : 'none' }}>
                <button className="faq-button" onClick={() => setOpen(open === i ? -1 : i)} style={{
                  width: '100%', padding: '22px 28px', background: 'transparent', border: 'none',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--ink-900)',
                }}>
                  {it.q}
                  {open === i ? <Minus size={20} color="var(--terracotta-500)" style={{ flexShrink: 0 }} /> : <Plus size={20} color="var(--terracotta-500)" style={{ flexShrink: 0 }} />}
                </button>
                {open === i && (
                  <div className="faq-answer" style={{ padding: '0 28px 24px', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-700)', maxWidth: '68ch' }}>{it.a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
