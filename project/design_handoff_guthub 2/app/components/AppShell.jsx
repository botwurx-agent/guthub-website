// AppShell.jsx — sidebar + topbar + page routing

const NAV = [
  { id: 'today',    label: 'Today',    icon: 'home' },
  { id: 'log',      label: 'Log',      icon: 'list' },
  { id: 'plan',     label: 'Plan',     icon: 'plate' },
  { id: 'insights', label: 'Insights', icon: 'chart' },
  { id: 'coach',    label: 'Coach',    icon: 'sparkle', badge: 'AI' },
];
const NAV_FOOT = [
  { id: 'community', label: 'Community',   icon: 'users' },
  { id: 'settings',  label: 'Settings',    icon: 'settings' },
  { id: 'help',      label: 'Need help?',  icon: 'help' },
];

function Sidebar({ route, setRoute, onRestart }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="assets/logo-dark.png" alt="GutHub" style={{ width: 'auto', height: 36, maxWidth: '100%' }} />
      </div>
      <div className="sidebar-tagline">AI Health Assistant</div>
      <nav className="nav">
        {NAV.map(n => (
          <button key={n.id} className={'nav-item ' + (route === n.id ? 'active' : '')}
                  onClick={() => setRoute(n.id)}>
            <Icon name={n.icon} size={18} />
            <span>{n.label}</span>
            {n.badge && <span className="badge">{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          onClick={onRestart}
          className="restart-btn"
          title="Replay the intake form to see the onboarding flow"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '9px 12px', marginBottom: 12,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--cream-50)',
            background: 'rgba(250, 245, 238, 0.1)',
            border: '1px solid rgba(250, 245, 238, 0.22)',
            borderRadius: 999, cursor: 'pointer',
          }}
        >
          <Icon name="refresh" size={14} />
          <span>Restart onboarding</span>
        </button>
        {NAV_FOOT.map(n => (
          <button key={n.id} className={'nav-item ' + (route === n.id ? 'active' : '')}
                  onClick={() => setRoute(n.id)}>
            <Icon name={n.icon} size={16} />
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function TopBar({ onQuickLog }) {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Icon name="search" size={16} />
        <input placeholder="Search meals, symptoms, conversations…" />
      </div>
      <div className="topbar-actions">
        <button className="btn btn-soft btn-sm" onClick={onQuickLog}>
          <Icon name="plus" size={14} /> Quick log
        </button>
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={18} />
          <span className="dot" />
        </button>
        <div className="avatar">{MOCK.user.initials}</div>
      </div>
    </header>
  );
}

function AppShell({ children, route, setRoute, onQuickLog, onRestart }) {
  return (
    <div className="app">
      <Sidebar route={route} setRoute={setRoute} onRestart={onRestart} />
      <main className="main">
        <TopBar onQuickLog={onQuickLog} />
        {children}
      </main>
    </div>
  );
}

window.AppShell = AppShell;
