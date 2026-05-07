// FeatureBlocks.jsx — 6 current features, alternating left/right

function FeatureBlocks() {
  const features = [
    {
      id: 'snap',
      eyebrow: 'Snap & know',
      title: 'Photograph your plate. Get the full picture.',
      body: 'Point your camera at any meal — packaged, home-cooked, or on the menu. Guthub returns calories, macros, and gut-health flags in under three seconds. No barcode, no form, no lookup.',
      bullets: ['Real plates, real portions', 'Flags for FODMAPs, lactose, gluten, histamines', 'Works on leftovers and mixed bowls'],
      mock: <MockSnap />,
    },
    {
      id: 'chat',
      eyebrow: 'AI chat assistant',
      title: 'A nutritionist who remembers every bite.',
      body: 'Ask anything in plain language. Your chat has full context on your intake, your history, and every meal you\'ve ever logged — so the advice actually applies to you.',
      bullets: ['Context-aware from day one', 'Cites sources when it matters', 'Speaks plainly, not clinically'],
      mock: <MockChat />,
    },
    {
      id: 'goal',
      eyebrow: 'Goal tracker',
      title: 'Set the destination. We chart the route.',
      body: 'Tell Guthub your target — a weight, a symptom to reduce, a reintroduction to test. It translates that into daily macro targets and gentle nudges, and shows you exactly how close you are.',
      bullets: ['Weight, symptom, or habit goals', 'Adaptive daily macro targets', 'Weekly progress snapshots'],
      mock: <MockGoal />,
    },
    {
      id: 'planner',
      eyebrow: 'Meal planner',
      title: 'A week of meals that actually fit you.',
      body: 'Your planner pulls from your intake — allergies, dislikes, cooking skill, budget — and builds a week of meals you\'ll actually eat. Grocery list auto-generated, ingredients checked against your gut flags.',
      bullets: ['Generated from your intake profile', 'Swap any meal in one tap', 'Grocery list with store sections'],
      mock: <MockPlanner />,
    },
    {
      id: 'reports',
      eyebrow: 'Test report analysis',
      title: 'Upload the PDF. Skip the guesswork.',
      body: 'Drop in your blood work, stool panel, or food-sensitivity report. Guthub extracts the biomarkers, flags what\'s out of range, and translates it into diet and lifestyle moves you can act on this week.',
      bullets: ['Blood, stool, and sensitivity panels', 'Out-of-range flags in plain English', 'Action list tailored to your data'],
      mock: <MockReports />,
    },
    {
      id: 'dashboard',
      eyebrow: 'Health dashboard',
      title: 'Everything you\'re tracking, on one page.',
      body: 'Weight, macros, symptom logs, energy, sleep, adherence — all in one view. Spot trends across weeks, not days. Share the whole picture with your doctor in one tap.',
      bullets: ['Trends across weeks and months', 'Symptom + food correlation', 'One-tap doctor export'],
      mock: <MockDashboard />,
    },
  ];

  return (
    <section style={{ padding: '0', background: 'var(--cream-50)' }}>
      {features.map((f, i) => {
        const isLast = i === features.length - 1;
        const bg = isLast
          ? 'var(--forest-500)'
          : (i % 2 === 0 ? 'var(--cream-50)' : 'var(--cream-100)');
        return (
          <Reveal key={f.id} y={24} duration={800} threshold={0.12}>
            <FeatureBlock feature={f} flip={i % 2 === 1} bg={bg} dark={isLast} />
          </Reveal>
        );
      })}
    </section>
  );
}

function FeatureBlock({ feature, flip, bg, dark }) {
  const textColor = dark ? 'var(--cream-100)' : 'var(--ink-900)';
  const bodyColor = dark ? 'rgba(250,245,238,0.78)' : 'var(--ink-700)';
  const bulletColor = dark ? 'rgba(250,245,238,0.88)' : 'var(--ink-800)';
  const eyebrowColor = dark ? 'var(--terracotta-300)' : undefined;
  const checkColor = dark ? 'var(--terracotta-300)' : 'var(--terracotta-500)';
  return (
    <div style={{ padding: '88px 32px', background: bg, position: 'relative', overflow: 'hidden' }}>
      {dark && (
        <div aria-hidden style={{
          position: 'absolute', top: -180, right: -140, width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(224,124,89,0.2) 0%, rgba(224,124,89,0) 70%)',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{
        maxWidth: 'var(--maxw-page)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center',
        position: 'relative',
      }}>
        <div style={{ order: flip ? 2 : 1 }}>
          <Eyebrow color={eyebrowColor}>{feature.eyebrow}</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 16, marginBottom: 20, color: textColor,
            textWrap: 'balance',
          }}>
            {feature.title}
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: bodyColor, marginBottom: 24 }}>
            {feature.body}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {feature.bullets.map(b => (
              <li key={b} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 0', fontSize: 15, color: bulletColor,
              }}>
                <i data-lucide="check" style={{ width: 18, height: 18, color: checkColor, flexShrink: 0, marginTop: 3 }}></i>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ order: flip ? 1 : 2 }}>
          {feature.mock}
        </div>
      </div>
    </div>
  );
}

window.FeatureBlocks = FeatureBlocks;
