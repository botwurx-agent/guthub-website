import { NextRequest, NextResponse } from 'next/server'

// Valid beta codes stored as comma-separated env var: BETA_CODES=GUTHUB-BETA,ANOTHER-CODE
// Falls back to hardcoded default if not set
function getValidCodes(): string[] {
  const env = process.env.BETA_CODES
  if (env) return env.split(',').map(c => c.trim().toUpperCase())
  return ['GUTHUB-BETA']
}

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'No code provided.' }, { status: 400 })

  const normalized = code.trim().toUpperCase()
  const valid = getValidCodes().includes(normalized)

  if (!valid) return NextResponse.json({ error: 'Invalid beta code.' }, { status: 400 })

  return NextResponse.json({ ok: true, trial_days: 14 })
}
