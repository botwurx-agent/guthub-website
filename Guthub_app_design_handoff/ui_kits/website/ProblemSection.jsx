// ProblemSection.jsx — "Because health questions don't wait"
// DARK section for contrast against cream above/below.

function ProblemSection() {
  const questions = [
    { icon: 'activity', q: "Is this reaction normal?" },
    { icon: 'utensils', q: "Why did this meal make me bloated?" },
    { icon: 'target', q: "Should I adjust my macros today?" },
    { icon: 'flask-conical', q: "What does this lab result mean?" },
  ];

  return (
    <section style={{
      padding: '112px 32px',
      background: 'var(--forest-500)',
      color: 'var(--cream-100)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, margin: '0 auto 64px' }}>
          <Eyebrow color="var(--terracotta-300)">The Reality</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em',
            fontWeight: 400, marginTop: 20, marginBottom: 20,
            color: 'var(--cream-50)',
          }}>
            Because health questions <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>don't wait.</em>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'rgba(250,245,238,.72)' }}>
            Gut health isn't linear. Symptoms shift. Context matters. Questions come up daily — usually at 11pm, when no doctor is available.
          </p>
        </Reveal>
        <div style={{
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}>
          {questions.map((it, i) => (
            <Reveal key={i} delay={i * 80} y={14}>
              <QuestionCard {...it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionCard({ icon, q }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'rgba(250,245,238,.06)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(250,245,238,.14)',
        padding: 24,
        backdropFilter: 'blur(6px)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 240ms var(--ease-out)',
        background: hover ? 'rgba(250,245,238,.1)' : 'rgba(250,245,238,.06)',
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--terracotta-400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <i data-lucide={icon} style={{ width: 22, height: 22, color: '#fff' }}></i>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.35,
        color: 'var(--cream-50)', fontWeight: 400,
      }}>"{q}"</div>
    </div>
  );
}

window.ProblemSection = ProblemSection;
