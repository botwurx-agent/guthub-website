import { Suspense } from 'react'
import AppShell from '@/components/app/AppShell'
import EatOutClient from './EatOutClient'
import { createClient } from '@/lib/supabase/server'

export default async function EatOutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: correlations }] = await Promise.all([
    supabase.from('profiles').select('health_profile').eq('id', user?.id ?? '').single(),
    supabase.from('correlations')
      .select('food_item, symptom_type, correlation_score')
      .eq('user_id', user?.id ?? '')
      .gte('correlation_score', 0.3)
      .order('correlation_score', { ascending: false })
      .limit(5),
  ])

  const hp = (profile?.health_profile as Record<string, unknown>) ?? {}
  const allergens = Array.isArray(hp.allergens)
    ? (hp.allergens as string[])
    : hp.allergens ? [hp.allergens as string] : []

  return (
    <AppShell>
      <Suspense>
        <EatOutClient
          topTriggers={(correlations ?? []).map(c => ({
            food: c.food_item,
            symptom: c.symptom_type,
            score: Math.round(c.correlation_score * 100),
          }))}
          allergens={allergens}
        />
      </Suspense>
    </AppShell>
  )
}
