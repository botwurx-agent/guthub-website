'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Check, Loader2, Lock } from 'lucide-react'
import { saveProfileStep, completeOnboarding } from '@/app/actions/onboarding'
import { createClient } from '@/lib/supabase/client'

const TOTAL_STEPS = 6

// ─── Step definitions ──────────────────────────────────────────────────────
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
    titleEm: 'body & health',
    titleEnd: ' picture.',
    subtitle: 'We use this to calculate your personalized targets and give you safer guidance.',
  },
  {
    sidebarLabel: 'How you eat',
    eyebrow: '03 — HOW YOU EAT',
    titleStart: 'Tell us about your ',
    titleEm: 'eating style',
    titleEnd: '.',
    subtitle: "We'll tune your macros and meal suggestions to match.",
  },
  {
    sidebarLabel: 'Goals',
    eyebrow: '04 — GOALS',
    titleStart: 'What are you ',
    titleEm: 'working toward',
    titleEnd: '?',
    subtitle: "We'll align your daily targets and coaching to your goal.",
  },
  {
    sidebarLabel: 'Lifestyle',
    eyebrow: '05 — LIFESTYLE',
    titleStart: 'The full ',
    titleEm: 'picture',
    titleEnd: ' of how you live.',
    subtitle: 'Sleep, stress, and hydration shape gut health more than people realize.',
  },
  {
    sidebarLabel: 'Final touches',
    eyebrow: '06 — FINAL TOUCHES',
    titleStart: "You're ",
    titleEm: 'all set',
    titleEnd: '.',
    subtitle: "Tap below and we'll calculate your personalized plan.",
  },
]

const DIET_OPTIONS = [
  { value: 'default', label: 'Balanced', desc: 'No restrictions — 40/30/30 macros' },
  { value: 'keto', label: 'Keto', desc: 'High fat, very low carb (<20g net)' },
  { value: 'carnivore', label: 'Carnivore', desc: 'Animal products only' },
  { value: 'paleo', label: 'Paleo', desc: 'No grains, legumes, or dairy' },
  { value: 'vegan', label: 'Vegan', desc: 'Zero animal products' },
  { value: 'wfpb', label: 'Whole Food Plant-Based', desc: 'No added oils' },
  { value: 'gluten_free', label: 'Gluten Free', desc: 'No wheat, barley, or rye' },
  { value: 'low_fodmap', label: 'Low FODMAP', desc: 'For IBS / digestive sensitivity' },
  { value: 'high_protein_low_carb', label: 'High Protein / Low Carb', desc: '≥35g protein, ≤25g carbs per meal' },
  { value: 'intermittent_fasting', label: 'Intermittent Fasting', desc: 'Nutrient-dense meals, timed eating' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Hard daily exercise or physical job' },
]

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Lose weight' },
  { value: 'maintenance', label: 'Maintain weight' },
  { value: 'muscle_gain', label: 'Build muscle' },
  { value: 'gut_health', label: 'Improve gut health' },
  { value: 'energy', label: 'More energy' },
]

// ─── Main component ────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [firstName, setFirstName] = useState('')

  // Form state
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [medications, setMedications] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [allergies, setAllergies] = useState('')
  const [dietMode, setDietMode] = useState('default')
  const [eatingStyle, setEatingStyle] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('gut_health')
  const [targetWeightLbs, setTargetWeightLbs] = useState('')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [sleepHours, setSleepHours] = useState('')
  const [stressLevel, setStressLevel] = useState('')
  const [hydrationGlasses, setHydrationGlasses] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Pre-fill name from auth metadata
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
          name: fullName,
          dob,
          gender,
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
            medications: medications || null,
            medical_conditions: medicalConditions || null,
            allergies: allergies || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(2)
      })

    } else if (step === 2) {
      startTransition(async () => {
        const res = await saveProfileStep(3, {
          diet_mode: dietMode,
          health_profile: {
            nickname: nickname || null,
            medications: medications || null,
            medical_conditions: medicalConditions || null,
            allergies: allergies || null,
            eating_style: eatingStyle || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(3)
      })

    } else if (step === 3) {
      startTransition(async () => {
        const res = await saveProfileStep(4, {
          health_profile: {
            nickname: nickname || null,
            medications: medications || null,
            medical_conditions: medicalConditions || null,
            allergies: allergies || null,
            eating_style: eatingStyle || null,
            primary_goal: primaryGoal,
            target_weight_lbs: targetWeightLbs || null,
            activity_level: activityLevel,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(4)
      })

    } else if (step === 4) {
      startTransition(async () => {
        const res = await saveProfileStep(5, {
          health_profile: {
            nickname: nickname || null,
            medications: medications || null,
            medical_conditions: medicalConditions || null,
            allergies: allergies || null,
            eating_style: eatingStyle || null,
            primary_goal: primaryGoal,
            target_weight_lbs: targetWeightLbs || null,
            activity_level: activityLevel,
            sleep_hours: sleepHours || null,
            stress_level: stressLevel || null,
            hydration_glasses: hydrationGlasses || null,
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
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <Image src="/logo-full.png" alt="GutHub" width={120} height={30} style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Welcome */}
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400,
          color: 'var(--cream-100)', margin: '0 0 12px', lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          Welcome
          {firstName && <>, <em style={{ fontStyle: 'italic', color: '#e8c870' }}>{firstName}</em></>}
          .
        </h2>
        <p style={{
          fontSize: 14.5, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.55, margin: '0 0 36px', maxWidth: 280,
        }}>
          About 6 minutes. The more your coach knows now, the better it can help later.
        </p>

        {/* Step list */}
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

        {/* Footer */}
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
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
          color: 'var(--terracotta-500)', textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          {currentStep.eyebrow}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--ink-900)',
          margin: '0 0 14px', lineHeight: 1.15,
        }}>
          {currentStep.titleStart}
          <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>{currentStep.titleEm}</em>
          {currentStep.titleEnd}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 17, color: 'var(--ink-500)', lineHeight: 1.55,
          margin: '0 0 36px', maxWidth: 540,
        }}>
          {currentStep.subtitle}
        </p>

        {/* Step content */}
        <div style={{ flex: 1 }}>
          {step === 0 && <StepAboutYou {...{ fullName, setFullName, nickname, setNickname, dob, setDob, gender, setGender }} />}
          {step === 1 && <StepHealth {...{ weightLbs, setWeightLbs, heightFt, setHeightFt, heightIn, setHeightIn, medications, setMedications, medicalConditions, setMedicalConditions, allergies, setAllergies }} />}
          {step === 2 && <StepEating {...{ dietMode, setDietMode, eatingStyle, setEatingStyle }} />}
          {step === 3 && <StepGoals {...{ primaryGoal, setPrimaryGoal, targetWeightLbs, setTargetWeightLbs, activityLevel, setActivityLevel }} />}
          {step === 4 && <StepLifestyle {...{ sleepHours, setSleepHours, stressLevel, setStressLevel, hydrationGlasses, setHydrationGlasses, additionalNotes, setAdditionalNotes }} />}
          {step === 5 && <StepFinish isPending={isPending} />}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
            borderRadius: 10, fontSize: 13.5, color: 'var(--terracotta-600)',
          }}>
            {error}
          </div>
        )}

        {/* Footer nav */}
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
                transition: 'background 200ms, transform 200ms',
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
          .onb-sidebar {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            padding: 24px !important;
          }
          .onb-main {
            padding: 32px 24px !important;
          }
          div:has(> .onb-sidebar) {
            flex-direction: column !important;
          }
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
            { value: 'other', label: 'Other' },
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

// ─── Step 2: Health & history ────────────────────────────────────────────
function StepHealth({ weightLbs, setWeightLbs, heightFt, setHeightFt, heightIn, setHeightIn, medications, setMedications, medicalConditions, setMedicalConditions, allergies, setAllergies }: {
  weightLbs: string; setWeightLbs: (v: string) => void
  heightFt: string; setHeightFt: (v: string) => void
  heightIn: string; setHeightIn: (v: string) => void
  medications: string; setMedications: (v: string) => void
  medicalConditions: string; setMedicalConditions: (v: string) => void
  allergies: string; setAllergies: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 540 }}>
      <OField label="Current weight (lbs)" required>
        <OInput value={weightLbs} onChange={setWeightLbs} placeholder="165" type="number" />
      </OField>
      <OField label="Height" required>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <OInput value={heightFt} onChange={setHeightFt} placeholder="5" type="number" />
            <span style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, display: 'block' }}>feet</span>
          </div>
          <div style={{ flex: 1 }}>
            <OInput value={heightIn} onChange={setHeightIn} placeholder="8" type="number" />
            <span style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, display: 'block' }}>inches</span>
          </div>
        </div>
      </OField>
      <OField label="Medical conditions" hint="Optional. e.g. IBS, GERD, diabetes…">
        <OTextarea value={medicalConditions} onChange={setMedicalConditions} placeholder="" />
      </OField>
      <OField label="Current medications" hint="Optional. e.g. Metformin, Omeprazole…">
        <OTextarea value={medications} onChange={setMedications} placeholder="" />
      </OField>
      <OField label="Food allergies or intolerances" hint="Optional. e.g. Gluten, lactose, tree nuts…">
        <OTextarea value={allergies} onChange={setAllergies} placeholder="" />
      </OField>
    </div>
  )
}

// ─── Step 3: How you eat ────────────────────────────────────────────────
function StepEating({ dietMode, setDietMode, eatingStyle, setEatingStyle }: {
  dietMode: string; setDietMode: (v: string) => void
  eatingStyle: string; setEatingStyle: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 600 }}>
      <OField label="Diet preference">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DIET_OPTIONS.map(d => (
            <RadioCard key={d.value} label={d.label} desc={d.desc} selected={dietMode === d.value} onClick={() => setDietMode(d.value)} />
          ))}
        </div>
      </OField>
      <OField label="How would you describe your eating?" hint="Optional.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['3 meals/day', 'Grazer', 'Skip breakfast', 'Late dinners', 'Inconsistent', 'On the go'].map(s => (
            <ChipButton key={s} label={s} selected={eatingStyle === s} onClick={() => setEatingStyle(eatingStyle === s ? '' : s)} />
          ))}
        </div>
      </OField>
    </div>
  )
}

// ─── Step 4: Goals ───────────────────────────────────────────────────────
function StepGoals({ primaryGoal, setPrimaryGoal, targetWeightLbs, setTargetWeightLbs, activityLevel, setActivityLevel }: {
  primaryGoal: string; setPrimaryGoal: (v: string) => void
  targetWeightLbs: string; setTargetWeightLbs: (v: string) => void
  activityLevel: string; setActivityLevel: (v: string) => void
}) {
  const showTargetWeight = primaryGoal === 'weight_loss' || primaryGoal === 'muscle_gain'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 600 }}>
      <OField label="Primary goal">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GOAL_OPTIONS.map(g => (
            <ChipButton key={g.value} label={g.label} selected={primaryGoal === g.value} onClick={() => setPrimaryGoal(g.value)} />
          ))}
        </div>
      </OField>

      {showTargetWeight && (
        <OField label="Target weight (lbs)" hint="Optional.">
          <OInput value={targetWeightLbs} onChange={setTargetWeightLbs} placeholder="150" type="number" />
        </OField>
      )}

      <OField label="Activity level">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACTIVITY_OPTIONS.map(a => (
            <RadioCard key={a.value} label={a.label} desc={a.desc} selected={activityLevel === a.value} onClick={() => setActivityLevel(a.value)} />
          ))}
        </div>
      </OField>
    </div>
  )
}

// ─── Step 5: Lifestyle ───────────────────────────────────────────────────
function StepLifestyle({ sleepHours, setSleepHours, stressLevel, setStressLevel, hydrationGlasses, setHydrationGlasses, additionalNotes, setAdditionalNotes }: {
  sleepHours: string; setSleepHours: (v: string) => void
  stressLevel: string; setStressLevel: (v: string) => void
  hydrationGlasses: string; setHydrationGlasses: (v: string) => void
  additionalNotes: string; setAdditionalNotes: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 540 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OField label="Average sleep (hrs/night)">
          <OInput value={sleepHours} onChange={setSleepHours} placeholder="7" type="number" />
        </OField>
        <OField label="Water intake (glasses/day)">
          <OInput value={hydrationGlasses} onChange={setHydrationGlasses} placeholder="8" type="number" />
        </OField>
      </div>
      <OField label="Daily stress level">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Low', 'Moderate', 'High', 'Very high'].map(s => (
            <ChipButton key={s} label={s} selected={stressLevel === s.toLowerCase().replace(' ', '_')} onClick={() => setStressLevel(s.toLowerCase().replace(' ', '_'))} />
          ))}
        </div>
      </OField>
      <OField label="Anything else we should know?" hint="Optional. Past diets, recent changes, concerns…">
        <OTextarea value={additionalNotes} onChange={setAdditionalNotes} placeholder="" />
      </OField>
    </div>
  )
}

// ─── Step 6: Finish ──────────────────────────────────────────────────────
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

function ChipButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 999,
      border: `1.5px solid ${selected ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
      background: selected ? 'var(--terracotta-50)' : '#fff',
      color: selected ? 'var(--terracotta-600)' : 'var(--ink-700)',
      fontSize: 13.5, fontWeight: selected ? 600 : 400,
      cursor: 'pointer', fontFamily: 'var(--font-body)',
      transition: 'all 160ms',
    }}>
      {label}
    </button>
  )
}

function RadioCard({ label, desc, selected, onClick }: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '12px 16px', borderRadius: 12, textAlign: 'left',
      border: `1.5px solid ${selected ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
      background: selected ? 'var(--terracotta-50)' : '#fff',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: 'var(--font-body)', transition: 'all 160ms',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--terracotta-400)' : 'var(--ink-300)'}`,
        background: selected ? 'var(--terracotta-400)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}
