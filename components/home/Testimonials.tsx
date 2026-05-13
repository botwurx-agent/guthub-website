'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Eyebrow, Reveal } from '../ui';

const items = [
  { name: 'Sarah M.', role: 'Marketing Manager, 52', photo: '/testimonial-sarah.png', q: "Before using Guthub, I constantly felt bloated and uncomfortable after meals, but I could never figure out what was actually triggering it. I started logging my meals and symptoms daily, and within a few weeks Guthub helped me notice patterns I would have completely missed on my own. Certain foods I thought were healthy for me were actually causing a lot of my issues. Having everything tracked in one place made it so much easier to understand my body. I feel less bloated, more energized, and finally feel like I have some control over my gut health again." },
  { name: 'James T.', role: 'Retired Firefighter, 67', photo: '/testimonial-james.png', q: "I've tried a handful of health and nutrition apps over the years, but most of them just tracked food without really helping me understand what was going on. After using Guthub, things finally started making sense. I was dealing with brain fog after meals, random gout flare-ups, and sensitivity to foods I couldn't pinpoint. By consistently logging my meals and symptoms, Guthub started connecting patterns I never noticed before. It helped me identify foods that were triggering inflammation and leaving me feeling sluggish. I feel sharper mentally, my flare-ups have become far less frequent, and I finally feel like I understand how my body responds to what I eat." },
  { name: 'Emily R.', role: 'Teacher, 44', photo: '/testimonial-emily.png', q: "For years I felt uncomfortable after eating and just assumed it was normal. I was constantly dealing with bloating, constipation, and frustrating weight gain no matter what diet I tried. Nothing ever seemed to work long term. A friend recommended Guthub, and honestly, I was surprised by how easy it was to use. Logging my meals and symptoms became part of my routine, and over time Guthub helped uncover something I never would have suspected: a sensitivity to caffeine that was affecting my digestion and stress levels more than I realized. Making a few targeted changes based on the patterns Guthub identified made a huge difference. I feel lighter, more comfortable after meals, and finally feel like I'm moving in the right direction with my health." },
];

export default function Testimonials() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '112px 32px', background: '#FFFFFF' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>What members say</Eyebrow>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400, marginTop: 20, color: 'var(--ink-900)' }}>
            Real people, <em style={{ fontStyle: 'italic' }}>real relief.</em>
          </h2>
        </Reveal>
        <div className="cards-3-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {items.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} y={18}>
              <TestimonialCard t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: typeof items[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', padding: 32,
      boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-xs)',
      transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      transition: 'all 320ms var(--ease-out)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
        {[0,1,2,3,4].map(i => <Star key={i} size={16} color="var(--terracotta-400)" fill="var(--terracotta-400)" />)}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.4, color: 'var(--ink-900)', fontWeight: 400, flex: 1, marginBottom: 24 }}>"{t.q}"</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
          <Image src={t.photo} alt={t.name} fill style={{ objectFit: 'cover' }} sizes="44px" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{t.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}
