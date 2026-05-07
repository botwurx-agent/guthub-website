// Gut score formula (from spec)
// Base 100, minus symptom load, minus BM irregularity

type SymptomLog = { severity: number }
type BmLog = { bristol_type: number; urgency?: number | null; pain?: number | null }

const BRISTOL_PENALTY: Record<number, number> = { 1: 15, 2: 10, 3: 5, 4: 0, 5: 5, 6: 10, 7: 15 }

export function computeGutScore(symptoms: SymptomLog[], bms: BmLog[]): {
  score: number; symptomPenalty: number; bmPenalty: number
} {
  // Symptom penalty: severity 1-3 → 1pt, 4-6 → 3pt, 7-8 → 5pt, 9-10 → 8pt per symptom
  const symptomPenalty = symptoms.reduce((sum, s) => {
    const pts = s.severity <= 3 ? 1 : s.severity <= 6 ? 3 : s.severity <= 8 ? 5 : 8
    return sum + pts
  }, 0)

  // BM penalty: Bristol deviation from type 4 (ideal)
  const bmPenalty = bms.reduce((sum, bm) => {
    const base = BRISTOL_PENALTY[bm.bristol_type] ?? 0
    const urgencyPts = bm.urgency ? Math.max(0, bm.urgency - 2) * 2 : 0
    const painPts = bm.pain ? Math.max(0, bm.pain - 2) * 2 : 0
    return sum + base + urgencyPts + painPts
  }, 0)

  const score = Math.max(0, Math.min(100, 100 - symptomPenalty - bmPenalty))
  return { score, symptomPenalty, bmPenalty }
}

export function gutScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Great', color: '#3F6A4A' }
  if (score >= 60) return { label: 'Good', color: '#7FB77E' }
  if (score >= 40) return { label: 'Fair', color: '#C98A1E' }
  return { label: 'Needs attention', color: '#B4422C' }
}
