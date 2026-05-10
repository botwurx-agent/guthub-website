'use client'

import { createBrowserClient } from '@supabase/ssr'

const cookieDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('.guthub.ai')
  ? '.guthub.ai'
  : undefined

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { domain: cookieDomain } }
  )
}
