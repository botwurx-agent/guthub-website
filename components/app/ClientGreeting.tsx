'use client'

export default function ClientGreeting({ firstName }: { firstName: string }) {
  const h = new Date().getHours()
  const tod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return (
    <span suppressHydrationWarning>
      Good {tod},{' '}
      <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>{firstName}</em>.
    </span>
  )
}
