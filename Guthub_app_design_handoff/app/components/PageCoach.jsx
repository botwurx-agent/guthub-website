// PageCoach.jsx — AI chat with threads sidebar, suggested prompts, active conversation.

const SUGGESTIONS = [
  { title: 'Why am I bloated after lunch?', sub: 'Look at the last 7 days for patterns', icon: 'frown' },
  { title: 'Plan my week (low-FODMAP)', sub: 'A 7-day plan based on my profile', icon: 'plate' },
  { title: 'Explain my latest lab result', sub: 'Vibrant Wellness Gut Zoomer in plain English', icon: 'lab' },
  { title: 'What should I eat tonight?', sub: 'Quick dinner — under 30 minutes', icon: 'chefHat' },
  { title: 'How do I reduce reflux at night?', sub: 'Practical, evidence-based tips', icon: 'moon' },
  { title: 'Make me a grocery list', sub: 'For the next 7 days of meals', icon: 'cart' },
];

const ACTIVE_CONVO = [
  { role: 'user', body: 'I keep getting bloated after lunch — has it been getting worse?' },
  { role: 'assistant', body: <>
    <p style={{ margin: 0 }}>Let me look at your last 14 days. Here's what I'm seeing:</p>
    <ul style={{ paddingLeft: 18, marginTop: 12, lineHeight: 1.7 }}>
      <li>You logged bloating <strong>5 times</strong> after lunch in the last 2 weeks.</li>
      <li><strong>4 of those 5 lunches contained dairy</strong> (yogurt, cheese, or a cream-based dressing).</li>
      <li>The 5th was a salad with raw broccoli and onions — both moderate-FODMAP for IBS.</li>
    </ul>
    <p style={{ margin: '14px 0 0' }}>You also marked dairy as a known sensitivity in your intake. Two practical things you can try this week:</p>
  </> },
  { role: 'assistant_card', cards: [
    { title: '7-day no-dairy window', sub: 'I\'ll remove dairy from your meal plan and watch your symptoms.', cta: 'Start window' },
    { title: 'Switch to dairy alternatives', sub: 'Coconut yogurt, almond milk, nutritional yeast.', cta: 'Update plan' },
  ]},
  { role: 'user', body: 'Let\'s do the 7-day window. What does my Wednesday lunch look like instead?' },
  { role: 'assistant', body: <>
    <p style={{ margin: 0 }}>Done — dairy is out for 7 days starting tomorrow. Wednesday's lunch is now:</p>
    <div style={{
      marginTop: 12, padding: 14, border: '1px solid var(--ink-200)', borderRadius: 12, background: 'var(--cream-50)',
      display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'center',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-green), var(--brand-teal))' }} />
      <div>
        <div className="recipe-meal-type">Lunch · Wed Apr 23</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.2 }}>Mediterranean quinoa bowl with grilled chicken</div>
        <div className="subtle" style={{ fontSize: 13, marginTop: 4 }}>480 kcal · 38g protein · dairy-free · low-FODMAP</div>
      </div>
    </div>
    <p style={{ margin: '14px 0 0' }}>I'll check in Friday morning. If bloating drops noticeably, that's a strong signal. Sound good?</p>
  </> },
];

function PageCoach() {
  const [activeId, setActiveId] = React.useState('t1');
  const [hasConvo, setHasConvo] = React.useState(true);

  return (
    <div className="chat-wrap" data-screen-label="05 Coach">
      <aside className="chat-threads scroll-clean">
        <button className="btn btn-primary btn-block mb-4" onClick={() => { setHasConvo(false); setActiveId(null); }}>
          <Icon name="plus" size={14} /> New conversation
        </button>
        <div className="card-eyebrow mb-2" style={{ padding: '0 4px' }}>Recent</div>
        {MOCK.threads.map(t => (
          <div key={t.id} className={'thread ' + (t.id === activeId ? 'active' : '')} onClick={() => { setActiveId(t.id); setHasConvo(true); }}>
            <div className="thread-title">{t.title}</div>
            <div className="thread-snip">{t.snip} · {t.when}</div>
          </div>
        ))}

        <div className="card-eyebrow mt-6 mb-2" style={{ padding: '0 4px' }}>Saved by Coach</div>
        <div className="thread">
          <div className="thread-title">Your trigger food summary</div>
          <div className="thread-snip">Living document · updated weekly</div>
        </div>
        <div className="thread">
          <div className="thread-title">Your first 30 days</div>
          <div className="thread-snip">Auto-generated recap</div>
        </div>
      </aside>

      <div className="chat-area">
        <div className="chat-scroll scroll-clean">
          {hasConvo ? (
            <>
              {ACTIVE_CONVO.map((m, i) => {
                if (m.role === 'assistant_card') {
                  return (
                    <div key={i} className="chat-msg assistant">
                      <div className="msg-avatar"><Icon name="sparkle" size={16} /></div>
                      <div className="msg-bubble">
                        <div className="grid grid-2" style={{ gap: 12 }}>
                          {m.cards.map((c, j) => (
                            <div key={j} className="card card-tight" style={{ background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-100)' }}>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                              <div className="subtle mb-4" style={{ fontSize: 13 }}>{c.sub}</div>
                              <button className="btn btn-primary btn-sm">{c.cta} <Icon name="arrowRight" size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className={'chat-msg ' + m.role}>
                    {m.role === 'assistant'
                      ? <div className="msg-avatar"><Icon name="sparkle" size={16} /></div>
                      : <div className="msg-avatar user">{MOCK.user.initials}</div>}
                    <div className="msg-bubble">{m.body}</div>
                  </div>
                );
              })}
            </>
          ) : (
            <EmptyChat />
          )}
        </div>

        <div className="chat-input-wrap">
          <div className="chat-input">
            <textarea placeholder="Ask anything about your gut, food, or symptoms…" rows="1" />
            <button className="icon-btn" title="Attach a meal photo or lab"><Icon name="paperclip" size={16} /></button>
            <button className="send-btn"><Icon name="send" size={16} /></button>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 8, gap: 14, fontSize: 12, color: 'var(--ink-500)', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
            <span><Icon name="info" size={12} /> Coach knows your intake, meals, symptoms, and labs.</span>
            <span>· Not medical advice.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0' }}>
      <div className="text-center mb-8">
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--forest-500)', color: 'var(--cream-100)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={28} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Hi <em style={{ color: 'var(--terracotta-500)' }}>Steve</em>. What can I help with?
        </h1>
        <p className="muted" style={{ fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.55 }}>
          I know about your IBS, dairy sensitivity, and your goal of reducing bloating. Ask me anything — or pick a starter below.
        </p>
      </div>

      <div className="suggest-grid">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="suggest-card">
            <div className="row" style={{ gap: 10 }}>
              <div className="event-icon note" style={{ width: 32, height: 32, borderRadius: 8 }}>
                <Icon name={s.icon} size={16} />
              </div>
              <div className="sc-title">{s.title}</div>
            </div>
            <div className="sc-sub" style={{ marginLeft: 42 }}>{s.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

window.PageCoach = PageCoach;
