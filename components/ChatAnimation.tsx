'use client';

import { useState, useEffect, CSSProperties } from 'react';
import Image from 'next/image';
import { Signal, Wifi, BatteryFull, MoreHorizontal } from 'lucide-react';

const script = [
  { from: 'user', text: 'Why did dinner leave me bloated tonight?', delay: 100 },
  { from: 'ai', text: "Looking at your log — you had broccoli, beans, and a cold brew within 3 hours. That combo is a known trigger for you.", delay: 1200 },
  { from: 'ai', text: 'Try spacing high-FODMAP foods out, and skip coffee after 3pm for a week. Want me to set a reminder?', delay: 1600 },
  { from: 'user', text: 'Yes please.', delay: 800 },
  { from: 'ai', text: "✓ Reminder set. I'll check in tomorrow.", delay: 1200 },
];

export default function ChatAnimation() {
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(r => {
      const t = setTimeout(r, ms);
      timers.push(t);
    });

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
  }, []);

  return (
    <div className="chat-phone" style={{
      width: '100%', maxWidth: 440, aspectRatio: '3/4.3',
      borderRadius: 44, padding: '16px 16px 28px',
      background: '#1a1a1c', border: '2px solid #2e2e30',
      boxShadow: '0 40px 80px -20px rgba(30,40,35,0.45), 0 18px 40px -12px rgba(30,40,35,0.25)',
      position: 'relative',
      minHeight: 0, overflow: 'hidden',
    }}>
      {/* camera dot */}
      <div style={{
        position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: '50%', background: '#0a0a0a',
        border: '1px solid #3a3a3d',
      }} />
      {/* screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 28,
        overflow: 'hidden', background: '#fff', border: '1px solid #000',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* iOS status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 22px 6px', fontSize: 13, fontWeight: 600,
          color: 'var(--ink-900)', background: 'var(--cream-50)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', flexShrink: 0,
        }}>
          <span>9:41</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Signal size={14} /><Wifi size={14} /><BatteryFull size={18} />
          </span>
        </div>
        {/* chat area */}
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
            padding: '20px 18px', flex: 1,
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'var(--cream-50)', overflow: 'hidden',
          }}>
            {script.slice(0, visible).map((m, i) => <Bubble key={i} from={m.from as 'user' | 'ai'} text={m.text} />)}
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
      </div>
    </div>
  );
}

function Bubble({ from, text }: { from: 'user' | 'ai'; text: string }) {
  const isAi = from === 'ai';
  return (
    <div style={{
      alignSelf: isAi ? 'flex-start' : 'flex-end', maxWidth: '82%',
      padding: '10px 14px',
      borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
      background: isAi ? '#fff' : 'var(--terracotta-400)',
      color: isAi ? 'var(--ink-900)' : '#fff',
      fontSize: 14, lineHeight: 1.45,
      border: isAi ? '1px solid var(--border)' : 'none',
      boxShadow: isAi ? 'var(--shadow-xs)' : 'none',
      animation: 'bubbleIn 320ms var(--ease-out)',
    }}>{text}</div>
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
          animation: `typing 1.2s ${i * 0.15}s infinite`,
          display: 'block',
        }} />
      ))}
    </div>
  );
}
