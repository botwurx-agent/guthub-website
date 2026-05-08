import { headers } from 'next/headers'

export async function getUserTimezone(): Promise<string> {
  const h = await headers()
  return h.get('x-vercel-ip-timezone') ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
}

export function todayInTz(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

export function daysAgoInTz(tz: string, days: number): string {
  return new Date(Date.now() - days * 86400000).toLocaleDateString('en-CA', { timeZone: tz })
}

export function formatTimeInTz(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' })
}
