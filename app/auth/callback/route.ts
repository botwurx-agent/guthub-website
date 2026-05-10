import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        const destination = profile?.onboarding_completed ? next : '/onboarding'
        const appBase = process.env.NODE_ENV === 'production' ? 'https://app.guthub.ai' : origin
        return NextResponse.redirect(`${appBase}${destination}`)
      }
    }
  }

  const wwwBase = process.env.NODE_ENV === 'production' ? 'https://www.guthub.ai' : origin
  return NextResponse.redirect(`${wwwBase}/?auth=signin&error=auth_failed`)
}
