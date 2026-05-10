import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const WWW_DOMAIN = 'www.guthub.ai'
const APP_DOMAIN = 'app.guthub.ai'

const MARKETING_PATHS = ['/', '/features', '/pricing', '/about', '/auth/callback']
const APP_PATHS = ['/dashboard', '/log', '/coach', '/insights', '/meal-planner', '/settings', '/eat-out', '/doctor-report', '/onboarding', '/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain: process.env.NODE_ENV === 'production' ? '.guthub.ai' : undefined },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get('host') ?? ''

  // ── Domain-based routing ──────────────────────────────────────────────────

  if (hostname === WWW_DOMAIN) {
    // www: only marketing pages — redirect app paths to app.guthub.ai
    const isAppPath = APP_PATHS.some(p => pathname.startsWith(p))
    if (isAppPath) {
      return NextResponse.redirect(`https://${APP_DOMAIN}${pathname}${request.nextUrl.search}`)
    }
  }

  if (hostname === APP_DOMAIN) {
    // app: only app pages — redirect marketing paths to www.guthub.ai
    const isMarketingOnly = MARKETING_PATHS.some(p => pathname === p) &&
      !APP_PATHS.some(p => pathname.startsWith(p))
    if (isMarketingOnly && pathname !== '/auth/callback') {
      // Root of app domain → send to dashboard if logged in, sign-in modal if not
      if (pathname === '/') {
        const dest = user ? `https://${APP_DOMAIN}/dashboard` : `https://${WWW_DOMAIN}/?auth=signin`
        return NextResponse.redirect(dest)
      }
      return NextResponse.redirect(`https://${WWW_DOMAIN}${pathname}${request.nextUrl.search}`)
    }

    // Unauthenticated users hitting app on app domain → www for sign in
    const isProtectedPath = APP_PATHS.filter(p => p !== '/admin').some(p => pathname.startsWith(p))
    if (isProtectedPath && !user) {
      return NextResponse.redirect(`https://${WWW_DOMAIN}/?auth=signin`)
    }
  }

  // ── Admin protection ──────────────────────────────────────────────────────

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return supabaseResponse
    const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()
    const sessionCookie = request.cookies.get('admin_session')?.value
    if (!adminPassword || sessionCookie !== adminPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return supabaseResponse
  }

  // ── App auth + subscription gates ────────────────────────────────────────

  const protectedPaths = ['/dashboard', '/log', '/coach', '/insights', '/meal-planner', '/settings', '/eat-out', '/doctor-report']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // 1. Not logged in → sign in
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'signin')
    return NextResponse.redirect(url)
  }

  // 2. Logged in but no active subscription → pricing (except settings)
  if (isProtected && user && !pathname.startsWith('/settings')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, onboarding_completed')
      .eq('id', user.id)
      .single()

    const status = profile?.subscription_status
    const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const trialActive = trialEnds ? trialEnds > new Date() : false
    const hasAccess = status === 'active' || status === 'trialing' || trialActive

    if (!hasAccess) {
      const target = hostname === APP_DOMAIN
        ? `https://${WWW_DOMAIN}/pricing?reason=subscription_required`
        : `/pricing?reason=subscription_required`
      return NextResponse.redirect(target)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
