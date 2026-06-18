'use client';

import { ReactNode } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

// Shared dark phone shell used by the hero product animations so the chat
// and insights variants render identically apart from their screen content.
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="chat-phone" style={{
      width: '100%', maxWidth: 440, aspectRatio: '3/4.3',
      borderRadius: 44, padding: 16,
      background: '#1a1a1c', border: '2px solid #2e2e30',
      boxShadow: '0 40px 80px -20px rgba(30,40,35,0.45), 0 18px 40px -12px rgba(30,40,35,0.25)',
      position: 'relative', minHeight: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: '50%', background: '#0a0a0a',
        border: '1px solid #3a3a3d',
      }} />
      <div style={{
        flex: 1, minHeight: 0, width: '100%', borderRadius: 28,
        overflow: 'hidden', background: '#fff', border: '1px solid #000',
        display: 'flex', flexDirection: 'column',
      }}>
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
        {children}
      </div>
    </div>
  );
}
