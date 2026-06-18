'use client';

import { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import { MoreHorizontal, Sparkles } from 'lucide-react';
import PhoneFrame from './PhoneFrame';

type Msg = { from: 'user' | 'ai'; node: ReactNode; pattern?: boolean; delay: number };

function Hl({ children }: { children: ReactNode }) {
  return (
    <span style={{
      background: 'rgba(219,111,86,0.16)', color: 'var(--terracotta-600)',
      fontWeight: 600, borderRadius: 5, padding: '1px 5px', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

const script: Msg[] = [
  { from: 'user', node: 'Why did dinner leave me bloated tonight?', delay: 100 },
  {
    from: 'ai', pattern: true, delay: 1200,
    node: (
      <>Looking at your log, you had <Hl>broccoli</Hl>, <Hl>beans</Hl>, and a <Hl>cold brew</Hl> within 3 hours. That combo is a known trigger for you.</>
    ),
  },
  { from: 'ai', node: 'Try spacing those foods out, and skip coffee after 3pm for a week. Want me to set a reminder?', delay: 1600 },
  { from: 'user', node: 'Yes please.', delay: 800 },
  { from: 'ai', node: "✓ Reminder set. I'll check in tomorrow.", delay: 1200 },
];

export default function EnhancedChatAnimation({ staticPreview = false }: { staticPreview?: boolean }) {
  const [visible, setVisible] = useState(staticPreview ? script.length : 1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (staticPreview) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(r => { const t = setTimeout(r, ms); timers.push(t); });

    async function run() {
      while (!cancelled) {
        setVisible(1);
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
        await wait(5000);
      }
    }
    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [staticPreview]);

  return (
    <PhoneFrame>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
        {/* chat chrome */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream-50)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--forest-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo.png" alt="" width={22} height={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>GutHub</div>
            <div style={{ fontSize: 12, color: 'var(--forest-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest-300)' }} /> Online
            </div>
          </div>
          <MoreHorizontal size={18} color="var(--ink-500)" />
        </div>
        {/* messages */}
        <div style={{
          padding: '20px 18px', flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10,
          background: 'var(--cream-50)', overflow: 'hidden',
        }}>
          {script.slice(0, visible).map((m, i) => <Bubble key={i} msg={m} />)}
          {typing && <TypingBubble />}
        </div>
        {/* composer */}
        <div style={{
          padding: '12px 14px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, alignItems: 'center', background: '#fff',
        }}>
          <div style={{
            flex: 1, padding: '10px 14px', borderRadius: 999,
            background: 'var(--cream-100)', fontSize: 14, color: 'var(--ink-500)',
          }}>Ask Guthub anything…</div>
          <button style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--terracotta-400)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isAi = msg.from === 'ai';
  return (
    <div style={{
      alignSelf: isAi ? 'flex-start' : 'flex-end', maxWidth: '85%',
      display: 'flex', flexDirection: 'column', gap: 6,
      animation: 'bubbleIn 320ms var(--ease-out)',
    }}>
      {msg.pattern && (
        <div style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'var(--forest-500)', color: 'var(--cream-50)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          padding: '4px 9px', borderRadius: 999,
        }}>
          <Sparkles size={11} /> Pattern detected
        </div>
      )}
      <div style={{
        padding: '10px 14px',
        borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        background: isAi ? '#fff' : 'var(--terracotta-400)',
        color: isAi ? 'var(--ink-900)' : '#fff',
        fontSize: 14, lineHeight: 1.45,
        border: isAi ? '1px solid var(--border)' : 'none',
        boxShadow: isAi ? 'var(--shadow-xs)' : 'none',
      }}>{msg.node}</div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{
      alignSelf: 'flex-start', padding: '12px 16px',
      borderRadius: '16px 16px 16px 4px', background: '#fff',
      border: '1px solid var(--border)', display: 'flex', gap: 4,
      animation: 'bubbleIn 200ms var(--ease-out)',
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-400)',
          animation: `typing 1.2s ${i * 0.15}s infinite`, display: 'block',
        }} />
      ))}
    </div>
  );
}
