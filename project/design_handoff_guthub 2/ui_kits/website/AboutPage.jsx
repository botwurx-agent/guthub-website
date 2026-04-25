// AboutPage.jsx — Meet the founder, why Guthub exists, beliefs

function AboutPage() {
  React.useEffect(() => {
    const id = setInterval(() => {
      if (!window.lucide) return;
      const pending = document.querySelectorAll('[data-lucide]');
      if (pending.length) window.lucide.createIcons();
    }, 300);
    return () => clearInterval(id);
  }, []);
  return (
    <div data-screen-label="GutHub About">
      <Header />
      <AboutHero />
      <FounderStory />
      <WhyGuthub />
      <Beliefs />
      <NotThat />
      <LeadAdvisor />
      <WhatsNext />
      <FinalCTA />
      <Footer />
      <AuthModal />
    </div>
  );
}

function AboutHero() {
  return (
    <section style={{
      padding: '96px 32px 48px', background: 'var(--cream-50)', textAlign: 'center',
    }}>
      <Reveal as="div" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Eyebrow>About Guthub</Eyebrow>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5.2vw, 4rem)',
          lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400,
          marginTop: 20, marginBottom: 24, color: 'var(--ink-900)',
          textWrap: 'balance',
        }}>
          Built by someone who <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>needed it too.</em>
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: 620, margin: '0 auto' }}>
          Instead of waiting weeks for a nutritionist, dietician, or health coach — Guthub is always there. Any question. Any time of day.
        </p>
      </Reveal>
    </section>
  );
}

function FounderStory() {
  return (
    <section style={{
      padding: '80px 32px',
      background: 'var(--cream-100)',
      position: 'relative',
    }}>
      <div style={{
        maxWidth: 'var(--maxw-page)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 72, alignItems: 'center',
      }}>
        <Reveal style={{ position: 'relative' }} y={20} duration={900}>
          {/* warm paper frame around the photo */}
          <div style={{
            position: 'absolute', inset: -18,
            background: 'var(--cream-50)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-md)',
            transform: 'rotate(-1.2deg)',
          }} />
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 8,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <img
              src="../../assets/founder-family.png"
              alt="Steve Nazari with his family in Los Angeles"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
          <div style={{
            position: 'relative', marginTop: 20, textAlign: 'center',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 14, color: 'var(--ink-600)',
          }}>
            Steve and family · Los Angeles, CA
          </div>
        </Reveal>
        <Reveal delay={150} y={20}>
          <Eyebrow>Founder · Steve Nazari</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.875rem, 3vw, 2.5rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 18, marginBottom: 24, color: 'var(--ink-900)',
            textWrap: 'balance',
          }}>
            The gap I couldn't stop hearing.
          </h2>
          <div style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-700)' }}>
            <p style={{ marginTop: 0 }}>
              Born and raised in Los Angeles. Twelve years on the Jiu Jitsu mat. Brown belt. Health, nutrition, and athletics have been wound together my whole life — trying to figure out the right things to eat, especially as I got older.
            </p>
            <p>
              My wife is a gut-health nutritionist. For years I'd hear her on calls with clients in the next room — people desperate for answers. Sometimes the question was simple. Sometimes complicated. But mostly, people just needed <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>someone to talk to</em>. Someone to ask. Someone to point them in the right direction.
            </p>
            <p>
              I could relate. There have been plenty of times I felt lost — following a specific diet, trying to fix a particular issue, not knowing what to eat. And the help you need doesn't come on your schedule. It comes at 11pm when you're standing in front of the fridge.
            </p>
            <p style={{ marginBottom: 0 }}>
              Guthub is my answer to that gap. Someone — anyone — with a helping hand, any time of the day.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhyGuthub() {
  return (
    <section style={{
      padding: '96px 32px', background: 'var(--forest-500)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', top: -150, left: -100, width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(224,124,89,0.18) 0%, rgba(224,124,89,0) 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: -150, right: -100, width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(224,124,89,0.12) 0%, rgba(224,124,89,0) 70%)',
        pointerEvents: 'none',
      }} />
      <Reveal style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }} duration={900}>
        <i data-lucide="quote" style={{ width: 42, height: 42, color: 'var(--terracotta-300)', marginBottom: 16 }}></i>
        <blockquote style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.625rem, 3vw, 2.5rem)',
          lineHeight: 1.3, letterSpacing: '-0.015em', fontWeight: 400,
          color: 'var(--cream-50)', margin: '0 0 28px', textWrap: 'balance',
        }}>
          People don't need more information. They need <em style={{ fontStyle: 'italic', color: 'var(--terracotta-300)' }}>someone to talk to</em> — who actually knows them.
        </blockquote>
        <div style={{ fontSize: 14, color: 'rgba(250,245,238,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          — The founding idea
        </div>
      </Reveal>
    </section>
  );
}

function BeliefCard({ it }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '32px 32px 36px',
        background: 'var(--bg-elev)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-xs)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 320ms var(--ease-out)',
        height: '100%',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: hover ? 'var(--terracotta-200)' : 'var(--terracotta-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        transition: 'background 320ms var(--ease-out), transform 320ms var(--ease-out)',
        transform: hover ? 'scale(1.05)' : 'scale(1)',
      }}>
        <i data-lucide={it.icon} style={{ width: 22, height: 22, color: 'var(--terracotta-500)' }}></i>
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
        lineHeight: 1.28, letterSpacing: '-0.01em',
        margin: '0 0 12px', color: 'var(--ink-900)',
      }}>
        {it.title}
      </h3>
      <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-700)', margin: 0 }}>
        {it.body}
      </p>
    </div>
  );
}

function Beliefs() {
  const items = [
    {
      icon: 'message-circle-heart',
      title: 'Sometimes you just need someone to talk to.',
      body: 'Access shouldn\u2019t depend on calendars, copays, or business hours. Real support is the support you can reach when you need it.',
    },
    {
      icon: 'fingerprint',
      title: 'The answer isn\u2019t always complicated — but it has to be yours.',
      body: 'Generic advice doesn\u2019t fit a real body. Guthub learns your sensitivities, goals, and habits, and speaks to the life you actually live.',
    },
    {
      icon: 'calendar-heart',
      title: 'Health is a daily conversation, not a one-time diagnosis.',
      body: 'The body keeps changing. The questions keep coming. We show up every day — the morning bloat, the 3pm crash, the late-night label.',
    },
    {
      icon: 'heart-handshake',
      title: 'We\u2019re here to help — and that\u2019s the whole point.',
      body: 'Knowing we helped someone get unstuck is the reason this exists. Every product decision starts and ends there.',
    },
  ];
  return (
    <section style={{ padding: '104px 32px', background: 'var(--terracotta-50)' }}>
      <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
          <Eyebrow>What we believe</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.4vw, 2.75rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 16, marginBottom: 0, color: 'var(--ink-900)',
            textWrap: 'balance',
          }}>
            Four ideas that shape every feature we build.
          </h2>
        </Reveal>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
        }}>
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 90}>
              <BeliefCard it={it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotThat() {
  const nots = ['A fad diet', 'A calorie counter', 'A generic chatbot', 'A substitute for medical care'];
  return (
    <section style={{ padding: '88px 32px', background: 'var(--cream-100)' }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center',
      }}>
        <Reveal>
          <Eyebrow>What Guthub is not</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 16, marginBottom: 16, color: 'var(--ink-900)', textWrap: 'balance',
          }}>
            Not any of these things.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)', margin: 0 }}>
            Guthub is a customized guidance tool — a nutritionist and health coach in your pocket. It doesn't prescribe, it doesn't diagnose, it doesn't push a diet. It listens, learns, and gives you clarity.
          </p>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nots.map((n, i) => (
            <Reveal key={i} delay={100 + i * 80} y={10}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', background: 'var(--bg-elev)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                fontSize: 16, color: 'var(--ink-800)', fontFamily: 'var(--font-body)',
                fontWeight: 500,
                textDecoration: 'line-through',
                textDecorationColor: 'var(--terracotta-400)',
                textDecorationThickness: 2,
              }}>
                <i data-lucide="x" style={{ width: 18, height: 18, color: 'var(--terracotta-500)', flexShrink: 0 }}></i>
                {n}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadAdvisor() {
  const [igHover, setIgHover] = React.useState(false);
  return (
    <section style={{ padding: '96px 32px', background: 'var(--cream-50)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>Lead advisor</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.4vw, 2.75rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
            marginTop: 16, marginBottom: 14, color: 'var(--ink-900)', textWrap: 'balance',
          }}>
            Grounded in real clinical practice.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-700)', maxWidth: 600, margin: '0 auto' }}>
            Every response Guthub gives is shaped by evidence and by the real questions real people ask. That depth comes from working closely with a clinician who lives in this world every day.
          </p>
        </Reveal>

        <Reveal delay={120} y={24} style={{
          display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48, alignItems: 'center',
          padding: 32, background: 'var(--bg-elev)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            aspectRatio: '1', borderRadius: '50%',
            background: 'var(--cream-200)',
            border: '3px solid var(--cream-50)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <img
              src="../../assets/advisor.png"
              alt="Alina Nazari"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 22%' }}
            />
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--terracotta-600)',
              marginBottom: 10,
            }}>
              Lead Advisor
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400,
              color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Alina Nazari
            </div>
            <div style={{
              fontSize: 14, color: 'var(--terracotta-500)', fontWeight: 600,
              letterSpacing: '0.04em', marginBottom: 18,
            }}>
              Gut-health nutritionist · Founder of GoHappyBelly
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-700)', margin: '0 0 16px' }}>
              Alina is a practicing gut-health nutritionist who works one-on-one with clients every day. She founded <strong style={{ color: 'var(--ink-900)' }}>GoHappyBelly</strong> and previously served as COO at Ben Azadi's Keto Kamp and Fat Loss Academy.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-700)', margin: 0 }}>
              Her clinical lens keeps Guthub grounded: the tool only says things a thoughtful nutritionist would actually say.
            </p>
            <a
              href="https://www.instagram.com/gohappybelly/"
              target="_blank"
              rel="noopener"
              onMouseEnter={() => setIgHover(true)}
              onMouseLeave={() => setIgHover(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 20, fontSize: 14, fontWeight: 600,
                color: 'var(--terracotta-500)', textDecoration: 'none',
                transform: igHover ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 240ms var(--ease-out)',
              }}
            >
              <i data-lucide="instagram" style={{ width: 16, height: 16 }}></i>
              @gohappybelly
              <i data-lucide="arrow-up-right" style={{ width: 14, height: 14 }}></i>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhatsNext() {
  return (
    <section style={{ padding: '88px 32px', background: 'var(--cream-100)' }}>
      <Reveal style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <Eyebrow>What's next</Eyebrow>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.875rem, 3vw, 2.75rem)',
          lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
          marginTop: 16, marginBottom: 20, color: 'var(--ink-900)', textWrap: 'balance',
        }}>
          We build this <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>with</em> our members.
        </h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ink-700)', margin: '0 0 28px' }}>
          Lab analysis, meal scanners, check-ins, community — the roadmap is long. The more members we have, the faster we bring it to life. Every feature on the horizon starts as a real question from a real user.
        </p>
        <a href="features.html#coming-soon" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 15, fontWeight: 600, color: 'var(--terracotta-500)',
          textDecoration: 'none',
        }}>
          See what's coming next
          <i data-lucide="arrow-right" style={{ width: 16, height: 16 }}></i>
        </a>
      </Reveal>
    </section>
  );
}

window.AboutPage = AboutPage;
