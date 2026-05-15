import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  let user = cookieUser

  // Fallback: read Bearer token from Authorization header (needed immediately after signUp before cookies propagate)
  if (!user) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7))
      user = tokenUser
    }
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, name } = await req.json()
  if (!code) return NextResponse.json({ error: 'No code provided.' }, { status: 400 })

  const { data, error } = await supabase.rpc('activate_beta_code', {
    p_user_id: user.id,
    p_code: code,
    p_name: name ?? null,
  })

  if (error) return NextResponse.json({ error: 'Activation failed. Please try again.' }, { status: 500 })
  if (!data.ok) return NextResponse.json({ error: data.error }, { status: 400 })

  return NextResponse.json({ ok: true })
}
