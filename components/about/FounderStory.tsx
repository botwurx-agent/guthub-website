'use client';

import Image from 'next/image';
import { Reveal } from '../ui';

export default function FounderStory() {
  return (
    <section className="section-pad section-pad-v" style={{ padding: '80px 32px 96px', background: 'var(--cream-50)' }}>
      <div className="stack-to-one" style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        {/* Photo */}
        <Reveal style={{ position: 'relative' }}>
          <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/5', position: 'relative' }}>
            <Image
              src="/founder-family.png"
              alt="Steve Nazari with his family"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Floating caption */}
          <div className="founder-caption" style={{ position: 'absolute', bottom: -16, right: -16, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px 18px', boxShadow: 'var(--shadow-md)', maxWidth: 240 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink-900)', marginBottom: 2 }}>Steve Nazari</div>
            <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>Founder &middot; Guthub</div>
          </div>
        </Reveal>

        {/* Story */}
        <Reveal delay={150} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--terracotta-500)' }}>
            The story
          </div>
          <h2 className="h2-mobile" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 2.8vw, 2.4rem)', lineHeight: 1.25, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink-900)', margin: 0 }}>
            The gap I couldn't stop hearing.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            Born and raised in Los Angeles. A husband to an amazing wife and a father of 2 incredible boys. Sports has always played a huge role in my life. Competitive swimming in high school, water polo, basketball, twelve years on the Jiu Jitsu mats. Brown belt. Health, nutrition, and athletics have been wound together my whole life, trying to figure out the right things to eat, especially as I got older.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            Then my gut started getting in the way.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            It crept up on me. Extreme bloating after meals. A kind of fatigue and drowsiness that went beyond tired, the kind that made the hours after eating feel wasted. I'd push through it for a while, then start cutting things out, trying different diets, looking for the pattern myself. Mostly spinning my wheels.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            My wife is a gut-health nutritionist. For years I'd hear her on calls with clients in the next room, people desperate for answers. Sometimes the question was simple. Sometimes complicated. But mostly, people just needed someone to talk to. Someone to ask. Someone to point them in the right direction.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            She helped me find mine. Once I started looking at the full picture, what I was eating, when, what else was going on, things clicked. It wasn't one food. It was a pattern. And I needed someone who knew how to look for it.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            That's when I realized most people don't have that. There's no nutritionist in the next room. No one to call when it's 11pm and you're standing in front of the fridge feeling off and you don't know why. The help people need doesn't come on their schedule.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
            Guthub is my answer to that gap: a helping hand for anyone, any time of the day. For the people who've never had access to expert guidance. And for the people who are working with someone but feel overwhelmed in between, needing a place to hold it all and actually understand it.
          </p>
          <blockquote style={{ margin: 0, padding: '16px 20px', borderLeft: '3px solid var(--terracotta-400)', background: 'var(--terracotta-50)', borderRadius: '0 10px 10px 0' }}>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-800)', fontStyle: 'italic', margin: 0 }}>
              "I wanted one place that could hold all my gut health data and actually help me understand it. Not just store it."
            </p>
            <cite style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--terracotta-600)', fontStyle: 'normal', fontWeight: 600 }}>Steve Nazari, founder</cite>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
