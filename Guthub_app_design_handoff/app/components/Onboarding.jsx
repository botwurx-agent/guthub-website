// Onboarding.jsx — 6-step intake form, progress sidebar.

const ONB_STEPS = [
  { id: 'personal',  label: 'About you' },
  { id: 'health',    label: 'Health & history' },
  { id: 'diet',      label: 'How you eat' },
  { id: 'goals',     label: 'Goals' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'finish',    label: 'Final touches' },
];

function OnbProgress({ stepIdx }) {
  return (
    <div className="onb-progress">
      {ONB_STEPS.map((s, i) => {
        const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
        return (
          <div key={s.id} className={'onb-progress-step ' + cls}>
            <span className="onb-progress-bullet">
              {i < stepIdx ? <Icon name="check" size={11} /> : i + 1}
            </span>
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OnbField({ label, help, children }) {
  return (
    <div className="field" style={{ marginBottom: 22 }}>
      <label className="field-label">{label}</label>
      {help && <div className="field-help">{help}</div>}
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange, multi = true }) {
  const isSel = (o) => multi ? value.includes(o) : value === o;
  const toggle = (o) => {
    if (multi) {
      onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
    } else {
      onChange(o);
    }
  };
  return (
    <div className="chips">
      {options.map(o => (
        <button key={o} className={'chip ' + (isSel(o) ? 'selected' : '')} onClick={() => toggle(o)} type="button">
          {isSel(o) && <Icon name="check" size={14} />} {o}
        </button>
      ))}
    </div>
  );
}

function StepPersonal({ data, set }) {
  return (
    <>
      <OnbField label="Full name">
        <input className="input" placeholder="Steve Nazari" value={data.name || ''} onChange={e => set({ name: e.target.value })} />
      </OnbField>
      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <OnbField label="Date of birth">
          <input className="input" type="date" value={data.dob || ''} onChange={e => set({ dob: e.target.value })} />
        </OnbField>
        <OnbField label="Gender">
          <select className="select" value={data.gender || ''} onChange={e => set({ gender: e.target.value })}>
            <option value="">Select</option>
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
        </OnbField>
      </div>
      <OnbField label="What should we call you?" help="If different from your full name.">
        <input className="input" placeholder="Steve" value={data.preferredName || ''} onChange={e => set({ preferredName: e.target.value })} />
      </OnbField>
    </>
  );
}

function StepHealth({ data, set }) {
  const conds = ['IBS', 'IBD / Crohn\'s', 'Acid reflux', 'Diabetes', 'High blood pressure', 'Thyroid', 'Autoimmune', 'None of these'];
  const allergens = ['Dairy', 'Gluten', 'Eggs', 'Soy', 'Tree nuts', 'Peanuts', 'Shellfish', 'Fish'];
  return (
    <>
      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <OnbField label="Current weight (lb)">
          <input className="input" type="number" placeholder="225" value={data.weight || ''} onChange={e => set({ weight: e.target.value })} />
        </OnbField>
        <OnbField label="Height">
          <input className="input" placeholder="5' 10&quot;" value={data.height || ''} onChange={e => set({ height: e.target.value })} />
        </OnbField>
      </div>
      <OnbField label="Medical conditions" help="Pick any that apply. You can add more later.">
        <ChipGroup options={conds} value={data.conditions || []} onChange={v => set({ conditions: v })} />
      </OnbField>
      <OnbField label="Food allergies & sensitivities">
        <ChipGroup options={allergens} value={data.allergens || []} onChange={v => set({ allergens: v })} />
      </OnbField>
      <OnbField label="Current medications & supplements" help="Optional. Names and rough dose are enough.">
        <textarea className="textarea" placeholder="e.g., Omeprazole 20mg morning, Vitamin D 2000 IU, magnesium glycinate at night"
                  value={data.meds || ''} onChange={e => set({ meds: e.target.value })} />
      </OnbField>
    </>
  );
}

function StepDiet({ data, set }) {
  const styles = ['Mediterranean', 'Low-FODMAP', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'No specific style'];
  return (
    <>
      <OnbField label="Eating style">
        <ChipGroup options={styles} value={data.eatingStyle || ''} onChange={v => set({ eatingStyle: v })} multi={false} />
      </OnbField>
      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <OnbField label="How often do you cook?">
          <select className="select" value={data.cooking || ''} onChange={e => set({ cooking: e.target.value })}>
            <option value="">Select</option>
            <option>Daily</option>
            <option>A few times a week</option>
            <option>Once a week</option>
            <option>Rarely / never</option>
          </select>
        </OnbField>
        <OnbField label="How often do you eat out?">
          <select className="select" value={data.eatOut || ''} onChange={e => set({ eatOut: e.target.value })}>
            <option value="">Select</option>
            <option>Rarely</option>
            <option>1–2 times a week</option>
            <option>3–4 times a week</option>
            <option>Most days</option>
          </select>
        </OnbField>
      </div>
      <OnbField label="A typical day of meals" help="Just a rough sketch — breakfast, lunch, dinner, snacks.">
        <textarea className="textarea" placeholder="e.g., Coffee + toast, salad with chicken at lunch, pasta or fish for dinner"
                  value={data.typicalDay || ''} onChange={e => set({ typicalDay: e.target.value })} />
      </OnbField>
      <OnbField label="Caffeine & alcohol">
        <div className="grid grid-2">
          <input className="input" placeholder="Caffeine (e.g., 2 coffees/day)" value={data.caffeine || ''} onChange={e => set({ caffeine: e.target.value })} />
          <input className="input" placeholder="Alcohol (e.g., 2 drinks/week)" value={data.alcohol || ''} onChange={e => set({ alcohol: e.target.value })} />
        </div>
      </OnbField>
    </>
  );
}

function StepGoals({ data, set }) {
  const goals = ['Reduce bloating', 'Better digestion', 'Weight loss', 'More steady energy', 'Better sleep', 'Identify trigger foods', 'Build healthy habits', 'Reduce reflux'];
  return (
    <>
      <OnbField label="What do you want to work on?" help="Pick up to 3.">
        <ChipGroup options={goals} value={data.goals || []} onChange={v => v.length <= 3 && set({ goals: v })} />
      </OnbField>
      <OnbField label="Anything specific you'd like addressed?">
        <textarea className="textarea" placeholder="e.g., I bloat after most meals and want to figure out which foods are causing it."
                  value={data.specific || ''} onChange={e => set({ specific: e.target.value })} />
      </OnbField>
      <OnbField label="Have you worked with a nutritionist or RD before?">
        <ChipGroup options={['Yes, currently', 'Yes, in the past', 'No']} value={data.priorRd || ''} onChange={v => set({ priorRd: v })} multi={false} />
      </OnbField>
    </>
  );
}

function StepLifestyle({ data, set }) {
  return (
    <>
      <OnbField label="How well do you sleep?">
        <ChipGroup options={['Great', 'Pretty good', 'So-so', 'Poorly']} value={data.sleep || ''} onChange={v => set({ sleep: v })} multi={false} />
      </OnbField>
      <OnbField label="Average daily energy">
        <ChipGroup options={['High & steady', 'Steady but low', 'Up and down', 'Low most of the day']} value={data.energy || ''} onChange={v => set({ energy: v })} multi={false} />
      </OnbField>
      <OnbField label="Stress level (typical week)" help="Slide to set.">
        <input className="slider" type="range" min="1" max="5" value={data.stress || 3} onChange={e => set({ stress: Number(e.target.value) })} />
        <div className="row-between subtle" style={{ fontSize: 12, marginTop: 6 }}>
          <span>Low</span><span>Manageable</span><span>High</span>
        </div>
      </OnbField>
      <OnbField label="Exercise routine">
        <textarea className="textarea" placeholder="e.g., Walk 30 min most days, lift weights 2x/week"
                  value={data.exercise || ''} onChange={e => set({ exercise: e.target.value })} />
      </OnbField>
    </>
  );
}

function StepFinish({ data, set }) {
  return (
    <>
      <OnbField label="Anything else you'd like your coach to know?" help="Optional. The more context, the more personalized the guidance.">
        <textarea className="textarea" style={{ minHeight: 140 }} placeholder="e.g., I travel often, my partner is vegetarian, I really want to avoid medications if I can…"
                  value={data.notes || ''} onChange={e => set({ notes: e.target.value })} />
      </OnbField>

      <div className="card" style={{ background: 'var(--cream-100)', marginTop: 24 }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--forest-500)', color: 'var(--cream-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="sparkle" size={22} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Your coach is ready</div>
            <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
              Based on what you shared, your coach already knows about your IBS, dairy sensitivity, and your goal of reducing bloating. Next, we'll walk you through your first meal log and a quick chat — about 2 minutes.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Onboarding({ onComplete }) {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [data, setData] = React.useState({
    name: 'Steve Nazari', preferredName: 'Steve', dob: '1968-03-14', gender: 'Male',
    weight: 225, height: '5\' 10"',
    conditions: ['IBS'], allergens: ['Dairy'],
    eatingStyle: 'Mediterranean', goals: ['Reduce bloating', 'Lose 10 lb'],
  });
  const set = (patch) => setData(d => ({ ...d, ...patch }));

  const stepDef = ONB_STEPS[stepIdx];
  const titles = {
    personal:  { num: '01 — about you',         t: <>Let's start with the <em>basics</em>.</>,                 sub: 'A couple quick details so we can call you the right thing.' },
    health:    { num: '02 — health & history',  t: <>Your <em>health context</em>.</>,                          sub: 'This stays private. We use it to make every suggestion safe and relevant.' },
    diet:      { num: '03 — how you eat',       t: <>What does a <em>typical day</em> look like?</>,            sub: 'No judgement. Just what\'s actually on your plate.' },
    goals:     { num: '04 — your goals',        t: <>What do you want to <em>change</em>?</>,                   sub: 'Three things, max. We\'ll help you focus.' },
    lifestyle: { num: '05 — lifestyle',         t: <>Sleep, energy, and <em>stress</em>.</>,                    sub: 'Your gut listens to all of these.' },
    finish:    { num: '06 — final touches',     t: <>One last <em>note</em> before we begin.</>,                sub: 'Anything else that would help your coach understand you?' },
  }[stepDef.id];

  const isLast = stepIdx === ONB_STEPS.length - 1;
  const next = () => isLast ? onComplete(data) : setStepIdx(i => i + 1);
  const back = () => setStepIdx(i => Math.max(0, i - 1));

  const StepComp = { personal: StepPersonal, health: StepHealth, diet: StepDiet, goals: StepGoals, lifestyle: StepLifestyle, finish: StepFinish }[stepDef.id];

  return (
    <div className="onb-shell" data-screen-label="Onboarding">
      <aside className="onb-side">
        <div>
          <img src="assets/logo-dark.png" alt="GutHub" style={{ width: 'auto', height: 30 }} />
          <div style={{ marginTop: 32, fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.15, color: 'var(--cream-50)', letterSpacing: '-0.01em' }}>
            Welcome, <em style={{ color: 'var(--brand-yellow)' }}>{data.preferredName || 'friend'}</em>.
          </div>
          <div style={{ color: 'rgba(250,245,238,0.7)', fontSize: 15, lineHeight: 1.55, marginTop: 12 }}>
            About 6 minutes. The more your coach knows now, the better it can help later.
          </div>
          <OnbProgress stepIdx={stepIdx} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(250,245,238,0.5)' }}>
          Your information is encrypted and never shared with third parties.
        </div>
      </aside>

      <div className="onb-main">
        <div className="fade-in" key={stepIdx}>
          <div className="onb-step-num">{titles.num}</div>
          <h1 className="onb-step-title">{titles.t}</h1>
          <p className="onb-step-sub">{titles.sub}</p>
          <StepComp data={data} set={set} />
        </div>
        <div className="onb-footer">
          <button className="btn btn-ghost" onClick={back} disabled={stepIdx === 0} style={{ visibility: stepIdx === 0 ? 'hidden' : 'visible' }}>
            <Icon name="arrowLeft" size={16} /> Back
          </button>
          <div className="row">
            <span className="subtle" style={{ fontSize: 13 }}>Step {stepIdx + 1} of {ONB_STEPS.length}</span>
            <button className="btn btn-primary" onClick={next}>
              {isLast ? 'Finish & enter app' : 'Continue'} <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
