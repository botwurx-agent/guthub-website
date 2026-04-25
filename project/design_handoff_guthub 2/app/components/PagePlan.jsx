// PagePlan.jsx — weekly meal plan + recipe + shopping list

const PLAN_GRADIENTS = {
  breakfast: 'linear-gradient(135deg, var(--brand-yellow), var(--terracotta-200))',
  lunch:     'linear-gradient(135deg, var(--brand-green), var(--brand-teal))',
  dinner:    'linear-gradient(135deg, var(--forest-300), var(--forest-500))',
};

function PagePlan() {
  const [activeDay, setActiveDay] = React.useState(0);
  const [activeMeal, setActiveMeal] = React.useState('dinner');
  const day = MOCK.weekPlan[activeDay];
  const titleByMeal = { breakfast: day.breakfast, lunch: day.lunch, dinner: day.dinner };

  return (
    <div className="page" data-screen-label="03 Plan">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Week of April 21</span>
          <h1 className="page-title">A week that <em>fits you</em>.</h1>
          <p className="page-subtitle">Built from your low-FODMAP profile, dairy-free needs, and Mediterranean preference. Swap anything you don't like.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="refresh" size={16} /> Regenerate</button>
          <button className="btn btn-ghost"><Icon name="cart" size={16} /> Shopping list</button>
          <button className="btn btn-primary"><Icon name="download" size={16} /> Export PDF</button>
        </div>
      </div>

      <div className="grid grid-12">
        <div className="col-8 col">
          {/* Week strip */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">This week's plan</h3>
              <div className="row">
                <button className="btn btn-ghost btn-sm"><Icon name="arrowLeft" size={14} /></button>
                <button className="btn btn-ghost btn-sm"><Icon name="arrowRight" size={14} /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {MOCK.weekPlan.map((d, i) => (
                <button key={d.day}
                        onClick={() => setActiveDay(i)}
                        style={{
                          background: i === activeDay ? 'var(--terracotta-50)' : 'var(--cream-100)',
                          border: '1px solid ' + (i === activeDay ? 'var(--terracotta-300)' : 'var(--ink-200)'),
                          borderRadius: 12, padding: '12px 8px',
                          cursor: 'pointer', textAlign: 'center',
                          color: i === activeDay ? 'var(--terracotta-700)' : 'var(--ink-700)',
                        }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>{d.day}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginTop: 4 }}>{21 + i}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Day's meals */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">{day.day} — pick a meal to view or regenerate</h3>
                <div className="subtle" style={{ fontSize: 13, marginTop: 2 }}>~1820 kcal · 132g protein · tap any meal below to see the recipe</div>
              </div>
            </div>
            <div className="col" style={{ gap: 12 }}>
              {['breakfast','lunch','dinner'].map(meal => (
                <div key={meal}
                     onClick={() => setActiveMeal(meal)}
                     className="recipe"
                     style={{
                       cursor: 'pointer',
                       borderColor: activeMeal === meal ? 'var(--terracotta-300)' : 'var(--ink-200)',
                       background: activeMeal === meal ? 'var(--terracotta-50)' : 'var(--bg-elev)',
                       boxShadow: activeMeal === meal ? '0 0 0 3px rgba(217,119,87,0.15)' : 'none',
                       transition: 'all 0.15s ease',
                     }}>
                  <div className="recipe-img" style={{ background: PLAN_GRADIENTS[meal] }} />
                  <div>
                    <div className="recipe-meal-type" style={{ color: activeMeal === meal ? 'var(--terracotta-600)' : 'var(--ink-600)' }}>
                      {meal} {activeMeal === meal && <span style={{ marginLeft: 6 }}>· viewing</span>}
                    </div>
                    <h4 className="recipe-title">{titleByMeal[meal]}</h4>
                    <div className="recipe-meta">
                      <span><Icon name="clock" size={14} /> {meal === 'breakfast' ? '15' : meal === 'lunch' ? '20' : '30'} min</span>
                      <span><Icon name="flame" size={14} /> {meal === 'breakfast' ? 380 : meal === 'lunch' ? 480 : 580} kcal</span>
                      <span><Icon name="leaf" size={14} /> Gut-friendly</span>
                    </div>
                  </div>
                  <div className="col" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <button className="btn btn-soft btn-sm" onClick={e => { e.stopPropagation(); }}>
                      <Icon name="refresh" size={14} /> Regenerate
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); }}>
                      <Icon name="heart" size={14} /> Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active recipe detail */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="recipe-meal-type">Recipe — {activeMeal}</div>
                <h3 className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, marginTop: 4 }}>{titleByMeal[activeMeal]}</h3>
              </div>
              <div className="row">
                <button className="btn btn-ghost btn-sm"><Icon name="share" size={14} /></button>
                <button className="btn btn-primary btn-sm"><Icon name="check" size={14} /> Mark cooked</button>
              </div>
            </div>

            {/* Hero: image + macros side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ borderRadius: 14, height: 220, background: PLAN_GRADIENTS[activeMeal], position: 'relative' }}>
                <div style={{
                  position: 'absolute', bottom: 12, left: 12,
                  background: 'rgba(253, 250, 243, 0.92)', backdropFilter: 'blur(8px)',
                  padding: '6px 10px', borderRadius: 999,
                  fontSize: 12, fontWeight: 600, color: 'var(--forest-700)',
                }}>30 min · serves 2</div>
              </div>
              <div className="col" style={{ justifyContent: 'space-between', gap: 12 }}>
                <div className="macros" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <MiniMacro label="Kcal" val="520" />
                  <MiniMacro label="Protein" val="38g" />
                  <MiniMacro label="Carbs" val="42g" />
                  <MiniMacro label="Fat" val="22g" />
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill pill-good"><Icon name="leaf" size={12} /> Low FODMAP</span>
                  <span className="pill pill-good">Dairy-free</span>
                  <span className="pill pill-good">Anti-inflammatory</span>
                  <span className="pill" style={{ background: 'var(--cream-100)', color: 'var(--ink-700)' }}>Mediterranean</span>
                </div>
              </div>
            </div>

            {/* Ingredients + Method side by side, equal columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>
              <div>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--terracotta-600)', fontWeight: 700, margin: '0 0 12px' }}>Ingredients</h4>
                <ul style={{ paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-800)', fontSize: 15, margin: 0 }}>
                  <li>2 salmon fillets (4 oz each)</li>
                  <li>1 medium sweet potato, cubed</li>
                  <li>1 bunch asparagus, trimmed</li>
                  <li>2 tbsp olive oil</li>
                  <li>1 lemon, sliced</li>
                  <li>Salt, pepper, smoked paprika</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--terracotta-600)', fontWeight: 700, margin: '0 0 12px' }}>Method</h4>
                <ol style={{ paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-800)', fontSize: 15, margin: 0 }}>
                  <li>Preheat oven to 400°F (200°C). Toss sweet potato in 1 tbsp olive oil and roast for 15 minutes.</li>
                  <li>Add asparagus to the pan, drizzle with remaining oil, season. Roast 10 more minutes.</li>
                  <li>Place salmon on top, season with paprika, salt, and pepper. Top with lemon slices.</li>
                  <li>Roast another 10–12 minutes until salmon flakes easily.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="col-4 col">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Shopping list</h3>
              <span className="subtle" style={{ fontSize: 13 }}>For the week</span>
            </div>
            <div className="col" style={{ gap: 16 }}>
              {MOCK.shoppingList.map(group => (
                <div key={group.cat}>
                  <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--terracotta-600)', fontWeight: 700, marginBottom: 8 }}>{group.cat}</div>
                  <div className="col" style={{ gap: 4 }}>
                    {group.items.map((it, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, padding: '4px 0', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ accentColor: 'var(--terracotta-400)' }} />
                        <span>{it}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn btn-soft btn-sm"><Icon name="share" size={14} /> Send to phone</button>
              <button className="btn btn-soft btn-sm"><Icon name="cart" size={14} /> Open in Instacart</button>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--cream-100)' }}>
            <div className="card-eyebrow">Plan settings</div>
            <div className="col" style={{ gap: 10, marginTop: 10, fontSize: 14 }}>
              <div className="row-between"><span className="muted">Eating style</span><span style={{ fontWeight: 600 }}>Mediterranean</span></div>
              <div className="row-between"><span className="muted">Avoiding</span><span style={{ fontWeight: 600 }}>Dairy, FODMAP</span></div>
              <div className="row-between"><span className="muted">Calorie target</span><span style={{ fontWeight: 600 }}>2,100 / day</span></div>
              <div className="row-between"><span className="muted">Servings</span><span style={{ fontWeight: 600 }}>2 per meal</span></div>
            </div>
            <button className="btn btn-ghost btn-sm btn-block mt-4"><Icon name="settings" size={14} /> Adjust preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMacro({ label, val }) {
  return (
    <div className="macro">
      <div className="macro-val">{val}</div>
      <div className="macro-label">{label}</div>
    </div>
  );
}

window.PagePlan = PagePlan;
