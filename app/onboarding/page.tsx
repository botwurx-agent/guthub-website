'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Check, Loader2, Lock } from 'lucide-react'
import { saveProfileStep, completeOnboarding } from '@/app/actions/onboarding'
import { createClient } from '@/lib/supabase/client'

const TOTAL_STEPS = 6

type StepDef = {
  sidebarLabel: string
  eyebrow: string
  titleStart: string
  titleEm: string
  titleEnd: string
  subtitle: string
}

const STEPS: StepDef[] = [
  {
    sidebarLabel: 'About you',
    eyebrow: '01 — ABOUT YOU',
    titleStart: "Let's start with the ",
    titleEm: 'basics',
    titleEnd: '.',
    subtitle: 'A couple quick details so we can call you the right thing.',
  },
  {
    sidebarLabel: 'Health & history',
    eyebrow: '02 — HEALTH & HISTORY',
    titleStart: 'Your ',
    titleEm: 'health context',
    titleEnd: '.',
    subtitle: 'This stays private. We use it to make every suggestion safe and relevant.',
  },
  {
    sidebarLabel: 'How you eat',
    eyebrow: '03 — HOW YOU EAT',
    titleStart: 'What does a ',
    titleEm: 'typical day',
    titleEnd: ' look like?',
    subtitle: "No judgement. Just what's actually on your plate.",
  },
  {
    sidebarLabel: 'Goals',
    eyebrow: '04 — GOALS',
    titleStart: 'What do you want to ',
    titleEm: 'change',
    titleEnd: '?',
    subtitle: "Three things, max. We'll help you focus.",
  },
  {
    sidebarLabel: 'Lifestyle',
    eyebrow: '05 — LIFESTYLE',
    titleStart: 'Sleep, energy, and ',
    titleEm: 'stress',
    titleEnd: '.',
    subtitle: 'Your gut listens to all of these.',
  },
  {
    sidebarLabel: 'Final touches',
    eyebrow: '06 — FINAL TOUCHES',
    titleStart: 'One last ',
    titleEm: 'note',
    titleEnd: ' before we begin.',
    subtitle: 'Anything else that would help your coach understand you?',
  },
]

const CONDITION_OPTIONS = [
  'IBS', "IBD / Crohn's", 'Acid reflux / GERD', 'Diabetes',
  'High blood pressure', 'Thyroid condition', 'Autoimmune condition',
  'Celiac disease', 'SIBO', 'Gastroparesis', 'None of these',
]

const ALLERGEN_OPTIONS = [
  'Dairy', 'Gluten', 'Eggs', 'Soy', 'Tree nuts', 'Peanuts', 'Shellfish', 'Fish', 'Nightshades', 'Corn',
]

const EATING_STYLE_OPTIONS = [
  { value: 'default', label: 'No restrictions' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'low_fodmap', label: 'Low-FODMAP' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'high_protein_low_carb', label: 'High Protein / Low Carb' },
  { value: 'intermittent_fasting', label: 'Intermittent Fasting' },
  { value: 'wfpb', label: 'Whole Food Plant-Based' },
]

const COOKING_OPTIONS = ['Almost every meal', 'Most meals', 'About half', 'A few times a week', 'Rarely']
const EAT_OUT_OPTIONS = ['Rarely', '1–2 times a week', '3–4 times a week', '5+ times a week', 'Most meals']

const GOAL_OPTIONS = [
  { value: 'reduce_bloating', label: 'Reduce bloating' },
  { value: 'better_digestion', label: 'Better digestion' },
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'steady_energy', label: 'More steady energy' },
  { value: 'better_sleep', label: 'Better sleep' },
  { value: 'identify_triggers', label: 'Identify trigger foods' },
  { value: 'build_habits', label: 'Build healthy habits' },
  { value: 'reduce_reflux', label: 'Reduce reflux' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Physical job or hard daily training' },
]

const PRIOR_RD_OPTIONS = ['Yes, currently', 'Yes, in the past', 'No']
const SLEEP_OPTIONS = ['Great', 'Pretty good', 'So-so', 'Poorly']
const ENERGY_OPTIONS = ['High & steady', 'Steady but low', 'Up and down', 'Low most of the day']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [firstName, setFirstName] = useState('')

  // Step 1
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')

  // Step 2
  const [weightLbs, setWeightLbs] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [medications, setMedications] = useState('')

  // Step 3
  const [eatingStyle, setEatingStyle] = useState('default')
  const [cookingFreq, setCookingFreq] = useState('')
  const [eatOutFreq, setEatOutFreq] = useState('')
  const [typicalDay, setTypicalDay] = useState('')

  // Step 4
  const [goals, setGoals] = useState<string[]>([])
  const [specificConcerns, setSpecificConcerns] = useState('')
  const [priorRd, setPriorRd] = useState('')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [targetWeightLbs, setTargetWeightLbs] = useState('')

  // Step 5
  const [sleepQuality, setSleepQuality] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [energyLevel, setEnergyLevel] = useState('')
  const [stressLevel, setStressLevel] = useState(3)
  const [additionalNotes, setAdditionalNotes] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = user?.user_metadata ?? {}
      const name = meta.name ?? meta.full_name ?? ''
      if (name) {
        setFullName(name)
        setFirstName(name.split(' ')[0])
      }
    })
  }, [])

  useEffect(() => {
    if (fullName) setFirstName(fullName.split(' ')[0])
  }, [fullName])

  function lbsToKg(lbs: number) { return lbs / 2.20462 }
  function feetInToCm(ft: number, inches: number) { return (ft * 12 + inches) * 2.54 }

  async function handleNext() {
    setError(null)

    if (step === 0) {
      if (!fullName.trim()) return setError('Please enter your name.')
      if (!dob) return setError('Please enter your date of birth.')
      if (!gender) return setError('Please select your gender.')
      startTransition(async () => {
        const res = await saveProfileStep(1, {
          name: fullName, dob, gender,
          health_profile: { nickname: nickname || null },
        })
        if (res?.error) setError(res.error)
        else setStep(1)
      })

    } else if (step === 1) {
      const wt = parseFloat(weightLbs)
      const ft = parseInt(heightFt)
      const inches = parseInt(heightIn || '0')
      if (!wt || wt < 50 || wt > 700) return setError('Please enter a valid weight in lbs.')
      if (!ft || ft < 3 || ft > 8) return setError('Please enter a valid height.')
      startTransition(async () => {
        const res = await saveProfileStep(2, {
          weight_kg: lbsToKg(wt),
          height_cm: feetInToCm(ft, inches),
          health_profile: {
            nickname: nickname || null,
            medical_conditions: conditions.join(', ') || null,
            allergens: allergens.join(', ') || null,
            medications: medications || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(2)
      })

    } else if (step === 2) {
      startTransition(async () => {
        const res = await saveProfileStep(3, {
          diet_mode: eatingStyle,
          health_profile: {
            eating_style: eatingStyle,
            cooking_frequency: cookingFreq || null,
            eating_out_frequency: eatOutFreq || null,
            typical_day_meals: typicalDay || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(3)
      })

    } else if (step === 3) {
      startTransition(async () => {
        const res = await saveProfileStep(4, {
          health_profile: {
            primary_goals: goals,
            specific_concerns: specificConcerns || null,
            has_worked_with_rd: priorRd || null,
            activity_level: activityLevel,
            target_weight_lbs: targetWeightLbs || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(4)
      })

    } else if (step === 4) {
      startTransition(async () => {
        const res = await saveProfileStep(5, {
          health_profile: {
            sleep_quality: sleepQuality || null,
            sleep_hours: sleepHours || null,
            energy_level: energyLevel || null,
            stress_level: stressLevel,
            additional_notes: additionalNotes || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(5)
      })

    } else if (step === 5) {
      startTransition(async () => {
        const res = await completeOnboarding()
        if (res?.error) setError(res.error)
      })
    }
  }

  const currentStep = STEPS[step]

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--cream-50)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="onb-sidebar" style={{
        width: 380, flexShrink: 0,
        background: 'var(--forest-500)',
        padding: '40px 36px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: 40 }}>
          <Image src="/logo-dark.png" alt="GutHub" width={120} height={30} style={{ height: 30, width: 'auto' }} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400,
          color: 'var(--cream-100)', margin: '0 0 12px', lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          Welcome{firstName && <>, <em style={{ fontStyle: 'italic', color: '#e8c870' }}>{firstName}</em></>}.
        </h2>
        <p style={{
          fontSize: 14.5, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.55, margin: '0 0 36px', maxWidth: 280,
        }}>
          About 6 minutes. The more your coach knows now, the better it can help later.
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {STEPS.map((s, i) => {
            const isActive = i === step
            const isComplete = i < step
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 12,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'background 200ms',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'var(--terracotta-400)' : isComplete ? 'rgba(232,200,112,0.15)' : 'transparent',
                  border: isActive ? 'none' : `1.5px solid ${isComplete ? '#e8c870' : 'rgba(255,255,255,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: isActive ? '#fff' : isComplete ? '#e8c870' : 'rgba(255,255,255,0.5)',
                }}>
                  {isComplete ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 14.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : isComplete ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
                }}>
                  {s.sidebarLabel}
                </span>
              </div>
            )
          })}
        </nav>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          fontSize: 12, color: 'rgba(255,255,255,0.45)',
          marginTop: 24, lineHeight: 1.5,
        }}>
          <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Your information is encrypted and never shared with third parties.</span>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main className="onb-main" style={{
        flex: 1, padding: '64px 80px',
        display: 'flex', flexDirection: 'column',
        maxWidth: 760, width: '100%',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
          color: 'var(--terracotta-500)', textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          {currentStep.eyebrow}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--ink-900)',
          margin: '0 0 14px', lineHeight: 1.15,
        }}>
          {currentStep.titleStart}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>{currentStep.titleEm}</em>
          {currentStep.titleEnd}
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--ink-500)', lineHeight: 1.55,
          margin: '0 0 36px', maxWidth: 540,
        }}>
          {currentStep.subtitle}
        </p>

        <div style={{ flex: 1 }}>
          {step === 0 && <StepAboutYou {...{ fullName, setFullName, nickname, setNickname, dob, setDob, gender, setGender }} />}
          {step === 1 && <StepHealth {...{ weightLbs, setWeightLbs, heightFt, setHeightFt, heightIn, setHeightIn, conditions, setConditions, allergens, setAllergens, medications, setMedications }} />}
          {step === 2 && <StepEating {...{ eatingStyle, setEatingStyle, cookingFreq, setCookingFreq, eatOutFreq, setEatOutFreq, typicalDay, setTypicalDay }} />}
          {step === 3 && <StepGoals {...{ goals, setGoals, specificConcerns, setSpecificConcerns, priorRd, setPriorRd, activityLevel, setActivityLevel, targetWeightLbs, setTargetWeightLbs }} />}
          {step === 4 && <StepLifestyle {...{ sleepQuality, setSleepQuality, sleepHours, setSleepHours, energyLevel, setEnergyLevel, stressLevel, setStressLevel, additionalNotes, setAdditionalNotes }} />}
          {step === 5 && <StepFinish isPending={isPending} />}
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
            borderRadius: 10, fontSize: 13.5, color: 'var(--terracotta-600)',
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--cream-200)',
        }}>
          <button
            onClick={() => { setStep(s => Math.max(0, s - 1)); setError(null) }}
            disabled={step === 0 || isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 999,
              border: '1px solid var(--cream-200)', background: 'transparent',
              fontSize: 14, fontWeight: 500, color: 'var(--ink-600)',
              cursor: step === 0 ? 'default' : 'pointer',
              opacity: step === 0 ? 0 : 1,
              fontFamily: 'var(--font-body)',
              transition: 'opacity 200ms',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <button
              onClick={handleNext}
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 999,
                border: 'none', background: 'var(--terracotta-400)',
                fontSize: 15, fontWeight: 600, color: '#fff',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                fontFamily: 'var(--font-body)',
                transition: 'background 200ms',
              }}
            >
              {isPending ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              ) : step === 5 ? (
                <>Build my plan <ChevronRight size={16} /></>
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .onb-sidebar { position: relative !important; width: 100% !important; height: auto !important; padding: 24px !important; }
          .onb-main { padding: 32px 24px !important; }
          div:has(> .onb-sidebar) { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Step 1: About you ────────────────────────────────────────────────────
function StepAboutYou({ fullName, setFullName, nickname, setNickname, dob, setDob, gender, setGender }: {
  fullName: string; setFullName: (v: string) => void
  nickname: string; setNickname: (v: string) => void
  dob: string; setDob: (v: string) => void
  gender: string; setGender: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 540 }}>
      <OField label="Full name" required>
        <OInput value={fullName} onChange={setFullName} placeholder="Alex Morgan" type="text" autoComplete="name" />
      </OField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OField label="Date of birth" required>
          <OInput value={dob} onChange={setDob} placeholder="" type="date" autoComplete="bday" />
        </OField>
        <OField label="Gender" required>
          <OSelect value={gender} onChange={setGender} options={[
            { value: '', label: 'Select…' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non_binary', label: 'Non-binary' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]} />
        </OField>
      </div>
      <OField label="What should we call you?" hint="If different from your full name.">
        <OInput value={nickname} onChange={setNickname} placeholder="Alex" type="text" autoComplete="nickname" />
      </OField>
    </div>
  )
}

// ─── Step 2: Health & history ─────────────────────────────────────────────
function StepHealth({ weightLbs, setWeightLbs, heightFt, setHeightFt, heightIn, setHeightIn, conditions, setConditions, allergens, setAllergens, medications, setMedications }: {
  weightLbs: string; setWeightLbs: (v: string) => void
  heightFt: string; setHeightFt: (v: string) => void
  heightIn: string; setHeightIn: (v: string) => void
  conditions: string[]; setConditions: (v: string[]) => void
  allergens: string[]; setAllergens: (v: string[]) => void
  medications: string; setMedications: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 580 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OField label="Current weight (lbs)" required>
          <OInput value={weightLbs} onChange={setWeightLbs} placeholder="165" type="number" />
        </OField>
        <OField label="Height" required>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <OInput value={heightFt} onChange={setHeightFt} placeholder="5" type="number" />
              <span style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3, display: 'block' }}>feet</span>
            </div>
            <div style={{ flex: 1 }}>
              <OInput value={heightIn} onChange={setHeightIn} placeholder="8" type="number" />
              <span style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3, display: 'block' }}>inches</span>
            </div>
          </div>
        </OField>
      </div>

      <OField label="Medical conditions" hint="Pick any that apply. You can add more later.">
        <ChipGroup options={CONDITION_OPTIONS} value={conditions} onChange={setConditions} />
      </OField>

      <OField label="Food allergies & sensitivities">
        <ChipGroup options={ALLERGEN_OPTIONS} value={allergens} onChange={setAllergens} />
      </OField>

      <OField label="Current medications & supplements" hint="Optional. Names and rough dose are enough.">
        <OTextarea value={medications} onChange={setMedications}
          placeholder="e.g., Omeprazole 20mg morning, Vitamin D 2000 IU, magnesium glycinate at night" />
      </OField>
    </div>
  )
}

// ─── Step 3: How you eat ──────────────────────────────────────────────────
function StepEating({ eatingStyle, setEatingStyle, cookingFreq, setCookingFreq, eatOutFreq, setEatOutFreq, typicalDay, setTypicalDay }: {
  eatingStyle: string; setEatingStyle: (v: string) => void
  cookingFreq: string; setCookingFreq: (v: string) => void
  eatOutFreq: string; setEatOutFreq: (v: string) => void
  typicalDay: string; setTypicalDay: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 580 }}>
      <OField label="Eating style">
        <ChipGroup
          options={EATING_STYLE_OPTIONS.map(o => o.label)}
          value={eatingStyle ? [EATING_STYLE_OPTIONS.find(o => o.value === eatingStyle)?.label ?? eatingStyle] : []}
          onChange={v => {
            const last = v[v.length - 1]
            const match = EATING_STYLE_OPTIONS.find(o => o.label === last)
            setEatingStyle(match ? match.value : last ?? 'default')
          }}
          multi={false}
        />
      </OField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OField label="How often do you cook?">
          <OSelect value={cookingFreq} onChange={setCookingFreq}
            options={[{ value: '', label: 'Select…' }, ...COOKING_OPTIONS.map(o => ({ value: o, label: o }))]} />
        </OField>
        <OField label="How often do you eat out?">
          <OSelect value={eatOutFreq} onChange={setEatOutFreq}
            options={[{ value: '', label: 'Select…' }, ...EAT_OUT_OPTIONS.map(o => ({ value: o, label: o }))]} />
        </OField>
      </div>

      <OField label="A typical day of meals" hint="Just a rough sketch — breakfast, lunch, dinner, snacks.">
        <OTextarea value={typicalDay} onChange={setTypicalDay}
          placeholder="e.g., Coffee + toast, salad with chicken at lunch, pasta or fish for dinner" />
      </OField>
    </div>
  )
}

// ─── Step 4: Goals ────────────────────────────────────────────────────────
function StepGoals({ goals, setGoals, specificConcerns, setSpecificConcerns, priorRd, setPriorRd, activityLevel, setActivityLevel, targetWeightLbs, setTargetWeightLbs }: {
  goals: string[]; setGoals: (v: string[]) => void
  specificConcerns: string; setSpecificConcerns: (v: string) => void
  priorRd: string; setPriorRd: (v: string) => void
  activityLevel: string; setActivityLevel: (v: string) => void
  targetWeightLbs: string; setTargetWeightLbs: (v: string) => void
}) {
  const showTargetWeight = goals.includes('weight_loss')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 580 }}>
      <OField label="What do you want to work on?" hint="Pick up to 3.">
        <ChipGroup
          options={GOAL_OPTIONS.map(g => g.label)}
          value={goals.map(v => GOAL_OPTIONS.find(g => g.value === v)?.label ?? v)}
          onChange={labels => {
            const values = labels.map(l => GOAL_OPTIONS.find(g => g.label === l)?.value ?? l)
            if (values.length <= 3) setGoals(values)
          }}
        />
      </OField>

      {showTargetWeight && (
        <OField label="Target weight (lbs)" hint="Optional.">
          <OInput value={targetWeightLbs} onChange={setTargetWeightLbs} placeholder="150" type="number" />
        </OField>
      )}

      <OField label="Activity level">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ACTIVITY_OPTIONS.map(a => (
            <button
              key={a.value}
              type="button"
              onClick={() => setActivityLevel(a.value)}
              style={{
                padding: '10px 18px', borderRadius: 999, cursor: 'pointer',
                border: `1.5px solid ${activityLevel === a.value ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
                background: activityLevel === a.value ? 'var(--terracotta-50)' : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontFamily: 'var(--font-body)', transition: 'all 160ms',
              }}
            >
              <span style={{
                fontSize: 13.5, fontWeight: activityLevel === a.value ? 600 : 500,
                color: activityLevel === a.value ? 'var(--terracotta-600)' : 'var(--ink-700)',
              }}>{a.label}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{a.desc}</span>
            </button>
          ))}
        </div>
      </OField>

      <OField label="Anything specific you'd like addressed?" hint="Optional.">
        <OTextarea value={specificConcerns} onChange={setSpecificConcerns}
          placeholder="e.g., I bloat after most meals and want to figure out which foods are causing it." />
      </OField>

      <OField label="Have you worked with a nutritionist or RD before?">
        <ChipGroup options={PRIOR_RD_OPTIONS} value={priorRd ? [priorRd] : []} onChange={v => setPriorRd(v[v.length - 1] ?? '')} multi={false} />
      </OField>
    </div>
  )
}

// ─── Step 5: Lifestyle ────────────────────────────────────────────────────
function StepLifestyle({ sleepQuality, setSleepQuality, sleepHours, setSleepHours, energyLevel, setEnergyLevel, stressLevel, setStressLevel, additionalNotes, setAdditionalNotes }: {
  sleepQuality: string; setSleepQuality: (v: string) => void
  sleepHours: string; setSleepHours: (v: string) => void
  energyLevel: string; setEnergyLevel: (v: string) => void
  stressLevel: number; setStressLevel: (v: number) => void
  additionalNotes: string; setAdditionalNotes: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 580 }}>
      <OField label="How well do you sleep?">
        <ChipGroup options={SLEEP_OPTIONS} value={sleepQuality ? [sleepQuality] : []} onChange={v => setSleepQuality(v[v.length - 1] ?? '')} multi={false} />
      </OField>

      {sleepQuality === 'Poorly' && (
        <OField label="Average sleep (hrs/night)">
          <OInput value={sleepHours} onChange={setSleepHours} placeholder="5" type="number" />
        </OField>
      )}

      <OField label="Average daily energy">
        <ChipGroup options={ENERGY_OPTIONS} value={energyLevel ? [energyLevel] : []} onChange={v => setEnergyLevel(v[v.length - 1] ?? '')} multi={false} />
      </OField>

      <OField label="Stress level (typical week)">
        <div style={{ paddingTop: 4 }}>
          <input
            type="range" min={1} max={10} value={stressLevel}
            onChange={e => setStressLevel(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--terracotta-400)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>
            <span>Low (1)</span>
            <span style={{ fontWeight: 600, color: 'var(--terracotta-500)' }}>{stressLevel}</span>
            <span>High (10)</span>
          </div>
        </div>
      </OField>

      <OField label="Anything else your coach should know?" hint="Optional. The more context, the more personalized the guidance.">
        <OTextarea value={additionalNotes} onChange={setAdditionalNotes}
          placeholder="e.g., I travel often, my partner is vegetarian, I really want to avoid medications if I can…" />
      </OField>
    </div>
  )
}

// ─── Step 6: Finish ───────────────────────────────────────────────────────
function StepFinish({ isPending }: { isPending: boolean }) {
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--terracotta-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        {isPending
          ? <Loader2 size={32} color="var(--terracotta-400)" style={{ animation: 'spin 1s linear infinite' }} />
          : <Check size={32} color="var(--terracotta-400)" />
        }
      </div>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
        color: 'var(--ink-900)', margin: '0 0 12px',
      }}>
        {isPending ? 'Building your plan…' : 'Ready when you are.'}
      </h2>
      <p style={{ fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
        {isPending
          ? 'Calculating your TDEE, macro targets, and personalized plan. Takes about 10 seconds.'
          : "Tap the button below and we'll calculate your personalized macro targets, goal weight, and starter plan using everything you shared."}
      </p>
    </div>
  )
}

// ─── Shared UI primitives ─────────────────────────────────────────────────
function OField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-800)' }}>
        {label}{required && <span style={{ color: 'var(--terracotta-500)', marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 12.5, color: 'var(--ink-500)', margin: '0 0 2px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function OInput({ value, onChange, placeholder, type, autoComplete }: {
  value: string; onChange: (v: string) => void
  placeholder: string; type: string; autoComplete?: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        padding: '12px 14px', background: '#fff',
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%',
        boxSizing: 'border-box',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    />
  )
}

function OSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        padding: '12px 14px', background: '#fff',
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%',
        boxSizing: 'border-box', cursor: 'pointer',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function OTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      rows={3}
      style={{
        padding: '12px 14px', background: '#fff',
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%',
        boxSizing: 'border-box', resize: 'vertical',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    />
  )
}

function ChipGroup({ options, value, onChange, multi = true }: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  multi?: boolean
}) {
  const toggle = (o: string) => {
    if (multi) {
      onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
    } else {
      onChange(value.includes(o) ? [] : [o])
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const sel = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 16px', borderRadius: 999,
              border: `1.5px solid ${sel ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
              background: sel ? 'var(--terracotta-50)' : '#fff',
              color: sel ? 'var(--terracotta-600)' : 'var(--ink-700)',
              fontSize: 13.5, fontWeight: sel ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 160ms',
            }}
          >
            {sel && <Check size={12} strokeWidth={2.5} />}
            {o}
          </button>
        )
      })}
    </div>
  )
}
