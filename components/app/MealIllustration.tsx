export function MealIllustration({ meal, size = 36 }: { meal: string; size?: number }) {
  const s = size
  if (meal === 'breakfast') return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="13" r="6" fill="rgba(255,255,255,0.9)"/>
      <line x1="24" y1="3" x2="24" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="20" x2="24" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="13" x2="11" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="34" y1="13" x2="37" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17.07" y1="6.07" x2="15.66" y2="4.66" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30.93" y1="6.07" x2="32.34" y2="4.66" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17.07" y1="19.93" x2="15.66" y2="21.34" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30.93" y1="19.93" x2="32.34" y2="21.34" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 28 Q8 42 24 42 Q40 42 40 28 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="7" y1="28" x2="41" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="33" r="2.2" fill="rgba(255,255,255,0.85)"/>
      <circle cx="24" cy="31" r="2.2" fill="rgba(255,255,255,0.85)"/>
      <circle cx="30" cy="33" r="2.2" fill="rgba(255,255,255,0.85)"/>
      <path d="M16 25 Q17 22 16 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M24 25 Q25 22 24 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M32 25 Q33 22 32 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
  if (meal === 'lunch') return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="26" r="16" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.8"/>
      <circle cx="24" cy="26" r="11.5" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" strokeDasharray="2 2"/>
      <path d="M16 28 Q18 22 24 24 Q30 22 32 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="rgba(255,255,255,0.25)"/>
      <path d="M18 30 Q20 24 24 26 Q28 24 30 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <circle cx="20" cy="29" r="2.5" fill="rgba(255,255,255,0.8)"/>
      <circle cx="28" cy="30" r="2.5" fill="rgba(255,255,255,0.8)"/>
      <circle cx="24" cy="32" r="2" fill="rgba(255,255,255,0.6)"/>
      <line x1="8" y1="16" x2="8" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="5" y1="16" x2="5" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="8" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11" y1="16" x2="11" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 22 Q8 25 11 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="40" y1="16" x2="40" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 16 Q43 20 40 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="rgba(255,255,255,0.3)"/>
    </svg>
  )
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="36" rx="16" ry="5" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.8"/>
      <ellipse cx="24" cy="36" rx="11" ry="3.2" stroke="white" strokeWidth="1.2" fill="rgba(255,255,255,0.1)"/>
      <path d="M8 36 Q8 16 24 14 Q40 16 40 36" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="21" y="10" width="6" height="5" rx="3" fill="rgba(255,255,255,0.8)" stroke="white" strokeWidth="1.2"/>
      <line x1="8" y1="36" x2="40" y2="36" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <line x1="5" y1="28" x2="5" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="28" x2="3" y2="33" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5" y1="28" x2="5" y2="33" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="28" x2="7" y2="33" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 33 Q5 36 7 33" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="43" y1="28" x2="43" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M43 28 Q46 32 43 36" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="rgba(255,255,255,0.25)"/>
      <circle cx="14" cy="20" r="1" fill="white" opacity="0.6"/>
      <circle cx="34" cy="18" r="1" fill="white" opacity="0.5"/>
      <circle cx="38" cy="26" r="0.8" fill="white" opacity="0.4"/>
    </svg>
  )
}
