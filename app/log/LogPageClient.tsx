'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, Frown, Circle, Droplets, Scale, StickyNote } from 'lucide-react'
import LogMeal from '@/components/app/log/LogMeal'
import LogSymptom from '@/components/app/log/LogSymptom'
import LogBM from '@/components/app/log/LogBM'
import LogWater from '@/components/app/log/LogWater'
import LogWeight from '@/components/app/log/LogWeight'
import LogNote from '@/components/app/log/LogNote'

const TABS = [
  { id: 'meal',    label: 'Meal',    icon: Utensils,   color: '#DB6F56' },
  { id: 'symptom', label: 'Symptom', icon: Frown,      color: '#C98A1E' },
  { id: 'bm',      label: 'Bowel',   icon: Circle,     color: '#6F9477' },
  { id: 'water',   label: 'Water',   icon: Droplets,   color: '#6FB8A8' },
  { id: 'weight',  label: 'Weight',  icon: Scale,      color: '#9D978A' },
  { id: 'note',    label: 'Note',    icon: StickyNote, color: '#7A7468' },
]

type TabId = 'meal' | 'symptom' | 'bm' | 'water' | 'weight' | 'note'

export default function LogPageClient({ initialType, userId, today, currentLbs, goalLbs, waterGlasses }: {
  initialType: string
  userId: string
  today: string
  currentLbs: number | null
  goalLbs: number | null
  waterGlasses: number
}) {
  const router = useRouter()
  const [active, setActive] = useState<TabId>((TABS.find(t => t.id === initialType)?.id ?? 'meal') as TabId)

  const activeTab = TABS.find(t => t.id === active)!

  function handleSuccess() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ padding: '32px 32px 40px', maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400,
          color: 'var(--ink-900)', margin: '0 0 4px', letterSpacing: '-0.02em',
        }}>Log</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0 }}>
          Track what matters for your gut health.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        marginBottom: 28, padding: '4px',
        background: 'var(--cream-100)', borderRadius: 14,
        border: '1px solid var(--border)',
      }}>
        {TABS.map(({ id, label, icon: Icon, color }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => setActive(id as TabId)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? 'var(--ink-800)' : 'var(--ink-500)',
              fontSize: 13.5, fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: isActive ? '0 1px 4px rgba(31,45,42,0.1)' : 'none',
              transition: 'all 160ms',
            }}>
              <Icon size={15} color={isActive ? color : 'currentColor'} strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Form card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px 28px 32px',
        boxShadow: '0 2px 16px rgba(31,45,42,0.07)',
        border: '1px solid var(--ink-100)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${activeTab.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <activeTab.icon size={18} color={activeTab.color} strokeWidth={2} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400,
            color: 'var(--ink-900)', margin: 0, letterSpacing: '-0.01em',
          }}>
            {active === 'meal' && 'Log a meal'}
            {active === 'symptom' && 'Log a symptom'}
            {active === 'bm' && 'Log bowel movement'}
            {active === 'water' && 'Log water intake'}
            {active === 'weight' && 'Log weight'}
            {active === 'note' && 'Add a journal note'}
          </h2>
        </div>

        {active === 'meal'    && <LogMeal onSuccess={handleSuccess} />}
        {active === 'symptom' && <LogSymptom onSuccess={handleSuccess} />}
        {active === 'bm'      && <LogBM onSuccess={handleSuccess} />}
        {active === 'water'   && <LogWater userId={userId} today={today} currentGlasses={waterGlasses} onSuccess={handleSuccess} />}
        {active === 'weight'  && <LogWeight currentLbs={currentLbs} goalLbs={goalLbs} onSuccess={handleSuccess} />}
        {active === 'note'    && <LogNote onSuccess={handleSuccess} />}
      </div>
    </div>
  )
}
