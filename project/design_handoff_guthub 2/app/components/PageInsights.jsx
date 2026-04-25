// PageInsights.jsx — trends, lab reports, doctor PDF export.

function TrendChart({ data, color = 'var(--terracotta-400)', fill = true, height = 180, min, max, label, valueSuffix = '' }) {
  const w = 100, h = 28;
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const range = hi - lo || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - lo) / range) * h}`);
  const path = `M ${points.join(' L ')}`;
  const fillPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <div>
      <div className="row-between mb-2" style={{ alignItems: 'baseline' }}>
        <div>
          <div className="card-eyebrow">{label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 4, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>
            {data[data.length - 1]}{valueSuffix}
          </div>
        </div>
        <div className="subtle" style={{ fontSize: 12 }}>30-day</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }} >
        {fill && <path d={fillPath} fill={color} opacity="0.12" />}
        <path d={path} fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function PageInsights() {
  const [tab, setTab] = React.useState('trends');
  return (
    <div className="page" data-screen-label="04 Insights">
      <div className="page-header">
        <div className="page-title-block">
          <span className="eyebrow">Insights</span>
          <h1 className="page-title">Patterns become <em>clarity</em>.</h1>
          <p className="page-subtitle">Your gut score, weight, symptoms, and lab results — together. Share with your doctor in one tap.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="calendar" size={16} /> Last 30 days</button>
          <button className="btn btn-primary"><Icon name="download" size={16} /> Doctor report</button>
        </div>
      </div>

      <div className="tabs mb-6">
        {[{ id: 'trends', l: 'Trends' }, { id: 'patterns', l: 'Patterns' }, { id: 'labs', l: 'Test reports' }].map(t => (
          <button key={t.id} className={'tab ' + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {tab === 'trends' && (
        <div className="grid grid-12">
          <div className="col-8 col">
            <div className="card">
              <TrendChart data={MOCK.trends30.score} color="var(--terracotta-400)" label="Gut score" />
              <div className="row-between mt-4" style={{ fontSize: 13 }}>
                <span className="trend-up"><Icon name="arrowUp" size={14} /> +14 from 30 days ago</span>
                <span className="subtle">Average · 70</span>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <TrendChart data={MOCK.trends30.weight} color="var(--forest-400)" label="Weight" valueSuffix=" lb" height={120} />
                <div className="subtle mt-2" style={{ fontSize: 13 }}>−13 lb in 30 days · on track for goal</div>
              </div>
              <div className="card">
                <TrendChart data={MOCK.trends30.bloat} color="var(--brand-yellow)" label="Bloating · severity" min={0} max={5} height={120} />
                <div className="subtle mt-2" style={{ fontSize: 13 }}>Avg severity 1.4/5 · down from 2.6</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Macros, this month</h3>
              </div>
              <div className="grid grid-4" style={{ gap: 12 }}>
                <MetricStat label="Avg fiber" val="28 g" sub="Target 25–35" trend="good" />
                <MetricStat label="Avg protein" val="118 g" sub="Target 130 g" trend="warn" />
                <MetricStat label="Hydration" val="62 oz" sub="Target 80 oz" trend="warn" />
                <MetricStat label="Sleep" val="7.2 hr" sub="Steady" trend="good" />
              </div>
            </div>
          </div>

          <div className="col-4 col">
            <div className="card">
              <div className="card-header"><h3 className="card-title">What's working</h3></div>
              <div className="col" style={{ gap: 10 }}>
                {MOCK.insights.filter(i => i.tone === 'good').map((i, idx) => <InsightRow key={idx} insight={i} />)}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">What to watch</h3></div>
              <div className="col" style={{ gap: 10 }}>
                {MOCK.insights.filter(i => i.tone === 'warn').map((i, idx) => <InsightRow key={idx} insight={i} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'patterns' && (
        <div className="grid grid-12">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Trigger food correlations</h3>
                <span className="subtle" style={{ fontSize: 13 }}>Last 30 days · symptoms within 6 hrs of eating</span>
              </div>
              <div className="col" style={{ gap: 10 }}>
                <PatternRow food="Dairy" symptom="Bloating" rate={80} confidence="High" tone="bad" />
                <PatternRow food="Late dinner (after 8 PM)" symptom="Reflux" rate={75} confidence="High" tone="bad" />
                <PatternRow food="Cruciferous veg (raw)" symptom="Gas" rate={60} confidence="Medium" tone="warn" />
                <PatternRow food="Coffee on empty stomach" symptom="Acidity" rate={50} confidence="Medium" tone="warn" />
                <PatternRow food="Bone broth" symptom="None reported" rate={0} confidence="—" tone="good" inverse />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'labs' && (
        <div className="grid grid-12">
          <div className="col-8 col">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Vibrant Wellness — Gut Zoomer 3.0</h3>
                <span className="pill pill-good">Analyzed</span>
              </div>
              <div className="subtle mb-4" style={{ fontSize: 13 }}>Uploaded April 18 · 14 markers reviewed by Coach</div>
              <div className="col" style={{ gap: 10 }}>
                <LabMarker name="Zonulin" val="48 ng/mL" range="< 60" status="good" note="In range — gut barrier looks intact." />
                <LabMarker name="Calprotectin" val="22 µg/g" range="< 50" status="good" note="No active inflammation detected." />
                <LabMarker name="Beta-glucuronidase" val="2,840 U/g" range="< 2,000" status="warn" note="Slightly elevated. Suggests reviewing fiber & cruciferous veg." />
                <LabMarker name="Secretory IgA" val="320 mg/dL" range="510–2,040" status="bad" note="Low. Often improves with stress reduction & sleep." />
                <LabMarker name="Beneficial Lactobacillus" val="1.2 × 10⁵" range="> 5 × 10⁴" status="good" note="Healthy population." />
              </div>
              <div className="row mt-6" style={{ gap: 10 }}>
                <button className="btn btn-primary"><Icon name="chat" size={14} /> Ask Coach about these</button>
                <button className="btn btn-ghost"><Icon name="download" size={14} /> Download original PDF</button>
              </div>
            </div>
          </div>
          <div className="col-4 col">
            <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--ink-300)', background: 'var(--cream-100)' }}>
              <div className="text-center" style={{ padding: '24px 8px' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 14, background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ink-200)' }}>
                  <Icon name="lab" size={26} color="var(--forest-500)" />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400 }}>Upload another lab</div>
                <div className="subtle mb-4" style={{ fontSize: 13 }}>PDF, photo, or screenshot. Coach reads stool tests, food sensitivity panels, blood work, and more.</div>
                <button className="btn btn-primary"><Icon name="paperclip" size={14} /> Choose file</button>
                <div className="subtle mt-4" style={{ fontSize: 12 }}>Encrypted · HIPAA-aligned · never shared</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Past reports</h3></div>
              <div className="col" style={{ gap: 8 }}>
                <PastReport name="Vibrant Wellness Gut Zoomer 3.0" date="Apr 18, 2026" />
                <PastReport name="Comprehensive metabolic panel" date="Mar 02, 2026" />
                <PastReport name="Food sensitivity (IgG)" date="Jan 14, 2026" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricStat({ label, val, sub, trend }) {
  return (
    <div>
      <div className="card-eyebrow">{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 4, letterSpacing: '-0.01em' }}>{val}</div>
      <div className={'subtle ' + (trend === 'good' ? 'trend-up' : trend === 'warn' ? 'trend-flat' : '')} style={{ fontSize: 12 }}>{sub}</div>
    </div>
  );
}

function InsightRow({ insight }) {
  return (
    <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
      <div className={'event-icon ' + (insight.tone === 'good' ? 'note' : 'symptom')} style={{ width: 32, height: 32, borderRadius: 8 }}>
        <Icon name={insight.tone === 'good' ? 'check' : 'info'} size={16} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{insight.title}</div>
        <div className="subtle" style={{ fontSize: 13, lineHeight: 1.5 }}>{insight.body}</div>
      </div>
    </div>
  );
}

function PatternRow({ food, symptom, rate, confidence, tone, inverse }) {
  return (
    <div className="row" style={{ gap: 16, padding: '12px 0', borderBottom: '1px solid var(--ink-200)' }}>
      <div style={{ width: 220, fontSize: 15, fontWeight: 600 }}>{food}</div>
      <div style={{ flex: 1 }}>
        <div className="row-between mb-2" style={{ fontSize: 13 }}>
          <span className="muted">→ {symptom}</span>
          <span className="tnum subtle">{inverse ? '0/12' : Math.round(rate / 100 * 12) + '/12'} occurrences</span>
        </div>
        <div className="bar"><span style={{ width: rate + '%', background: tone === 'bad' ? 'var(--terracotta-400)' : tone === 'warn' ? 'var(--brand-yellow)' : 'var(--forest-400)' }} /></div>
      </div>
      <span className={'pill pill-' + (tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'good')}>{confidence}</span>
    </div>
  );
}

function LabMarker({ name, val, range, status, note }) {
  return (
    <div className="row" style={{ gap: 16, padding: '14px 0', borderBottom: '1px solid var(--ink-200)', alignItems: 'flex-start' }}>
      <div style={{ width: 200 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div className="subtle" style={{ fontSize: 12 }}>Reference: {range}</div>
      </div>
      <div style={{ width: 120, fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-900)' }} className="tnum">{val}</div>
      <div style={{ flex: 1 }} className="muted small">{note}</div>
      <span className={'pill pill-' + (status === 'good' ? 'good' : status === 'warn' ? 'warn' : 'bad')}>
        {status === 'good' ? 'In range' : status === 'warn' ? 'Watch' : 'Low'}
      </span>
    </div>
  );
}

function PastReport({ name, date }) {
  return (
    <div className="row" style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid var(--ink-200)' }}>
      <div className="event-icon note" style={{ width: 32, height: 32, borderRadius: 8 }}><Icon name="file" size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div className="subtle" style={{ fontSize: 12 }}>{date}</div>
      </div>
      <button className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="arrowRight" size={14} /></button>
    </div>
  );
}

window.PageInsights = PageInsights;
