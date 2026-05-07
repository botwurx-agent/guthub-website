import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app/AppShell'
import HelpClient from './HelpClient'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <AppShell>
      <HelpClient
        userName={profile?.name ?? null}
        userEmail={user.email ?? ''}
      />
    </AppShell>
  )
}
