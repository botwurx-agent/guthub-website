// ===== Button.jsx =====
// Button.jsx — primary/secondary/dark/ghost variants. Pill-shaped.

function Button({ variant = 'primary', size = 'md', as = 'button', href, children, icon, ...rest }) {
  const Tag = as === 'a' ? 'a' : 'button';
  const sz = size === 'lg' ? { padding: '18px 28px', fontSize: 17 } :
             size === 'sm' ? { padding: '10px 16px', fontSize: 14 } :
                             { padding: '14px 22px', fontSize: 15 };
  const base = {
    fontFamily: 'var(--font-body)', fontWeight: 600, borderRadius: 999,
    border: '1px solid transparent', cursor: 'pointer', lineHeight: 1,
    transition: 'all 240ms var(--ease-out)', display: 'inline-flex',
    alignItems: 'center', gap: 8, textDecoration: 'none', ...sz,
  };
  const variants = {
    primary: { background: 'var(--terracotta-400)', color: '#fff' },
    secondary: { background: 'transparent', borderColor: 'var(--ink-300)', color: 'var(--ink-900)' },
    dark: { background: 'var(--forest-500)', color: 'var(--cream-100)' },
    ghost: { background: 'transparent', color: 'var(--ink-900)' },
    inverse: { background: 'var(--cream-50)', color: 'var(--forest-600)' },
  };
  const [hover, setHover] = React.useState(false);
  const hov = hover ? {
    primary: { background: 'var(--terracotta-500)', boxShadow: 'var(--shadow-md)' },
    secondary: { background: 'var(--cream-100)', borderColor: 'var(--ink-900)' },
    dark: { background: 'var(--forest-600)', boxShadow: 'var(--shadow-md)' },
    ghost: { background: 'var(--cream-100)' },
    inverse: { background: '#fff', boxShadow: 'var(--shadow-md)' },
  }[variant] : {};
  return (
    <Tag href={href} style={{ ...base, ...variants[variant], ...hov }}
         onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...rest}>
      {children}
      {icon}
    </Tag>
  );
}

window.Button = Button;


// ===== Badge.jsx =====
// Badge.jsx — small pill labels

function Badge({ tone = 'accent', dot = false, children }) {
  const tones = {
    accent: { bg: 'var(--terracotta-50)', fg: 'var(--terracotta-700)' },
    dark: { bg: 'var(--forest-500)', fg: 'var(--cream-100)' },
    soft: { bg: 'var(--cream-200)', fg: 'var(--ink-900)' },
    outline: { bg: 'transparent', fg: 'var(--ink-700)', border: '1px solid var(--ink-300)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
      lineHeight: 1, background: t.bg, color: t.fg, border: t.border || 'none',
    }}>
      {dot && <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--forest-300)',
        animation: 'pulse 1.6s infinite',
      }} />}
      {children}
    </span>
  );
}

function Eyebrow({ children, color }) {
  return <div style={{
    fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.18em',
    textTransform: 'uppercase', fontWeight: 700,
    color: color || 'var(--terracotta-700)',
  }}>{children}</div>;
}

window.Badge = Badge;
window.Eyebrow = Eyebrow;


// ===== Header.jsx =====
// Header.jsx — sticky header with blurred cream background on scroll

function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = ['Product', 'Pricing', 'FAQ', 'About'];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(253, 250, 243, 0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 240ms var(--ease-out)',
    }}>
      <div style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="../../assets/logo-full.png" alt="GutHub" style={{ height: 32 }} />
        </a>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 16 }}>
          {navItems.map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              fontSize: 15, color: 'var(--ink-800)', textDecoration: 'none',
              fontWeight: 500, fontFamily: 'var(--font-body)',
              transition: 'color 120ms',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--terracotta-500)'}
            onMouseLeave={e => e.target.style.color = 'var(--ink-800)'}>
              {item}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#" style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ink-800)',
            textDecoration: 'none', fontFamily: 'var(--font-body)',
          }}>Sign in</a>
          <Button variant="primary" size="sm" as="a" href="#pricing">
            Join Founders — $9.95
          </Button>
        </div>
      </div>
    </header>
  );
}

window.Header = Header;


// ===== ChatAnimation.jsx =====
// ChatAnimation.jsx — animated chat UI for hero. Types and reveals messages in sequence.

function ChatAnimation() {
  const script = [
    { from: 'user', text: 'Why did dinner leave me bloated tonight?', delay: 100 },
    { from: 'ai', text: "Looking at your log — you had broccoli, beans, and a cold brew within 3 hours. That combo is a known trigger for you.", delay: 1200 },
    { from: 'ai', text: 'Try spacing high-FODMAP foods out, and skip coffee after 3pm for a week. Want me to set a reminder?', delay: 1600 },
    { from: 'user', text: 'Yes please.', delay: 800 },
    { from: 'ai', text: '✓ Reminder set. I\'ll check in tomorrow.', delay: 1200 },
  ];

  const [visible, setVisible] = React.useState(1);
  const [typing, setTyping] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const timers = [];
    const wait = (ms) => new Promise(r => {
      const t = setTimeout(r, ms);
      timers.push(t);
    });
    async function run() {
      while (!cancelled) {
        setVisible(1);
        for (let i = 1; i < script.length; i++) {
          if (cancelled) return;
          await wait(script[i].delay);
          if (cancelled) return;
          if (script[i].from === 'ai') {
            setTyping(true);
            await wait(900);
            if (cancelled) return;
            setTyping(false);
          }
          setVisible(i + 1);
        }
        await wait(5000);
      }
    }
    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  const chatUI = (
    <div style={{
      background: '#fff',
      padding: 0, overflow: 'hidden', width: '100%',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    }}>
      {/* chrome */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--cream-50)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--forest-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="../../assets/logo.png" alt="" style={{ width: 22, height: 22 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>GutHub</div>
          <div style={{ fontSize: 12, color: 'var(--forest-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest-300)' }} /> Online
          </div>
        </div>
        <i data-lucide="more-horizontal" style={{ width: 18, height: 18, color: 'var(--ink-500)' }}></i>
      </div>
      {/* messages */}
      <div style={{
        padding: '20px 18px', flex: 1,
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'var(--cream-50)',
        overflow: 'hidden',
      }}>
        {script.slice(0, visible).map((m, i) => <Bubble key={i} {...m} />)}
        {typing && <TypingBubble />}
      </div>
      {/* composer */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'center', background: '#fff',
      }}>
        <div style={{
          flex: 1, padding: '10px 14px', borderRadius: 999,
          background: 'var(--cream-100)',
          fontSize: 14, color: 'var(--ink-500)',
        }}>Ask Guthub anything…</div>
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--terracotta-400)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <i data-lucide="arrow-up" style={{ width: 18, height: 18, color: '#fff' }}></i>
        </button>
      </div>
    </div>
  );

  // iPad bezel wrapper — portrait orientation
  return (
    <div style={{
      width: '100%', maxWidth: 440,
      aspectRatio: '3 / 4.3',
      borderRadius: 44,
      padding: 16,
      background: '#1a1a1c',
      border: '2px solid #2e2e30',
      boxShadow: '0 40px 80px -20px rgba(30, 40, 35, 0.45), 0 18px 40px -12px rgba(30, 40, 35, 0.25)',
      position: 'relative',
    }}>
      {/* camera dot on top edge */}
      <div style={{
        position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: '#0a0a0a',
        border: '1px solid #3a3a3d',
      }} />
      {/* screen */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #000',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* iOS status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 22px 6px',
          fontSize: 13, fontWeight: 600, color: 'var(--ink-900)',
          background: 'var(--cream-50)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          flexShrink: 0,
        }}>
          <span>9:41</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i data-lucide="signal" style={{ width: 14, height: 14 }}></i>
            <i data-lucide="wifi" style={{ width: 14, height: 14 }}></i>
            <i data-lucide="battery-full" style={{ width: 18, height: 18 }}></i>
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {chatUI}
        </div>
      </div>
    </div>
  );
}

function Bubble({ from, text }) {
  const isAi = from === 'ai';
  return (
    <div style={{
      alignSelf: isAi ? 'flex-start' : 'flex-end',
      maxWidth: '82%',
      padding: '10px 14px',
      borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
      background: isAi ? '#fff' : 'var(--terracotta-400)',
      color: isAi ? 'var(--ink-900)' : '#fff',
      fontSize: 14, lineHeight: 1.45,
      border: isAi ? '1px solid var(--border)' : 'none',
      boxShadow: isAi ? 'var(--shadow-xs)' : 'none',
      animation: 'bubbleIn 320ms var(--ease-out)',
    }}>{text}</div>
  );
}

function TypingBubble() {
  return (
    <div style={{
      alignSelf: 'flex-start',
      padding: '12px 16px',
      borderRadius: '16px 16px 16px 4px',
      background: '#fff', border: '1px solid var(--border)',
      display: 'flex', gap: 4, animation: 'bubbleIn 200ms var(--ease-out)',
    }}>
      {[0, 1, 2].map(i => <span key={i} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--ink-400)',
        animation: `typing 1.2s ${i * 0.15}s infinite`,
      }} />)}
    </div>
  );
}

window.ChatAnimation = ChatAnimation;


// ===== Hero.jsx =====
// Hero.jsx

function Hero() {
  return (
    <section style={{
      position: 'relative',
      padding: '40px 32px 96px',
      background: 'var(--cream-50)',
      overflow: 'hidden',
    }}>
      <div style={{
        maxWidth: 'var(--maxw-wide)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80,
        alignItems: 'center',
      }}>
        <div>
          <Eyebrow>Founders Launch · 53 of 100 spots left</Eyebrow>
          <h1 style={{
            marginTop: 20, marginBottom: 56, paddingBottom: 20,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.75rem, 5.2vw, 4.25rem)',
            lineHeight: 1.32,
            letterSpacing: '-0.025em',
            fontWeight: 400,
            color: 'var(--ink-900)',
          }}>
            Nutrition guidance <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>you can actually talk to.</em>
          </h1>
          <p style={{
            fontSize: 19, lineHeight: 1.55, color: 'var(--ink-700)',
            maxWidth: 520, marginBottom: 36,
          }}>
            Your personalized AI gut health assistant — ongoing support, clarity, and real-time feedback. So you're never stuck guessing, googling, or feeling alone.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <Button variant="primary" size="lg" as="a" href="#pricing">
              Join the Founders Cohort — $9.95/mo
            </Button>
            <Button variant="secondary" size="lg" as="a" href="#how">
              See how it works
            </Button>
          </div>
          <div style={{
            display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center',
            fontSize: 14, color: 'var(--ink-600)',
          }}>
            <TrustBullet icon="lock">Locked-in lifetime pricing</TrustBullet>
            <TrustBullet icon="x-circle">Cancel anytime</TrustBullet>
            <TrustBullet icon="stethoscope">Complements professional care</TrustBullet>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ChatAnimation />
        </div>
      </div>
    </section>
  );
}

function TrustBullet({ icon, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <i data-lucide={icon} style={{ width: 15, height: 15, color: 'var(--forest-400)' }}></i>
      {children}
    </span>
  );
}

window.Hero = Hero;


// ===== ProblemSection.jsx =====
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
        <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, margin: '0 auto 64px' }}>
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
        </div>
        <div style={{
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}>
          {questions.map((it, i) => <QuestionCard key={i} {...it} />)}
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


// ===== FeaturesSection.jsx =====
// FeaturesSection.jsx — 3 product-feature rows with animated UI mockups

function FeaturesSection() {
  return (
    <section style={{ padding: '96px 32px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72, maxWidth: 720, margin: '0 auto 72px' }}>
          <Eyebrow>What you get</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em',
            fontWeight: 400, marginTop: 20,
            color: 'var(--ink-900)',
          }}>
            Everything you need, <em style={{ fontStyle: 'italic' }}>all in one place.</em>
          </h2>
        </div>

        <Row
          eyebrow="Snap & know"
          title="Take a photo of your meal. Get macros in seconds."
          body="No more guessing portions or hunting through food databases. Guthub identifies ingredients, estimates calories, protein, carbs, and fat — and flags anything that could trigger your symptoms."
          bullets={[
            'Recognizes most meals instantly — including home-cooked dishes',
            'Shows macros and gut-health flags side by side',
            'Saves to your daily log automatically',
          ]}
          visual={<PhotoMacroVisual />}
        />
        <Row
          reverse
          eyebrow="AI meal planner"
          title="Meals built around the way you actually eat."
          body="Tell Guthub your diet — low-FODMAP, gluten-free, vegetarian, whatever works for your body — and it generates a week of meals you'll actually want to make, with macros and grocery list included."
          bullets={[
            'Adapts to your dietary preferences and restrictions',
            'Swap any meal with one tap — the plan rebalances itself',
            'Exports a grocery list, grouped by aisle',
          ]}
          visual={<MealPlannerVisual />}
        />
        <Row
          last
          eyebrow="Goal tracker"
          title="Watch your progress, day by day."
          body="Set a goal weight and daily macro targets. Log meals manually or via photo, and Guthub gives you visual progress, gentle nudges, and feedback when you're drifting off track."
          bullets={[
            'Set a goal weight — Guthub calculates daily targets',
            'Visual rings show protein, carbs, and fat progress',
            'Weekly check-ins with feedback on what\'s working',
          ]}
          visual={<GoalTrackerVisual />}
        />
      </div>
    </section>
  );
}

function Row({ eyebrow, title, body, bullets, visual, reverse, last }) {
  return (
    <div style={{
      display: 'grid', gap: 72, alignItems: 'center',
      gridTemplateColumns: '1fr 1fr',
      marginBottom: last ? 0 : 96,
      paddingBottom: last ? 0 : 96,
      borderBottom: last ? 'none' : '1px solid var(--ink-200)',
      direction: reverse ? 'rtl' : 'ltr',
    }}>
      <div style={{ direction: 'ltr' }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1.22,
          letterSpacing: '-0.012em', fontWeight: 400,
          marginTop: 16, marginBottom: 24, color: 'var(--ink-900)',
          textWrap: 'balance',
        }}>{title}</h3>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ink-700)', marginBottom: bullets ? 20 : 0 }}>{body}</p>
        {bullets && (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(t => (
              <li key={t} style={{ display: 'flex', gap: 10, fontSize: 16, color: 'var(--ink-800)', lineHeight: 1.5 }}>
                <i data-lucide="check" style={{ width: 18, height: 18, color: 'var(--forest-400)', flexShrink: 0, marginTop: 4 }}></i>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'center' }}>{visual}</div>
    </div>
  );
}

// ============ VISUAL 1: Photo macros (inlined from PhotoMacros) ============
function PhotoMacroVisual() {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    let id;
    function tick() {
      setPhase(p => {
        const next = (p + 1) % 4;
        id = setTimeout(tick, next === 0 ? 1800 : next === 2 ? 1600 : 2400);
        return next;
      });
    }
    id = setTimeout(tick, 1800);
    return () => clearTimeout(id);
  }, []);
  return <PhoneMockup phase={phase} />;
}

function PhoneMockup({ phase }) {
  return (
    <div style={{
      width: 300, height: 600, borderRadius: 44,
      background: 'var(--ink-900)', padding: 10,
      boxShadow: 'var(--shadow-xl)', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 26, borderRadius: 14, background: '#000', zIndex: 3,
      }} />
      <div style={{
        width: '100%', height: '100%', borderRadius: 36,
        background: 'var(--cream-50)', overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          height: 42, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '0 20px 6px', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)',
          fontFamily: 'var(--font-body)', flexShrink: 0,
        }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <i data-lucide="wifi" style={{ width: 14, height: 14 }}></i>
            <i data-lucide="battery-full" style={{ width: 18, height: 14 }}></i>
          </span>
        </div>
        <div style={{
          padding: '10px 18px 12px', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--ink-100)', flexShrink: 0,
        }}>
          <i data-lucide="camera" style={{ width: 18, height: 18, color: 'var(--terracotta-500)' }}></i>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>Log a meal</div>
        </div>
        <div style={{ flex: 1, position: 'relative', background: 'var(--cream-100)' }}>
          {/* phase 0: camera prompt */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
            opacity: phase === 0 ? 1 : 0, transition: 'opacity 400ms',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--terracotta-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 1.8s infinite',
            }}>
              <i data-lucide="camera" style={{ width: 32, height: 32, color: '#fff' }}></i>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>Tap to snap your meal</div>
          </div>
          {/* phase 1+: photo */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: phase >= 1 ? 1 : 0, transition: 'opacity 400ms',
          }}>
            <div style={{
              position: 'absolute', inset: 16, borderRadius: 18, overflow: 'hidden',
              background: 'linear-gradient(135deg, #C9A96B 0%, #8B6F3A 100%)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,.25)',
            }}>
              <div style={{
                position: 'absolute', inset: '18% 14%', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #F5EEDF 0%, #E8D9BC 55%, #B8A47B 100%)',
                boxShadow: '0 8px 24px rgba(0,0,0,.3), inset -12px -12px 20px rgba(0,0,0,.15)',
              }}>
                <div style={{
                  position: 'absolute', inset: '14%', borderRadius: '50%',
                  background: `
                    radial-gradient(circle at 30% 35%, #7FB77E 0 18%, transparent 20%),
                    radial-gradient(circle at 65% 28%, #E87A6B 0 14%, transparent 17%),
                    radial-gradient(circle at 45% 65%, #F2C94C 0 16%, transparent 19%),
                    radial-gradient(circle at 72% 70%, #6FB8A8 0 15%, transparent 18%),
                    radial-gradient(circle at 20% 72%, #D97757 0 12%, transparent 15%),
                    radial-gradient(circle at 55% 48%, #B8E0A0 0 14%, transparent 17%),
                    #3F6A4A
                  `,
                }} />
              </div>
              {phase === 2 && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, transparent, var(--terracotta-300), transparent)',
                  boxShadow: '0 0 20px var(--terracotta-400)',
                  animation: 'scanMove 1.5s ease-in-out infinite',
                }} />
              )}
              {phase >= 2 && [
                { x: 38, y: 42 }, { x: 66, y: 36 }, { x: 48, y: 68 },
              ].map((d, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${d.x}%`, top: `${d.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: `popIn 400ms ${i * 180}ms var(--ease-out) both`,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2px solid #fff', background: 'rgba(219,111,86,.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                  }} />
                </div>
              ))}
            </div>
            {phase === 2 && (
              <div style={{
                position: 'absolute', bottom: 16, left: 16, right: 16,
                background: 'rgba(27,26,23,.85)', borderRadius: 14, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 13,
              }}>
                <i data-lucide="sparkles" style={{ width: 16, height: 16, color: 'var(--terracotta-300)' }}></i>
                Analyzing your meal…
                <span style={{ display: 'inline-flex', gap: 3, marginLeft: 'auto' }}>
                  {[0,1,2].map(i => <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#fff',
                    animation: `typing 1.2s ${i * 0.15}s infinite`,
                  }} />)}
                </span>
              </div>
            )}
          </div>
          {phase === 3 && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12, right: 12,
              background: '#fff', borderRadius: 18,
              border: '1px solid var(--border)', padding: 16,
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideUp 400ms var(--ease-out)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>
                Salmon & greens bowl
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 12 }}>
                482 kcal · estimated
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                <MacroPill n="38g" label="Protein" tone="terracotta" />
                <MacroPill n="42g" label="Carbs"   tone="forest" />
                <MacroPill n="18g" label="Fat"     tone="yellow" />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8,
                background: 'var(--forest-50)',
                fontSize: 11, color: 'var(--forest-400)', fontWeight: 600,
              }}>
                <i data-lucide="shield-check" style={{ width: 13, height: 13 }}></i>
                Low-FODMAP · good for your gut today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroPill({ n, label, tone }) {
  const tones = {
    terracotta: { bg: 'var(--terracotta-50)', fg: 'var(--terracotta-700)' },
    forest:     { bg: 'var(--forest-50)',     fg: 'var(--forest-400)' },
    yellow:     { bg: '#FDF4D9',              fg: '#8A6B14' },
  };
  const t = tones[tone];
  return (
    <div style={{
      background: t.bg, color: t.fg,
      padding: '8px 6px', borderRadius: 10, textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ============ VISUAL 2: Meal Planner ============
function MealPlannerVisual() {
  const [activeTab, setActiveTab] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setActiveTab(t => (t + 1) % 3), 2600);
    return () => clearInterval(id);
  }, []);
  const tabs = ['Low-FODMAP', 'Mediterranean', 'High-protein'];
  const plans = [
    [
      { day: 'Mon', meal: 'Oat bowl + banana', kcal: 420, tag: 'Low FODMAP' },
      { day: 'Tue', meal: 'Grilled chicken rice', kcal: 580, tag: 'Low FODMAP' },
      { day: 'Wed', meal: 'Salmon + greens', kcal: 540, tag: 'Low FODMAP' },
      { day: 'Thu', meal: 'Turkey lettuce wraps', kcal: 460, tag: 'Low FODMAP' },
    ],
    [
      { day: 'Mon', meal: 'Greek yogurt + walnuts', kcal: 380, tag: 'Mediterranean' },
      { day: 'Tue', meal: 'Tuna farro bowl', kcal: 560, tag: 'Mediterranean' },
      { day: 'Wed', meal: 'Chickpea + feta salad', kcal: 490, tag: 'Mediterranean' },
      { day: 'Thu', meal: 'Baked cod + lemon', kcal: 440, tag: 'Mediterranean' },
    ],
    [
      { day: 'Mon', meal: 'Egg scramble + avocado', kcal: 520, tag: '42g protein' },
      { day: 'Tue', meal: 'Steak fajita bowl', kcal: 640, tag: '48g protein' },
      { day: 'Wed', meal: 'Chicken + sweet potato', kcal: 580, tag: '45g protein' },
      { day: 'Thu', meal: 'Cottage cheese bowl', kcal: 410, tag: '38g protein' },
    ],
  ];
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
      padding: 22, width: 380, fontFamily: 'var(--font-body)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--terracotta-700)' }}>Your plan</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', marginTop: 2 }}>This week</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: 'var(--forest-50)',
          borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--forest-400)',
        }}>
          <i data-lucide="sparkles" style={{ width: 12, height: 12 }}></i>
          AI-generated
        </div>
      </div>

      {/* diet tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14,
        padding: 4, background: 'var(--cream-100)', borderRadius: 10,
      }}>
        {tabs.map((t, i) => (
          <div key={t} style={{
            flex: 1, textAlign: 'center',
            padding: '6px 8px', borderRadius: 7,
            fontSize: 11, fontWeight: 600,
            background: activeTab === i ? '#fff' : 'transparent',
            color: activeTab === i ? 'var(--ink-900)' : 'var(--ink-500)',
            boxShadow: activeTab === i ? 'var(--shadow-xs)' : 'none',
            transition: 'all 300ms',
            cursor: 'default',
          }}>{t}</div>
        ))}
      </div>

      {/* meals */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {plans[activeTab].map((m, i) => (
          <div key={activeTab + '-' + i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderTop: i ? '1px solid var(--ink-100)' : 'none',
            animation: `bubbleIn 300ms ${i * 60}ms both`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--cream-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 10, fontWeight: 700,
              color: 'var(--ink-700)', letterSpacing: '0.04em',
            }}>{m.day.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-900)', lineHeight: 1.3 }}>{m.meal}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{m.kcal} kcal · {m.tag}</div>
            </div>
            <i data-lucide="refresh-cw" style={{ width: 14, height: 14, color: 'var(--ink-400)' }}></i>
          </div>
        ))}
      </div>

      {/* footer */}
      <div style={{
        marginTop: 14, paddingTop: 14,
        borderTop: '1px solid var(--ink-100)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'var(--ink-600)',
      }}>
        <i data-lucide="shopping-basket" style={{ width: 14, height: 14, color: 'var(--forest-400)' }}></i>
        Grocery list ready · 18 items
      </div>
    </div>
  );
}

// ============ VISUAL 3: Goal Tracker ============
function GoalTrackerVisual() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 1200);
    return () => clearInterval(id);
  }, []);
  // progress scales up from 0 to final over steps
  const targets = { protein: 138, carbs: 210, fat: 72 };
  const current = { protein: 94, carbs: 156, fat: 48 };
  const scale = Math.min(1, (step + 1) / 4);
  const p = {
    protein: (current.protein / targets.protein) * scale,
    carbs:   (current.carbs   / targets.carbs)   * scale,
    fat:     (current.fat     / targets.fat)     * scale,
  };

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
      padding: 24, width: 380, fontFamily: 'var(--font-body)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--terracotta-700)' }}>Today</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-900)', marginTop: 2 }}>Goal progress</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>Goal weight</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest-400)' }}>148 lb</div>
        </div>
      </div>

      {/* macro rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <Ring label="Protein" current={current.protein} target={targets.protein} pct={p.protein} color="var(--terracotta-400)" />
        <Ring label="Carbs"   current={current.carbs}   target={targets.carbs}   pct={p.carbs}   color="var(--forest-400)" />
        <Ring label="Fat"     current={current.fat}     target={targets.fat}     pct={p.fat}     color="#D4A53A" />
      </div>

      {/* weight trend */}
      <div style={{
        padding: 12, background: 'var(--cream-50)',
        borderRadius: 12, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>Weight · 4 weeks</div>
          <div style={{ fontSize: 11, color: 'var(--forest-400)', fontWeight: 600 }}>−3.2 lb</div>
        </div>
        <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {[62, 58, 60, 54, 52, 48, 50, 42].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`,
              background: 'var(--forest-300)', borderRadius: 3,
              opacity: 0.4 + (i / 8) * 0.6,
              animation: `barGrow 600ms ${i * 60}ms var(--ease-out) both`,
            }} />
          ))}
        </div>
      </div>

      {/* feedback line */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 12px', background: 'var(--forest-50)',
        borderRadius: 10, fontSize: 12, color: 'var(--forest-400)', lineHeight: 1.45,
      }}>
        <i data-lucide="trending-up" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}></i>
        <div>You're on pace to hit your goal in <strong style={{ fontWeight: 700 }}>6 weeks</strong>. Protein is 44g short — add a snack.</div>
      </div>
    </div>
  );
}

function Ring({ label, current, target, pct, color }) {
  const size = 68;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, pct);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="var(--ink-100)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - clamped)}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 500ms var(--ease-out)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, color: 'var(--ink-900)', lineHeight: 1 }}>{current}</div>
          <div style={{ fontSize: 9, color: 'var(--ink-500)', marginTop: 2 }}>/ {target}g</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-700)', marginTop: 6, letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}

window.FeaturesSection = FeaturesSection;


// ===== HowItWorks.jsx =====
// HowItWorks.jsx — soft terracotta wash for warm energy

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Share your intake', b: 'Tell us about your diet, symptoms, lifestyle, and goals. Takes about 4 minutes.' },
    { n: '02', t: 'Start the conversation', b: 'Ask questions, explore patterns, and get guidance that evolves with you.' },
    { n: '03', t: 'Build clarity over time', b: 'The more you use Guthub, the more personalized — and more useful — it becomes.' },
  ];
  return (
    <section id="how" style={{
      padding: '112px 32px',
      background: 'var(--terracotta-50)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>How it works</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, color: 'var(--ink-900)',
          }}>
            Built to <em style={{ fontStyle: 'italic' }}>support you</em>, not overwhelm you.
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--terracotta-100)', padding: 32,
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 52, fontWeight: 400, color: 'var(--terracotta-400)',
                letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1,
                fontStyle: 'italic',
              }}>{s.n}</div>
              <h4 style={{
                fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500,
                color: 'var(--ink-900)', marginTop: 0, marginBottom: 10, lineHeight: 1.25,
              }}>{s.t}</h4>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-600)', margin: 0 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.HowItWorks = HowItWorks;


// ===== Pricing.jsx =====
// Pricing.jsx — Founders Cohort

function Pricing() {
  return (
    <section id="pricing" style={{
      padding: '96px 32px', background: 'var(--forest-500)', color: 'var(--cream-100)',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <Eyebrow color="var(--terracotta-300)">Founders Launch</Eyebrow>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
          marginTop: 20, marginBottom: 20, color: 'var(--cream-100)',
        }}>
          Founders get lifetime access at the <em style={{ fontStyle: 'italic' }}>lowest price we'll ever offer.</em>
        </h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(250,245,238,.72)', marginBottom: 48 }}>
          We're opening Guthub.ai to a small founding cohort to help shape the platform. Limited to the first 100 members.
        </p>

        <div style={{
          background: 'var(--cream-50)', color: 'var(--ink-900)',
          borderRadius: 'var(--radius-2xl)', padding: 40,
          boxShadow: 'var(--shadow-xl)', textAlign: 'left',
          maxWidth: 520, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Badge tone="accent">Locked in for life</Badge>
            <Badge tone="soft">47 joined this week</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 400,
              color: 'var(--ink-900)', letterSpacing: '-0.025em', lineHeight: 1,
            }}>$9.95</span>
            <span style={{ fontSize: 17, color: 'var(--ink-600)' }}>/month</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', marginBottom: 28, textDecoration: 'line-through' }}>
            Regular price $19.95/month after founding period
          </div>

          {[
            'Direct influence on the roadmap',
            'Priority access to new features',
            'Early support as the platform evolves',
            '30-day money-back guarantee',
          ].map(f => (
            <div key={f} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--ink-100)' }}>
              <i data-lucide="check" style={{ width: 20, height: 20, color: 'var(--forest-400)', flexShrink: 0, marginTop: 2 }}></i>
              <div style={{ fontSize: 16, color: 'var(--ink-800)' }}>{f}</div>
            </div>
          ))}

          <div style={{ marginTop: 28 }}>
            <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
              Become a Founding Member
            </Button>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center' }}>
            Cancel anytime · Secure checkout · No credit card saved after cancellation
          </div>
        </div>
      </div>
    </section>
  );
}

window.Pricing = Pricing;


// ===== Testimonials.jsx =====
// Testimonials.jsx

function Testimonials() {
  const items = [
    {
      name: 'Sarah M.', role: 'Marketing Manager, 52',
      initials: 'SM',
      q: "I stopped googling at 11pm. Now I just ask Guthub, and I actually get a straight answer that makes sense for my body.",
    },
    {
      name: 'James T.', role: 'Retired Firefighter, 67',
      initials: 'JT',
      q: "I was skeptical of another app. But this one asks good questions back — it feels like it's thinking alongside me.",
    },
    {
      name: 'Emily R.', role: 'Teacher, 44',
      initials: 'ER',
      q: "The pattern it spotted between my coffee and my sleep saved me months of trial and error. That alone paid for the year.",
    },
  ];
  return (
    <section style={{ padding: '112px 32px', background: '#FFFFFF' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>What members say</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, color: 'var(--ink-900)',
          }}>
            Real people, <em style={{ fontStyle: 'italic' }}>real relief.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {items.map(t => (
            <div key={t.name} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', padding: 32,
              boxShadow: 'var(--shadow-xs)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                {[0,1,2,3,4].map(i => (
                  <i key={i} data-lucide="star" style={{ width: 16, height: 16, color: 'var(--terracotta-400)', fill: 'var(--terracotta-400)' }}></i>
                ))}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.4,
                color: 'var(--ink-900)', fontWeight: 400, flex: 1, marginBottom: 24,
              }}>"{t.q}"</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--terracotta-100)', color: 'var(--terracotta-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)',
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Testimonials = Testimonials;


// ===== FAQ.jsx =====
// FAQ.jsx

function FAQ() {
  const items = [
    { q: 'How does Guthub AI work?', a: 'You share context about your diet, symptoms, and goals. Guthub then holds ongoing conversations with you — answering questions, spotting patterns, and adapting as you learn more about your body.' },
    { q: 'Is my data secure?', a: 'Yes. Your health data is encrypted at rest and in transit, never sold, and never used to train public models. You can delete everything at any time.' },
    { q: 'Can Guthub replace my doctor?', a: 'No — and it\'s not designed to. Guthub complements your professional care by giving you grounded guidance between appointments. For diagnosis, medication, and acute issues, always see a clinician.' },
    { q: 'How often should I use it?', a: 'As often as a question comes up. Most members chat 2–5 times a week, but there\'s no minimum. The more context you share, the more helpful Guthub becomes.' },
    { q: 'What happens after the founding period?', a: 'Regular pricing is $19.95/month. If you join the Founders Cohort, your $9.95/month rate is locked in for life — as long as your subscription stays active.' },
    { q: 'Can I cancel?', a: 'Any time, from your account page. No calls, no friction. 30-day money-back guarantee on your first month.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section id="faq" style={{ padding: '96px 32px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.22, letterSpacing: '-0.015em', fontWeight: 400,
            marginTop: 20, color: 'var(--ink-900)',
          }}>
            Questions, <em style={{ fontStyle: 'italic' }}>answered.</em>
          </h2>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={i} style={{ borderTop: i ? '1px solid var(--ink-100)' : 'none' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: '100%', padding: '22px 28px', background: 'transparent', border: 'none',
                textAlign: 'left', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500,
                color: 'var(--ink-900)',
              }}>
                {it.q}
                <i data-lucide={open === i ? 'minus' : 'plus'}
                   style={{ width: 20, height: 20, color: 'var(--terracotta-500)', flexShrink: 0 }}></i>
              </button>
              {open === i && (
                <div style={{
                  padding: '0 28px 24px', fontSize: 16, lineHeight: 1.6,
                  color: 'var(--ink-700)', maxWidth: '68ch',
                }}>{it.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.FAQ = FAQ;


// ===== FinalCTA.jsx =====
// FinalCTA.jsx — full-bleed terracotta for conversion climax

function FinalCTA() {
  return (
    <section style={{
      padding: '112px 32px',
      background: 'var(--terracotta-400)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* decorative soft sun */}
      <div style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,220,200,.35) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
          lineHeight: 1.18, letterSpacing: '-0.022em', fontWeight: 400,
          color: 'var(--cream-50)', marginBottom: 20, marginTop: 0,
        }}>
          Take the guesswork out of your gut.
        </h2>
        <p style={{ fontSize: 19, color: 'rgba(253,250,243,.88)', marginBottom: 36, lineHeight: 1.55 }}>
          Join 1,000+ people rebuilding their relationship with food — with guidance that actually knows them.
        </p>
        <Button variant="inverse" size="lg" as="a" href="#pricing">
          Join the Founders Cohort — $9.95/mo
        </Button>
        <div style={{ marginTop: 18, fontSize: 14, color: 'rgba(253,250,243,.75)' }}>
          Locked-in lifetime pricing · Cancel anytime · 30-day money-back
        </div>
      </div>
    </section>
  );
}

window.FinalCTA = FinalCTA;


// ===== Footer.jsx =====
// Footer.jsx

function Footer() {
  const cols = [
    { h: 'Product', links: ['How it works', 'Pricing', 'FAQ', 'Access App'] },
    { h: 'Company', links: ['About', 'Press', 'Careers', 'Contact'] },
    { h: 'Legal', links: ['Terms', 'Privacy', 'Cookie Policy', 'Data & security'] },
  ];
  return (
    <footer style={{
      background: 'var(--forest-500)', color: 'var(--cream-100)',
      padding: '72px 32px 32px',
    }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40,
          paddingBottom: 48, borderBottom: '1px solid rgba(250,245,238,.16)',
        }}>
          <div>
            <img src="../../assets/logo-full.png" alt="GutHub"
                 style={{ height: 38, filter: 'brightness(0) invert(1)', marginBottom: 20 }} />
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(250,245,238,.72)', maxWidth: 300 }}>
              Personalized AI gut-health guidance for your family's wellbeing.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <div style={{
                fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 700, color: 'var(--terracotta-300)', marginBottom: 16,
              }}>{c.h}</div>
              {c.links.map(l => (
                <a key={l} href="#" style={{
                  display: 'block', padding: '6px 0', fontSize: 15,
                  color: 'rgba(250,245,238,.88)', textDecoration: 'none',
                }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 28, display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, alignItems: 'center',
          fontSize: 13, color: 'rgba(250,245,238,.55)',
        }}>
          <div>© 2026 Guthub. Designed to complement professional care.</div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['twitter','instagram','linkedin','facebook'].map(s => (
              <a key={s} href="#" style={{ color: 'rgba(250,245,238,.72)' }}>
                <i data-lucide={s} style={{ width: 18, height: 18 }}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;


