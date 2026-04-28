'use client';

import { useState, FormEvent } from 'react';
import { Button } from './ui';

const topics = [
  'General question',
  'Product feedback',
  'Privacy/data request',
  'Press inquiry',
  'Billing question',
  'Other',
];

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: wire to Formspree, Resend, or your own API endpoint.
    // For now this is a UI-only stub: the message is not delivered anywhere.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: 32,
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--forest-50)', color: 'var(--forest-500)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 14,
        }}>✓</div>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
          color: 'var(--ink-900)', marginTop: 0, marginBottom: 8,
        }}>Thanks for reaching out.</h3>
        <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.55, margin: 0 }}>
          We&rsquo;ll get back to you within 1&ndash;2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', padding: 28,
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <Field label="Name">
        <input required value={name} onChange={e => setName(e.target.value)}
          autoComplete="name" placeholder="Alex Morgan" style={inputStyle} />
      </Field>
      <Field label="Email">
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email" placeholder="you@example.com" style={inputStyle} />
      </Field>
      <Field label="Topic">
        <select value={topic} onChange={e => setTopic(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Message">
        <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120, fontFamily: 'var(--font-body)' }} />
      </Field>
      <Button type="submit" variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
        Send message
      </Button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid var(--border)', background: '#fff',
  fontSize: 15, color: 'var(--ink-900)',
  fontFamily: 'var(--font-body)', lineHeight: 1.5,
  outline: 'none', boxShadow: 'none',
  transition: 'border-color 160ms var(--ease-out)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</span>
      {children}
    </label>
  );
}
