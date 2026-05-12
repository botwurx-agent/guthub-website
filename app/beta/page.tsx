import type { Metadata } from 'next'
import BetaClient from './BetaClient'

export const metadata: Metadata = {
  title: 'Beta Access — GutHub',
  description: 'Join the GutHub beta. Free access for early members.',
}

export default function BetaPage() {
  return <BetaClient />
}
