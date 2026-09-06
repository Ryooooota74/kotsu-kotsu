// header.jsx — shared sticky header chrome: wordmark, page tabs.
// Exports: AppHeader, StickyHeader

const PAGES = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'todo', label: 'To-do' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'groups', label: 'Groups' },
];

function StickyHeader({ children }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)',
      paddingTop: 'calc(10px + env(safe-area-inset-top))', borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

function AppHeader({ page, setPage, actions }) {
  return (
    <div>
      {/* top row: wordmark + page actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px 10px', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="icon-192.png" alt="" width={24} height={24}
            style={{ borderRadius: 6, display: 'block', flexShrink: 0 }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>Kotsu-Kotsu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>
      </div>

      {/* page tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px' }}>
        {PAGES.map(p => {
          const active = page === p.key;
          return (
            <button type="button" key={p.key} onClick={() => setPage(p.key)}
              style={{
                position: 'relative', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13.5,
                padding: '8px 12px 11px', letterSpacing: -0.1,
                color: active ? 'var(--accent)' : 'var(--text2)',
                transition: 'color .14s',
              }}>
              {p.label}
              <span style={{
                position: 'absolute', left: 12, right: 12, bottom: 0, height: 2.5,
                borderRadius: 3, background: 'var(--accent)',
                opacity: active ? 1 : 0, transition: 'opacity .14s',
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { AppHeader, StickyHeader });
