'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export type CoachScriptItem = { from: 'user' | 'ai'; text: string; delay: number };

interface CoachChatProps {
  script: CoachScriptItem[];
  /**
   * If true, the loop replays after a 5s pause once the script finishes.
   * If false, the conversation ends on the last bubble. Defaults to true.
   */
  loop?: boolean;
}

export default function CoachChat({ script, loop = true }: CoachChatProps) {
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setInView(true); });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setVisible(script.length);
      setTyping(false);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(r => {
      const t = setTimeout(r, ms);
      timers.push(t);
    });
    async function run() {
      while (!cancelled) {
        setVisible(1);
        setTyping(false);
        for (let i = 1; i < script.length; i++) {
          if (cancelled) return;
          await wait(script[i].delay);
          if (cancelled) return;
          if (script[i].from === 'ai') {
            setTyping(true);
            await wait(900);
            if (cancelled) return;
            setTyping(false);
          }
          setVisible(i + 1);
        }
        if (!loop) return;
        await wait(5000);
      }
    }
    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [inView, reduced, script, loop]);

  return (
    <div ref={ref} style={{
      width: 300, height: 600, borderRadius: 44,
      background: 'var(--ink-900)', padding: 10, boxShadow: 'var(--shadow-xl)', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 26, borderRadius: 14, background: '#000', zIndex: 3,
      }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 36, background: 'var(--cream-50)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 42, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 22px 6px', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', flexShrink: 0 }}>
          <span>9:41</span>
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--ink-100)', flexShrink: 0, background: 'var(--cream-50)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/logo.png" alt="" width={20} height={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>GutHub</div>
            <div style={{ fontSize: 11, color: 'var(--forest-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--forest-300)' }} /> Online
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: '14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, background: 'var(--cream-50)', overflow: 'hidden' }}>
          {script.slice(0, visible).map((m, i) => (
            <CoachBubble key={i} from={m.from}>{m.text}</CoachBubble>
          ))}
          {typing && <CoachTypingBubble />}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--ink-100)', display: 'flex', gap: 8, alignItems: 'center', background: '#fff', flexShrink: 0 }}>
          <div style={{ flex: 1, padding: '8px 12px', borderRadius: 999, background: 'var(--cream-100)', fontSize: 12, color: 'var(--ink-500)' }}>Ask Guthub anything…</div>
          <button style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--terracotta-400)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function CoachBubble({ from, children }: { from: 'user' | 'ai'; children: React.ReactNode }) {
  const isAi = from === 'ai';
  return (
    <div style={{
      alignSelf: isAi ? 'flex-start' : 'flex-end', maxWidth: '85%',
      padding: '8px 11px',
      borderRadius: isAi ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
      background: isAi ? '#fff' : 'var(--terracotta-400)',
      color: isAi ? 'var(--ink-900)' : '#fff',
      fontSize: 12, lineHeight: 1.4,
      border: isAi ? '1px solid var(--ink-100)' : 'none',
      boxShadow: isAi ? 'var(--shadow-xs)' : 'none',
      animation: 'bubbleIn 320ms var(--ease-out)',
    }}>{children}</div>
  );
}

function CoachTypingBubble() {
  return (
    <div style={{
      alignSelf: 'flex-start', padding: '10px 14px',
      borderRadius: '14px 14px 14px 4px', background: '#fff',
      border: '1px solid var(--ink-100)', display: 'flex', gap: 4,
      animation: 'bubbleIn 200ms var(--ease-out)',
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-400)',
          animation: `typing 1.2s ${i * 0.15}s infinite`,
          display: 'block',
        }} />
      ))}
    </div>
  );
}
