// PageMisc.jsx — Community, Settings, QuickLog modal

function PageCommunity() {
  const posts = [
    { id: 1, author: 'Maria K.', avatar: 'M', time: '2h', title: 'Three months on GutHub: the trigger I never suspected', body: 'I\'d been convinced gluten was the problem for years. Turns out my bloating correlated almost perfectly with raw cruciferous veg — which I was eating three times a week for "health." The Coach spotted it in 9 days.', likes: 142, comments: 38, tag: 'Success story' },
    { id: 2, author: 'Dr. Hannah L.', avatar: 'H', time: '1d', title: 'Reflux 101: the small changes that actually matter', body: 'The most effective interventions for nocturnal reflux, ranked by the evidence. Hint: none of them are fancy supplements.', likes: 89, comments: 12, tag: 'Expert AMA', pinned: true },
    { id: 3, author: 'James R.', avatar: 'J', time: '2d', title: 'Down 18 lb in 60 days without tracking calories', body: 'All I did was follow my meal plan and log meals. The weight came off without me obsessing about it.', likes: 76, comments: 22, tag: 'Success story' },
    { id: 4, author: 'Priya S.', avatar: 'P', time: '3d', title: 'My low-FODMAP grocery haul (with photos)', body: 'Trader Joe\'s and Whole Foods run. Sharing in case it helps someone who\'s just starting out.', likes: 54, comments: 16, tag: 'Tips & tricks' },
  ];

  return (
    <div className="page" data-screen-label="06 Community">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Community</span>
          <h1 className="page-title">People on the <em>same path</em>.</h1>
          <p className="page-subtitle">Stories, tips, and moderated expert AMAs from the GutHub community.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="search" size={16} /> Search</button>
          <button className="btn btn-primary"><Icon name="edit" size={16} /> Share your story</button>
        </div>
      </div>

      <div className="grid grid-12">
        <div className="col-8 col">
          <div className="tabs mb-6">
            <button className="tab active">Following</button>
            <button className="tab">Success stories</button>
            <button className="tab">Expert AMAs</button>
            <button className="tab">Tips & tricks</button>
            <button className="tab">IBS support</button>
          </div>

          {posts.map(p => (
            <div key={p.id} className="card" style={p.pinned ? { borderColor: 'var(--terracotta-300)', background: 'var(--terracotta-50)' } : {}}>
              <div className="row" style={{ gap: 14, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--forest-300)', color: 'var(--forest-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18 }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.author}</span>
                    <span className="subtle" style={{ fontSize: 12 }}>· {p.time}</span>
                    {p.pinned && <span className="pill pill-warn">Pinned</span>}
                    <span className="pill">{p.tag}</span>
                  </div>
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 8px', lineHeight: 1.2 }}>{p.title}</h3>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 14px' }}>{p.body}</p>
              <div className="row" style={{ gap: 20, fontSize: 13, color: 'var(--ink-600)' }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}><Icon name="heart" size={14} /> {p.likes}</button>
                <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}><Icon name="chat" size={14} /> {p.comments}</button>
                <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}><Icon name="share" size={14} /> Share</button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-4 col">
          <div className="card" style={{ background: 'var(--cream-100)' }}>
            <div className="card-eyebrow">Live right now</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.2, margin: '8px 0 8px', fontWeight: 400 }}>IBS & stress — a conversation with <em>Dr. Parham Ahmadi</em>.</div>
            <div className="subtle mb-4" style={{ fontSize: 13 }}>Starts in 14 minutes · 240 attending</div>
            <button className="btn btn-primary btn-sm btn-block">Add to calendar</button>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Suggested for you</h3></div>
            <div className="col" style={{ gap: 12 }}>
              <SuggGroup name="Low-FODMAP kitchen" members="3,240" />
              <SuggGroup name="Reflux recovery" members="1,890" />
              <SuggGroup name="Midlife metabolism" members="2,104" />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Community guidelines</h3></div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Kind, specific, evidence-based. No supplements pitches. Every AMA is moderated by a licensed clinician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggGroup({ name, members }) {
  return (
    <div className="row-between">
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div className="subtle" style={{ fontSize: 12 }}>{members} members</div>
      </div>
      <button className="btn btn-ghost btn-sm">Join</button>
    </div>
  );
}

function PageSettings() {
  return (
    <div className="page" data-screen-label="07 Settings">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Settings</span>
          <h1 className="page-title">Your <em>profile</em>.</h1>
          <p className="page-subtitle">What GutHub knows about you, how it talks to you, and what data it keeps.</p>
        </div>
      </div>

      <div className="grid grid-12">
        <div className="col-3">
          <div className="card" style={{ position: 'sticky', top: 16 }}>
            <div className="col" style={{ gap: 4 }}>
              {['Profile & health','Goals','Meal preferences','Coach behavior','Notifications','Privacy & data','Subscription','Integrations'].map((n, i) => (
                <button key={n} className={'nav-item ' + (i === 0 ? 'active' : '')} style={{ margin: 0 }}>
                  <span>{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-9 col">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profile & health</h3>
              <button className="btn btn-ghost btn-sm"><Icon name="edit" size={14} /> Edit</button>
            </div>
            <div className="grid grid-2" style={{ gap: 20 }}>
              <SettingRow label="Full name" val="Steve Nazari" />
              <SettingRow label="Date of birth" val="March 14, 1968 (58)" />
              <SettingRow label="Gender" val="Male" />
              <SettingRow label="Location" val="Berkeley, CA" />
              <SettingRow label="Height" val="5' 10&quot; · 178 cm" />
              <SettingRow label="Current weight" val="225 lb · 102 kg" />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--ink-200)', margin: '20px 0' }} />
            <div className="grid grid-2" style={{ gap: 20 }}>
              <SettingRow label="Conditions" val={<><span className="pill pill-warn">IBS</span></>} />
              <SettingRow label="Allergens & sensitivities" val={<><span className="pill pill-bad" style={{ marginRight: 6 }}>Dairy</span></>} />
              <SettingRow label="Medications" val="Omeprazole 20mg, Vitamin D, Magnesium glycinate" />
              <SettingRow label="Primary care doctor" val="Dr. Parham Ahmadi · connected" />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Coach behavior</h3>
            </div>
            <div className="col" style={{ gap: 14 }}>
              <SettingToggle label="Proactive nudges" sub="Coach can message you first when it notices patterns or missed logs." on />
              <SettingToggle label="Auto-update meal plan" sub="Update next week's plan based on what you logged and how you felt." on />
              <SettingToggle label="Weekly recap" sub="Every Sunday morning, a short summary of the week." on />
              <SettingToggle label="Share insights with doctor" sub="Dr. Ahmadi gets your monthly summary PDF." off />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your data</h3>
              <span className="pill pill-good">End-to-end encrypted</span>
            </div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
              Your health data is yours. Download a full copy anytime, or delete everything with one click.
            </p>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-ghost"><Icon name="download" size={14} /> Export all data</button>
              <button className="btn btn-ghost" style={{ color: 'var(--terracotta-600)' }}><Icon name="trash" size={14} /> Delete account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, val }) {
  return (
    <div>
      <div className="card-eyebrow">{label}</div>
      <div style={{ fontSize: 15, marginTop: 4 }}>{val}</div>
    </div>
  );
}

function SettingToggle({ label, sub, on }) {
  const [v, setV] = React.useState(on);
  return (
    <div className="row-between">
      <div style={{ flex: 1, paddingRight: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        <div className="subtle" style={{ fontSize: 13, lineHeight: 1.5 }}>{sub}</div>
      </div>
      <button onClick={() => setV(!v)} style={{
        width: 44, height: 26, borderRadius: 999, border: 'none',
        background: v ? 'var(--terracotta-400)' : 'var(--ink-300)',
        position: 'relative', cursor: 'pointer', transition: 'background 160ms',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: v ? 21 : 3,
          width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 160ms',
        }} />
      </button>
    </div>
  );
}

// ---------- Quick Log Modal ----------

function QuickLogModal({ kind, onClose }) {
  const [tab, setTab] = React.useState(kind === 'symptom' ? 'symptom' : kind === 'weight' ? 'weight' : 'meal');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Quick add</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: '4px 0 0', letterSpacing: '-0.01em' }}>What happened?</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="tabs mb-6">
            {[{ id: 'meal', l: 'Meal' }, { id: 'symptom', l: 'Symptom' }, { id: 'weight', l: 'Weight' }, { id: 'note', l: 'Note' }].map(t => (
              <button key={t.id} className={'tab ' + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>{t.l}</button>
            ))}
          </div>

          {tab === 'meal' && <QuickMeal />}
          {tab === 'symptom' && <QuickSymptom />}
          {tab === 'weight' && <QuickWeight />}
          {tab === 'note' && <QuickNote />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}><Icon name="check" size={14} /> Save entry</button>
        </div>
      </div>
    </div>
  );
}

function QuickMeal() {
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="grid grid-2" style={{ gap: 10 }}>
        <QuickTile icon="camera" label="Snap a photo" sub="Coach identifies foods" primary />
        <QuickTile icon="mic" label="Voice log" sub="Just say what you ate" />
        <QuickTile icon="edit" label="Type it out" sub="Short description is fine" />
        <QuickTile icon="search" label="Search food" sub="From our database" />
      </div>
      <div>
        <label className="field-label">Describe your meal</label>
        <textarea className="textarea" placeholder="e.g., Grilled chicken salad with olive oil and lemon, small side of sourdough…" defaultValue="Baked salmon with sweet potato and asparagus" />
      </div>
      <div className="grid grid-2" style={{ gap: 14 }}>
        <div>
          <label className="field-label">Meal</label>
          <select className="select" defaultValue="Dinner">
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
          </select>
        </div>
        <div>
          <label className="field-label">When</label>
          <input className="input" defaultValue="Today, 7:30 PM" />
        </div>
      </div>
      <div className="card" style={{ background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-100)', margin: 0 }}>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <Icon name="sparkle" size={18} color="var(--terracotta-600)" />
          <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>
            <strong>Coach will estimate:</strong> ~520 kcal · 38g protein · 42g carbs · 22g fat. Dairy-free ✓ · Low-FODMAP ✓
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickSymptom() {
  const [sev, setSev] = React.useState(3);
  return (
    <div className="col" style={{ gap: 18 }}>
      <div>
        <label className="field-label">What are you feeling?</label>
        <ChipGroup options={['Bloating','Gas','Reflux','Cramping','Nausea','Constipation','Diarrhea','Fatigue','Brain fog']} value={['Bloating']} onChange={() => {}} />
      </div>
      <div>
        <label className="field-label">Severity <span className="tnum" style={{ color: 'var(--terracotta-500)', fontFamily: 'var(--font-display)', fontSize: 20, marginLeft: 8 }}>{sev}/5</span></label>
        <input className="slider" type="range" min="1" max="5" value={sev} onChange={e => setSev(Number(e.target.value))} />
        <div className="row-between subtle" style={{ fontSize: 12, marginTop: 6 }}>
          <span>Barely there</span><span>Unbearable</span>
        </div>
      </div>
      <div>
        <label className="field-label">Notes (optional)</label>
        <textarea className="textarea" placeholder="Anything you noticed — duration, time since eating…" />
      </div>
    </div>
  );
}

function QuickWeight() {
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="grid grid-2" style={{ gap: 14 }}>
        <div>
          <label className="field-label">Weight</label>
          <input className="input" defaultValue="225.0" placeholder="lb" />
        </div>
        <div>
          <label className="field-label">Unit</label>
          <select className="select" defaultValue="lb"><option>lb</option><option>kg</option></select>
        </div>
      </div>
      <div>
        <label className="field-label">When</label>
        <input className="input" defaultValue="Today, 7:45 AM" />
      </div>
      <div className="card" style={{ background: 'var(--cream-100)', margin: 0 }}>
        <div className="row-between">
          <span className="muted" style={{ fontSize: 13 }}>Last weigh-in · Apr 21</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>225.4 lb</span>
        </div>
      </div>
    </div>
  );
}

function QuickNote() {
  return (
    <div className="col" style={{ gap: 14 }}>
      <div>
        <label className="field-label">What's on your mind?</label>
        <textarea className="textarea" style={{ minHeight: 160 }} placeholder="Took a new supplement, feeling stressed, slept badly, tried a new restaurant…" />
      </div>
    </div>
  );
}

function QuickTile({ icon, label, sub, primary }) {
  return (
    <button className="check-row" style={{
      flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 16,
      background: primary ? 'var(--terracotta-50)' : 'var(--bg-elev)',
      borderColor: primary ? 'var(--terracotta-200)' : 'var(--ink-200)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: primary ? 'var(--terracotta-400)' : 'var(--cream-200)', color: primary ? '#fff' : 'var(--ink-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{label}</div>
      <div className="subtle" style={{ fontSize: 12 }}>{sub}</div>
    </button>
  );
}

window.PageCommunity = PageCommunity;
window.PageSettings = PageSettings;
window.QuickLogModal = QuickLogModal;
