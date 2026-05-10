import { headers } from 'next/headers'
import { cookies } from 'next/headers'

export async function getUserTimezone(): Promise<string> {
  // Prefer the cookie set by AppShell (browser's real timezone).
  // x-vercel-ip-timezone is only reliable on Edge runtime, not serverless.
  const cookieStore = await cookies()
  const tzCookie = cookieStore.get('tz')?.value
  if (tzCookie) return decodeURIComponent(tzCookie)

  const h = await headers()
  return h.get('x-vercel-ip-timezone') ?? 'UTC'
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
