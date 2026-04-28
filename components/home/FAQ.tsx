'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

type Item = { q: string; a: ReactNode };

const items: Item[] = [
  { q: 'How does Guthub work?', a: 'You start with a 6-minute intake covering your diet, symptoms, sensitivities, and goals. From that moment on, every part of Guthub is tuned to you. You can chat with your AI coach anytime, snap photos of meals, generate weekly meal plans, and track progress against your goals. The more you use it, the sharper the personalization gets.' },
  { q: 'Is the advice safe and accurate?', a: "Guthub is shaped by a certified gut health practitioner who reviews how the AI gives guidance. The system is designed to suggest small, testable adjustments rather than aggressive elimination diets or clinical diagnoses. For anything outside its scope, like medication questions, red-flag symptoms, or conditions that need a doctor, Guthub will tell you to consult a professional. It's built to complement medical care, not replace it." },
  { q: 'Can Guthub replace my doctor or nutritionist?', a: "No, and it's not designed to. Guthub is a coach you can talk to anytime, for the everyday questions that come up between appointments. It works best alongside professional care, not instead of it. For diagnoses, prescriptions, or treatment plans, you should see a qualified clinician." },
  { q: 'Is my data secure?', a: <>Yes. Your intake, meal logs, and conversations are encrypted and stored privately. We never sell your data, and we don&rsquo;t share it with third parties for advertising. You can request a full export or deletion of your account at any time. For full details, see our <Link href="/privacy" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.</> },
  { q: 'Who is Guthub for?', a: "Guthub is built for people navigating gut-related issues like IBS, SIBO, food sensitivities, elimination diets, or persistent bloating and discomfort that doesn't have a clear answer. If you've ever finished a doctor's visit with more questions than you started with, or spent late nights googling what you ate, this is for you." },
  { q: 'How often should I use it?', a: "There's no minimum. Some people check in daily by logging meals, asking questions, and reviewing patterns. Others use it situationally, when something flares up or they're planning a tricky meal. Both work. The product is designed to fit how you actually live." },
  { q: 'Can I cancel anytime?', a: "Yes, in two taps from your account settings. No phone calls, no retention offers, no dark patterns. Your 7-day trial gives you full access. Cancel during the trial and you won't be charged at all." },
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
