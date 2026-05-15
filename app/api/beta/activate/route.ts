import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, name, userId: clientUserId } = body

  if (!code) return NextResponse.json({ error: 'No code provided.' }, { status: 400 })

  // Resolve user — three methods in priority order:
  // 1. Cookie session (normal sign-in flow)
  // 2. Bearer token in Authorization header (fresh signup, session returned)
  // 3. userId from request body verified via service role (fresh signup, email confirmation on → session is null)
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  let userId = cookieUser?.id ?? null

  if (!userId) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7))
      userId = tokenUser?.id ?? null
    }
  }

  // Fallback: trust userId from body, verify it exists via service role
  if (!userId && clientUserId) {
    const service = await createServiceClient()
    const { data: { user: serviceUser } } = await service.auth.admin.getUserById(clientUserId)
    if (serviceUser) userId = serviceUser.id
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data, error } = await service.rpc('activate_beta_code', {
    p_user_id: userId,
    p_code: code,
    p_name: name ?? null,
  })

  if (error) {
    console.error('[beta/activate] RPC error:', error)
    return NextResponse.json({ error: 'Activation failed. Please try again.' }, { status: 500 })
  }
  if (!data.ok) return NextResponse.json({ error: data.error }, { status: 400 })

  return NextResponse.json({ ok: true })
}
