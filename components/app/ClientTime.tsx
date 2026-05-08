'use client'

export default function ClientTime({ iso }: { iso: string }) {
  return <>{new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
}
