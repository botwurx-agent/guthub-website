import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const password = formData.get('password') as string

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.redirect(new URL('/admin/login?error=noenv', request.url))
  }
  if (password !== adminPassword) {
    return NextResponse.redirect(new URL(`/admin/login?error=mismatch&al=${adminPassword.length}&pl=${password?.length ?? 0}`, request.url))
  }

  const response = NextResponse.redirect(new URL('/admin', request.url))
  response.cookies.set('admin_session', adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return response
}
