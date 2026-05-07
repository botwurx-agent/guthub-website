// PageToday.jsx — the home/dashboard for a logged-in user.

function ScoreRing({ score = 72, prev = 64, size = 168 }) {
  const r = 70, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 168 168" width={size} height={size}>
          <circle cx="84" cy="84" r={r} stroke="var(--cream-200)" strokeWidth="10" fill="none"/>
          <circle cx="84" cy="84" r={r} stroke="var(--terracotta-400)" strokeWidth="10" fill="none"
                  strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="score-val">{score}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-500)', fontWeight: 700, marginTop: 4 }}>Gut score</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--forest-500)', fontWeight: 600 }}>
        <Icon name="arrowUp" size={12} /> +{score - prev} this week
      </div>
    </div>
  );
}

function MacroBar({ label, cur, goal, color = 'terracotta-400' }) {
  const pct = Math.min(100, (cur / goal) * 100);
  return (
    <div className="macro">
      <div className="macro-val tnum">{cur}<span className="macro-of"> / {goal}</span></div>
      <div className="macro-label">{label}</div>
      <div className="bar macro-bar"><span style={{ width: pct + '%', background: 'var(--' + color + ')' }} /></div>
    </div>
  );
}

function MealRow({ meal }) {
  return (
    <div className="event">
      <div className="event-time">{meal.time}</div>
      <div className="event-body">
        <div className={'event-icon meal'}><Icon name="plate" size={18} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="event-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.title}</div>
          <div className="event-meta">
            {meal.meal} · {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
          </div>
        </div>
      </div>
      <div>
        {meal.gutFlags?.map(f => <span key={f} className="pill pill-good" style={{ marginLeft: 6 }}>{f}</span>)}
      </div>
    </div>
  );
}

function PageToday({ setRoute, onQuickLog, onUploadLab }) {
  const m = MOCK.todayMacros;
  return (
    <div className="page" data-screen-label="01 Today">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Tuesday · April 22</span>
          <h1 className="page-title">Good afternoon, <em>Steve</em>.</h1>
          <p className="page-subtitle">Your gut score is up 8 points this week. Here's what to focus on today.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost" onClick={() => setRoute('insights')}>
            <Icon name="chart" size={16} /> See full trends
          </button>
          <button className="btn btn-primary" onClick={onQuickLog}>
            <Icon name="plus" size={16} /> Log a meal
          </button>
        </div>
      </div>

      <div className="grid grid-12">
        {/* LEFT — main column */}
        <div className="col-8 col">
          {/* AI nudge */}
          <div className="nudge">
            <div className="nudge-eyebrow">Coach · proactive</div>
            <h2 className="nudge-title">You bloated <em>4 of 5</em> times after dairy in the last 14 days.</h2>
            <p className="nudge-body">Want to try a 7-day no-dairy window and see what happens? I'll swap dairy in your meal plan and watch your symptom log to confirm the pattern.</p>
            <div className="row" style={{ position: 'relative', gap: 10 }}>
              <button className="btn" style={{ background: 'var(--cream-50)', color: 'var(--forest-600)' }}>
                Start the 7-day window
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--cream-100)', borderColor: 'rgba(250,245,238,0.3)' }} onClick={() => setRoute('coach')}>
                Talk it through with Coach
              </button>
            </div>
          </div>

          {/* Today's meals */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Today's meals</h3>
                <div className="subtle" style={{ fontSize: 13, marginTop: 2 }}>3 logged · {m.calories.cur} kcal · {m.calories.goal - m.calories.cur} kcal remaining</div>
              </div>
              <button className="btn btn-soft btn-sm" onClick={() => setRoute('log')}>View timeline</button>
            </div>
            <div className="col" style={{ gap: 10 }}>
              {MOCK.todayMeals.map(meal => <MealRow key={meal.id} meal={meal} />)}
            </div>
            <button className="btn btn-ghost btn-block mt-4" onClick={onQuickLog} style={{ borderStyle: 'dashed' }}>
              <Icon name="plus" size={16} /> Add dinner
            </button>
          </div>

          {/* Today's plan */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Tonight's suggested dinner</h3>
                <div className="subtle" style={{ fontSize: 13, marginTop: 2 }}>Picked for your low-FODMAP, dairy-free profile</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setRoute('plan')}>See week plan</button>
            </div>
            <div className="recipe">
              <div className="recipe-img" style={{ background: 'linear-gradient(135deg, var(--brand-green), var(--forest-300))' }} />
              <div>
                <div className="recipe-meal-type">Dinner</div>
                <h4 className="recipe-title">Baked salmon with sweet potato & asparagus</h4>
                <div className="recipe-meta">
                  <span><Icon name="clock" size={14} /> 30 min</span>
                  <span><Icon name="flame" size={14} /> 520 kcal</span>
                  <span><Icon name="leaf" size={14} /> Anti-inflammatory</span>
                </div>
              </div>
              <div className="col" style={{ gap: 8, alignItems: 'flex-end' }}>
                <button className="btn btn-primary btn-sm">Cook this</button>
                <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={14} /> Swap</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — sidebar column */}
        <div className="col-4 col">
          {/* Score */}
          <div className="card text-center" style={{ paddingTop: 32, paddingBottom: 28 }}>
            <div className="card-eyebrow" style={{ marginBottom: 12 }}>Today</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <ScoreRing score={MOCK.gutScore} prev={MOCK.gutScorePrev} />
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 16, fontSize: 13 }}>
              <div><span className="legend-dot" style={{ background: 'var(--forest-400)' }} />Sleep good</div>
              <div><span className="legend-dot" style={{ background: 'var(--brand-yellow)' }} />Stress mid</div>
              <div><span className="legend-dot" style={{ background: 'var(--terracotta-400)' }} />Bloat ↓</div>
            </div>
          </div>

          {/* Macros */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Macros today</h3>
              <span className="subtle tnum" style={{ fontSize: 13 }}>{Math.round((m.calories.cur / m.calories.goal) * 100)}%</span>
            </div>
            <div className="macros">
              <MacroBar label="Kcal" cur={m.calories.cur} goal={m.calories.goal} />
              <MacroBar label="Protein" cur={m.protein.cur} goal={m.protein.goal} color="forest-400" />
              <MacroBar label="Carbs" cur={m.carbs.cur} goal={m.carbs.goal} color="brand-yellow" />
              <MacroBar label="Fat" cur={m.fat.cur} goal={m.fat.goal} color="brand-teal" />
            </div>
          </div>

          {/* Symptoms */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">How you're feeling</h3>
              <button className="btn btn-soft btn-sm" onClick={() => onQuickLog('symptom')}>
                <Icon name="plus" size={14} /> Log
              </button>
            </div>
            <div className="col" style={{ gap: 10 }}>
              {MOCK.recentSymptoms.slice(0, 3).map(s => (
                <div key={s.id} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div className={'event-icon symptom'} style={{ width: 32, height: 32, borderRadius: 8 }}>
                    <Icon name={s.severity >= 3 ? 'frown' : s.severity === 2 ? 'meh' : 'smile'} size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.kind}</div>
                    <div className="subtle" style={{ fontSize: 12 }}>{s.when} · severity {s.severity}/5</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test report analysis */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--forest-600), var(--forest-700))', color: 'var(--cream-50)', border: 'none' }}>
            <div className="row" style={{ gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250,245,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="lab" size={20} color="var(--cream-50)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Test report analysis</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>1 report analyzed</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.92, margin: '0 0 14px' }}>
              Upload stool tests, food sensitivity panels, or blood work — Coach reads them and explains what to do.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'var(--cream-50)', color: 'var(--forest-700)', flex: 1 }} onClick={() => setRoute('insights')}>
                View results
              </button>
              <button className="btn btn-sm btn-ghost" style={{ color: 'var(--cream-50)', borderColor: 'rgba(250,245,238,0.3)' }} onClick={onUploadLab}>
                <Icon name="paperclip" size={14} /> Upload
              </button>
            </div>
          </div>

          {/* Streak */}
          <div className="card" style={{ background: 'var(--cream-100)' }}>
            <div className="row" style={{ gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: 'var(--terracotta-400)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="flame" size={24} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{MOCK.streakDays}-day logging streak</div>
                <div className="subtle" style={{ fontSize: 13 }}>Keep it going — log dinner tonight.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageToday = PageToday;
