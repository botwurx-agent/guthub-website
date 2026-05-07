// PageLog.jsx — unified timeline of meals + symptoms + weight + notes.

const TIMELINE = [
  { day: 'Today', date: 'Tue · Apr 22', items: [
    { id: 'a', time: '7:42 AM', kind: 'meal',    title: 'Oatmeal with berries & almond butter', meta: 'Breakfast · 380 kcal · low-FODMAP', flags: ['high-fiber'], img: 'oat' },
    { id: 'b', time: '12:18 PM', kind: 'meal',   title: 'Grilled chicken with roasted veg & quinoa', meta: 'Lunch · 520 kcal', flags: ['lean-protein'], img: 'chicken' },
    { id: 'c', time: '1:30 PM',  kind: 'symptom',title: 'Mild bloating', meta: 'Severity 2/5 · 1 hr after lunch' },
    { id: 'd', time: '3:30 PM',  kind: 'meal',   title: 'Coconut yogurt + walnuts', meta: 'Snack · 240 kcal', flags: ['probiotic'] },
    { id: 'e', time: '6:15 PM',  kind: 'note',   title: 'Took magnesium glycinate', meta: '400 mg · with dinner prep' },
  ]},
  { day: 'Yesterday', date: 'Mon · Apr 21', items: [
    { id: 'f', time: '8:00 AM',  kind: 'weight', title: 'Weighed in', meta: '225.4 lb · −0.6 from last week' },
    { id: 'g', time: '8:20 AM',  kind: 'meal',   title: 'Greek yogurt parfait', meta: 'Breakfast · 320 kcal' },
    { id: 'h', time: '12:30 PM', kind: 'meal',   title: 'Mediterranean quinoa bowl', meta: 'Lunch · 480 kcal' },
    { id: 'i', time: '8:45 PM',  kind: 'meal',   title: 'Pasta primavera (restaurant)', meta: 'Dinner · est. 720 kcal' },
    { id: 'j', time: '11:10 PM', kind: 'symptom',title: 'Reflux', meta: 'Severity 3/5 · 2 hrs after late dinner' },
  ]},
  { day: 'Sun · Apr 20', date: '2 days ago', items: [
    { id: 'k', time: '9:10 AM',  kind: 'meal',   title: 'Veggie omelet, sourdough toast', meta: 'Breakfast · 410 kcal' },
    { id: 'l', time: '1:00 PM',  kind: 'meal',   title: 'Tuna salad plate', meta: 'Lunch · 460 kcal', flags: ['high-protein'] },
    { id: 'm', time: '7:30 PM',  kind: 'meal',   title: 'Roast chicken with vegetables', meta: 'Dinner · 580 kcal' },
  ]},
];

function PageLog({ onQuickLog }) {
  const [filter, setFilter] = React.useState('all');
  const filterFn = (it) => filter === 'all' || it.kind === filter;

  return (
    <div className="page" data-screen-label="02 Log">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Your timeline</span>
          <h1 className="page-title">Everything in one <em>thread</em>.</h1>
          <p className="page-subtitle">Meals, symptoms, weight, and notes — together so patterns are easy to spot.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="calendar" size={16} /> Apr 1 – 22</button>
          <button className="btn btn-primary" onClick={onQuickLog}>
            <Icon name="plus" size={16} /> Add entry
          </button>
        </div>
      </div>

      <div className="row-between mb-6">
        <div className="tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'meal', label: 'Meals' },
            { id: 'symptom', label: 'Symptoms' },
            { id: 'weight', label: 'Weight' },
            { id: 'note', label: 'Notes' },
          ].map(t => (
            <button key={t.id} className={'tab ' + (filter === t.id ? 'active' : '')} onClick={() => setFilter(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ fontSize: 14 }}>
          <span className="subtle">8 meals · 3 symptoms · 1 weight · 1 note in last 3 days</span>
        </div>
      </div>

      <div className="grid grid-12">
        <div className="col-8">
          <div className="card card-flush">
            <div style={{ padding: '8px 24px' }}>
              {TIMELINE.map(day => {
                const visible = day.items.filter(filterFn);
                if (!visible.length) return null;
                return (
                  <div key={day.day} className="timeline-day">
                    <div>
                      <div className="timeline-day-label">{day.day}</div>
                      <div className="timeline-day-sub">{day.date}</div>
                    </div>
                    <div className="timeline-events">
                      {visible.map(it => <EventRow key={it.id} ev={it} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-4 col">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick add</h3>
            </div>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <QuickAddTile icon="camera" label="Photo meal" onClick={() => onQuickLog('photo')} />
              <QuickAddTile icon="edit" label="Type meal" onClick={() => onQuickLog('meal')} />
              <QuickAddTile icon="frown" label="Symptom" onClick={() => onQuickLog('symptom')} />
              <QuickAddTile icon="activity" label="Weight" onClick={() => onQuickLog('weight')} />
              <QuickAddTile icon="droplet" label="Water" onClick={() => onQuickLog('water')} />
              <QuickAddTile icon="file" label="Note" onClick={() => onQuickLog('note')} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">This week at a glance</h3>
            </div>
            <div className="col" style={{ gap: 12 }}>
              <Stat label="Meals logged" val="14 / 21" sub="Goal: 3/day" />
              <Stat label="Symptoms" val="5" sub="↓ from 9 last week" trend="down" />
              <Stat label="Trigger pattern" val="Dairy" sub="4 of 5 occurrences" />
              <Stat label="Avg fiber" val="28 g/day" sub="Within target" trend="up" />
            </div>
          </div>

          <div className="card" style={{ background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-100)' }}>
            <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--terracotta-400)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Coach noticed</div>
                <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.55 }}>
                  Late dinner yesterday → reflux at 11:10 PM. Same pattern as the 17th. Want to talk about it?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ ev }) {
  const iconName = { meal: 'plate', symptom: 'frown', weight: 'activity', note: 'edit', water: 'droplet' }[ev.kind] || 'plate';
  return (
    <div className="event">
      <div className="event-time tnum">{ev.time}</div>
      <div className="event-body">
        <div className={'event-icon ' + ev.kind}><Icon name={iconName} size={18} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="event-title">{ev.title}</div>
          <div className="event-meta">{ev.meta}</div>
        </div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        {ev.flags?.map(f => <span key={f} className="pill pill-good">{f}</span>)}
      </div>
    </div>
  );
}

function QuickAddTile({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="check-row" style={{ flexDirection: 'column', gap: 8, padding: 16, alignItems: 'center', textAlign: 'center', background: 'var(--bg-elev)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-800)' }}>
        <Icon name={icon} size={18} />
      </div>
      <span className="check-text" style={{ fontSize: 13, textAlign: 'center', fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function Stat({ label, val, sub, trend }) {
  return (
    <div className="row-between">
      <div>
        <div style={{ fontSize: 13, color: 'var(--ink-600)', fontWeight: 500 }}>{label}</div>
        <div className="subtle" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: trend === 'down' ? 'var(--forest-400)' : trend === 'up' ? 'var(--forest-400)' : 'var(--ink-900)' }}>
        {val}
      </div>
    </div>
  );
}

window.PageLog = PageLog;
