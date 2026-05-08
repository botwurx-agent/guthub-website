import { Suspense } from 'react'
import AppShell from '@/components/app/AppShell'
import InsightsClient from './InsightsClient'

export default function InsightsPage() {
  return (
    <AppShell>
      <Suspense>
        <InsightsClient />
      </Suspense>
    </AppShell>
  )
}
