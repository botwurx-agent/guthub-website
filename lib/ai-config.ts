export const AI_MODEL = 'gpt-5-mini-2025-08-07'
export const AI_MODEL_VISION = 'gpt-5-mini-2025-08-07'

export const TEMP = {
  calculation: 0.1,   // macros, goal weight — near-deterministic
  meals: 0.2,         // meal planning — strict JSON/diet compliance
  vision: 0.3,        // photo macro extraction
  analysis: 0.7,      // goal tracker, insights
  reports: 0.8,       // lab report analysis
  chat: 0.7,          // coach conversation
} as const
