import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: macroTarget }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('macro_targets').select('protein_g, total_calories').eq('user_id', user.id).order('target_date', { ascending: false }).limit(1).single(),
  ])

  return (
    <SettingsClient
      profile={profile}
      macroTarget={macroTarget}
      email={user.email ?? ''}
    />
  )
}
