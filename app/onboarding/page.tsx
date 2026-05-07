'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { saveProfileStep, completeOnboarding } from '@/app/actions/onboarding'

const TOTAL_STEPS = 6

// ─── Step definitions ──────────────────────────────────────────────────────
const STEPS = [
  { title: 'About you', subtitle: 'Let\'s start with the basics.' },
  { title: 'Your body', subtitle: 'We use this to calculate your personalized targets.' },
  { title: 'Your goals', subtitle: 'What are you working toward?' },
  { title: 'Health history', subtitle: 'Helps us give you safer, more relevant guidance.' },
  { title: 'Daily habits', subtitle: 'The full picture of how you live.' },
  { title: 'All set!', subtitle: 'We\'re calculating your personalized plan…' },
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

  // Form state
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [dietMode, setDietMode] = useState('default')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [primaryGoal, setPrimaryGoal] = useState('gut_health')
  const [targetWeightLbs, setTargetWeightLbs] = useState('')
  const [medications, setMedications] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [familyHistory, setFamilyHistory] = useState('')
  const [allergies, setAllergies] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [stressLevel, setStressLevel] = useState('')
  const [hydrationGlasses, setHydrationGlasses] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  function lbsToKg(lbs: number) { return lbs / 2.20462 }
  function feetInToCm(ft: number, inches: number) { return (ft * 12 + inches) * 2.54 }

  async function handleNext() {
    setError(null)

    if (step === 0) {
      if (!name.trim()) return setError('Please enter your name.')
      if (!dob) return setError('Please enter your date of birth.')
      if (!gender) return setError('Please select your gender.')
      startTransition(async () => {
        const res = await saveProfileStep(1, { name, dob, gender })
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
        })
        if (res?.error) setError(res.error)
        else setStep(2)
      })

    } else if (step === 2) {
      startTransition(async () => {
        const res = await saveProfileStep(3, {
          diet_mode: dietMode,
          health_profile: {
            activity_level: activityLevel,
            primary_goal: primaryGoal,
            target_weight_lbs: targetWeightLbs || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(3)
      })

    } else if (step === 3) {
      startTransition(async () => {
        const existing = await getExistingHealthProfile()
        const res = await saveProfileStep(4, {
          health_profile: {
            ...existing,
            medications: medications || null,
            medical_conditions: medicalConditions || null,
            family_history: familyHistory || null,
            allergies: allergies || null,
          },
        })
        if (res?.error) setError(res.error)
        else setStep(4)
      })

    } else if (step === 4) {
      startTransition(async () => {
        const existing = await getExistingHealthProfile()
        const res = await saveProfileStep(5, {
          health_profile: {
            ...existing,
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

  // We merge health_profile fields client-side to avoid overwriting
  // In production this would be a server-side merge; fine for onboarding
  async function getExistingHealthProfile() {
    return {
      activity_level: activityLevel,
      primary_goal: primaryGoal,
      target_weight_lbs: targetWeightLbs || null,
    }
  }

  const currentStep = STEPS[step]
  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream-50)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px 80px',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <Image src="/logo-full.png" alt="GutHub" width={110} height={28} style={{ height: 28, width: 'auto' }} />
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: `${100 / TOTAL_STEPS - 1}%`,
              height: 4,
              borderRadius: 999,
              background: i <= step ? 'var(--terracotta-400)' : 'var(--ink-200)',
              transition: 'background 300ms',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#fff',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: '0 4px 24px rgba(31,45,42,0.08)',
        padding: '40px 40px 32px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--ink-900)', margin: '0 0 6px',
        }}>{currentStep.title}</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '0 0 32px' }}>
          {currentStep.subtitle}
        </p>

        {/* Step content */}
        {step === 0 && <StepPersonal name={name} setName={setName} dob={dob} setDob={setDob} gender={gender} setGender={setGender} />}
        {step === 1 && <StepBiometrics weightLbs={weightLbs} setWeightLbs={setWeightLbs} heightFt={heightFt} setHeightFt={setHeightFt} heightIn={heightIn} setHeightIn={setHeightIn} />}
        {step === 2 && <StepGoals dietMode={dietMode} setDietMode={setDietMode} activityLevel={activityLevel} setActivityLevel={setActivityLevel} primaryGoal={primaryGoal} setPrimaryGoal={setPrimaryGoal} targetWeightLbs={targetWeightLbs} setTargetWeightLbs={setTargetWeightLbs} />}
        {step === 3 && <StepHealthHistory medications={medications} setMedications={setMedications} medicalConditions={medicalConditions} setMedicalConditions={setMedicalConditions} familyHistory={familyHistory} setFamilyHistory={setFamilyHistory} allergies={allergies} setAllergies={setAllergies} />}
        {step === 4 && <StepHabits sleepHours={sleepHours} setSleepHours={setSleepHours} stressLevel={stressLevel} setStressLevel={setStressLevel} hydrationGlasses={hydrationGlasses} setHydrationGlasses={setHydrationGlasses} additionalNotes={additionalNotes} setAdditionalNotes={setAdditionalNotes} />}
        {step === 5 && <StepFinish isPending={isPending} />}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
            borderRadius: 10, fontSize: 13.5, color: 'var(--error)', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <button
              onClick={() => { setStep(s => s - 1); setError(null) }}
              disabled={step === 0 || isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 999,
                border: '1px solid var(--border)', background: 'transparent',
                fontSize: 14, fontWeight: 500, color: 'var(--ink-600)',
                cursor: step === 0 ? 'default' : 'pointer',
                opacity: step === 0 ? 0 : 1,
                fontFamily: 'var(--font-body)',
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

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
              {isPending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <>Continue <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {step === 5 && !isPending && (
          <button
            onClick={handleNext}
            style={{
              width: '100%', marginTop: 24, padding: '14px 20px',
              borderRadius: 999, border: 'none',
              background: 'var(--terracotta-400)',
              fontSize: 15, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Build my plan <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step 1: Personal ─────────────────────────────────────────────────────
function StepPersonal({ name, setName, dob, setDob, gender, setGender }: {
  name: string; setName: (v: string) => void
  dob: string; setDob: (v: string) => void
  gender: string; setGender: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <OField label="Full name" required>
        <OInput value={name} onChange={setName} placeholder="Alex Morgan" type="text" autoComplete="name" />
      </OField>
      <OField label="Date of birth" required>
        <OInput value={dob} onChange={setDob} placeholder="" type="date" autoComplete="bday" />
      </OField>
      <OField label="Gender" required>
        <div style={{ display: 'flex', gap: 10 }}>
          {['male', 'female', 'other', 'prefer_not_to_say'].map(g => (
            <ChipButton key={g} label={g === 'prefer_not_to_say' ? 'Prefer not to say' : g.charAt(0).toUpperCase() + g.slice(1)} selected={gender === g} onClick={() => setGender(g)} />
          ))}
        </div>
      </OField>
    </div>
  )
}

// ─── Step 2: Biometrics ───────────────────────────────────────────────────
function StepBiometrics({ weightLbs, setWeightLbs, heightFt, setHeightFt, heightIn, setHeightIn }: {
  weightLbs: string; setWeightLbs: (v: string) => void
  heightFt: string; setHeightFt: (v: string) => void
  heightIn: string; setHeightIn: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
      <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5, margin: 0 }}>
        We use these to calculate your TDEE and personalized macro targets using the Mifflin-St Jeor formula.
      </p>
    </div>
  )
}

// ─── Step 3: Goals ────────────────────────────────────────────────────────
function StepGoals({ dietMode, setDietMode, activityLevel, setActivityLevel, primaryGoal, setPrimaryGoal, targetWeightLbs, setTargetWeightLbs }: {
  dietMode: string; setDietMode: (v: string) => void
  activityLevel: string; setActivityLevel: (v: string) => void
  primaryGoal: string; setPrimaryGoal: (v: string) => void
  targetWeightLbs: string; setTargetWeightLbs: (v: string) => void
}) {
  const showTargetWeight = primaryGoal === 'weight_loss' || primaryGoal === 'muscle_gain'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <OField label="Primary goal">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GOAL_OPTIONS.map(g => (
            <ChipButton key={g.value} label={g.label} selected={primaryGoal === g.value} onClick={() => setPrimaryGoal(g.value)} />
          ))}
        </div>
      </OField>

      {showTargetWeight && (
        <OField label="Target weight (lbs) — optional">
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

      <OField label="Diet preference">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DIET_OPTIONS.map(d => (
            <RadioCard key={d.value} label={d.label} desc={d.desc} selected={dietMode === d.value} onClick={() => setDietMode(d.value)} />
          ))}
        </div>
      </OField>
    </div>
  )
}

// ─── Step 4: Health history ───────────────────────────────────────────────
function StepHealthHistory({ medications, setMedications, medicalConditions, setMedicalConditions, familyHistory, setFamilyHistory, allergies, setAllergies }: {
  medications: string; setMedications: (v: string) => void
  medicalConditions: string; setMedicalConditions: (v: string) => void
  familyHistory: string; setFamilyHistory: (v: string) => void
  allergies: string; setAllergies: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5, margin: 0 }}>
        All fields optional. This helps GutHub give you safer, more personalized guidance.
      </p>
      <OField label="Current medications">
        <OTextarea value={medications} onChange={setMedications} placeholder="e.g. Metformin, Omeprazole…" />
      </OField>
      <OField label="Medical conditions">
        <OTextarea value={medicalConditions} onChange={setMedicalConditions} placeholder="e.g. Type 2 diabetes, IBS, GERD…" />
      </OField>
      <OField label="Family health history">
        <OTextarea value={familyHistory} onChange={setFamilyHistory} placeholder="e.g. Heart disease, colon cancer…" />
      </OField>
      <OField label="Food allergies or intolerances">
        <OTextarea value={allergies} onChange={setAllergies} placeholder="e.g. Gluten, lactose, tree nuts…" />
      </OField>
    </div>
  )
}

// ─── Step 5: Daily habits ─────────────────────────────────────────────────
function StepHabits({ sleepHours, setSleepHours, stressLevel, setStressLevel, hydrationGlasses, setHydrationGlasses, additionalNotes, setAdditionalNotes }: {
  sleepHours: string; setSleepHours: (v: string) => void
  stressLevel: string; setStressLevel: (v: string) => void
  hydrationGlasses: string; setHydrationGlasses: (v: string) => void
  additionalNotes: string; setAdditionalNotes: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <OField label="Average sleep (hours/night)">
        <OInput value={sleepHours} onChange={setSleepHours} placeholder="7" type="number" />
      </OField>
      <OField label="Daily stress level">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Low', 'Moderate', 'High', 'Very high'].map(s => (
            <ChipButton key={s} label={s} selected={stressLevel === s.toLowerCase().replace(' ', '_')} onClick={() => setStressLevel(s.toLowerCase().replace(' ', '_'))} />
          ))}
        </div>
      </OField>
      <OField label="Water intake (glasses/day)">
        <OInput value={hydrationGlasses} onChange={setHydrationGlasses} placeholder="8" type="number" />
      </OField>
      <OField label="Anything else we should know?">
        <OTextarea value={additionalNotes} onChange={setAdditionalNotes} placeholder="Past diets, recent changes, concerns…" />
      </OField>
    </div>
  )
}

// ─── Step 6: Finish ───────────────────────────────────────────────────────
function StepFinish({ isPending }: { isPending: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--terracotta-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
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
        {isPending ? 'Building your plan…' : 'Your profile is complete!'}
      </h2>
      <p style={{ fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.6, margin: 0 }}>
        {isPending
          ? 'Calculating your TDEE, macro targets, and goal weight. This takes about 10 seconds.'
          : 'Tap the button below and we\'ll calculate your personalized macro targets and goal weight using your profile.'}
      </p>
    </div>
  )
}

// ─── Shared UI primitives ─────────────────────────────────────────────────
function OField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: 'var(--terracotta-500)', marginLeft: 3 }}>*</span>}
      </label>
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
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--border)'}`,
        borderRadius: 10, fontSize: 15, fontFamily: 'var(--font-body)',
        color: 'var(--ink-900)', outline: 'none', width: '100%',
        boxSizing: 'border-box',
        boxShadow: focus ? '0 0 0 3px rgba(219,111,86,0.12)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}
    />
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
        border: `1px solid ${focus ? 'var(--terracotta-400)' : 'var(--border)'}`,
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
      border: `1.5px solid ${selected ? 'var(--terracotta-400)' : 'var(--border)'}`,
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
      border: `1.5px solid ${selected ? 'var(--terracotta-400)' : 'var(--border)'}`,
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
