import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  const protectedPaths = ['/dashboard', '/log', '/coach', '/insights', '/meal-planner', '/settings']
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
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      url.searchParams.set('reason', 'subscription_required')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
