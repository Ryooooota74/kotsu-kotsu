// app.jsx — root App: store provider, responsive layout (phone / tablet /
// desktop chosen from the real viewport), page routing, modals, toast, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#111111",
  "checkStyle": "solid"
}/*EDITMODE-END*/;

// Pick the layout from the actual viewport width (no manual switcher):
//   < 768px  → phone (single column, bottom + button)
//   < 1200px → ipad  (sidebar + schedule)
//   ≥ 1200px → laptop (sidebar + schedule + mini-month)
function pickDevice(w) {
  if (w < 768) return 'phone';
  if (w < 1200) return 'ipad';
  return 'laptop';
}
function useViewport() {
  const [device, setDevice] = React.useState(() =>
    pickDevice(typeof window !== 'undefined' ? window.innerWidth : 1280));
  React.useEffect(() => {
    const onResize = () => setDevice(pickDevice(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return device;
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
      zIndex: 190, background: 'var(--text)', color: 'var(--bg)',
      fontSize: 13, fontWeight: 600, padding: '10px 16px', borderRadius: 999,
      boxShadow: '0 8px 24px rgba(0,0,0,0.22)', whiteSpace: 'nowrap',
      animation: 'toastIn .2s ease',
    }}>{msg}</div>
  );
}

// tiny cloud-sync status badge (only shown when sync is configured) — tap to refresh
function SyncBadge({ status, onRefresh }) {
  if (!status || status === 'off') return null;
  const map = {
    connecting: { dot: 'var(--muted)', label: 'Refreshing…' },
    saving:     { dot: '#f08c00',      label: 'Saving…' },
    synced:     { dot: '#0f9d6b',      label: 'Synced' },
    error:      { dot: '#e5484d',      label: 'Offline' },
  };
  const s = map[status] || map.connecting;
  const busy = status === 'connecting';
  return (
    <button type="button" onClick={() => { if (!busy && onRefresh) onRefresh(); }} disabled={busy}
      title={status === 'error'
        ? 'Could not reach the cloud — tap to retry. Changes are saved locally.'
        : 'Tap to refresh with the latest from your other devices'}
      style={{
        position: 'fixed', left: 14, bottom: 'calc(28px + env(safe-area-inset-bottom))', zIndex: 300,
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px',
        borderRadius: 999, background: 'rgba(255,255,255,0.9)', border: 'none',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: -0.1,
        cursor: busy ? 'default' : 'pointer', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {s.label}
      <IconReset size={13} style={{ color: 'var(--muted)', marginLeft: 1, animation: busy ? 'spin 0.8s linear infinite' : 'none' }} />
    </button>
  );
}

// phone layout — fills the whole screen (no device bezel)
function PhoneShell({ store, page, setPage, dkey, setDkey, toast }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [addCat, setAddCat] = React.useState(null);
  const [editId, setEditId] = React.useState(null);
  const [applyOpen, setApplyOpen] = React.useState(false);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <div className="scrollarea" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {page === 'tasks' && (
          <TasksPage page={page} setPage={setPage} dkey={dkey} setDkey={setDkey}
            onAdd={(c) => { setAddCat(c || null); setAddOpen(true); }} onApplyGroup={() => setApplyOpen(true)}
            onEditTask={(id) => setEditId(id)} />
        )}
        {page === 'todo' && <TodoPage page={page} setPage={setPage} dkey={dkey} toast={toast} />}
        {page === 'calendar' && <CalendarPage page={page} setPage={setPage} dkey={dkey} setDkey={setDkey} />}
        {page === 'groups' && <GroupsPage page={page} setPage={setPage} dkey={dkey} toast={toast} />}
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} dkey={dkey} defaultCat={addCat} toast={toast} />
      <AddTaskModal open={!!editId} editId={editId} onClose={() => setEditId(null)} dkey={dkey} />
      <ApplyGroupSheet open={applyOpen} onClose={() => setApplyOpen(false)} dkey={dkey} />

      {page === 'tasks' && (
        <button type="button" title="Add task"
          onClick={() => { setAddCat(null); setAddOpen(true); }}
          style={{
            position: 'absolute', right: 18, bottom: 'calc(26px + env(safe-area-inset-bottom))', zIndex: 60,
            width: 56, height: 56, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: 'var(--on-accent)',
            boxShadow: '0 10px 24px color-mix(in srgb, var(--accent) 44%, transparent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .12s, filter .12s',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
          <IconPlus size={27} sw={2.4} />
        </button>
      )}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const store = useStoreProvider();
  const device = useViewport();

  // remember the current page across reloads (and auto-update reloads)
  const [page, setPage] = React.useState(() => {
    try { const p = localStorage.getItem('taskmgr_page'); return ['tasks', 'todo', 'calendar', 'groups'].includes(p) ? p : 'tasks'; } catch (e) { return 'tasks'; }
  });
  React.useEffect(() => { try { localStorage.setItem('taskmgr_page', page); } catch (e) {} }, [page]);
  const [dkey, setDkey] = React.useState(() => dateKey(new Date()));
  const [toastMsg, setToastMsg] = React.useState('');
  const toastTimer = React.useRef(null);
  const toast = React.useCallback((m) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 1900);
  }, []);

  // tap the sync badge → pull latest and confirm with a toast
  const handleRefresh = React.useCallback(async () => {
    const r = await store.refresh();
    if (!r) return;
    toast(r.ok ? (r.changed ? 'Updated from the cloud' : 'Already up to date') : 'Couldn’t refresh — check your connection');
  }, [store, toast]);

  const accentVars = {
    '--accent': t.accent,
    '--accent-soft': `color-mix(in srgb, ${t.accent} 13%, #fff)`,
  };

  return (
    <StoreContext.Provider value={store}>
      <AppCtx.Provider value={{ checkStyle: t.checkStyle }}>
        <div style={{ ...accentVars, position: 'fixed', inset: 0, background: 'var(--bg)', overflow: 'hidden' }} data-device={device}>
          {device === 'phone'
            ? <PhoneShell store={store} page={page} setPage={setPage} dkey={dkey} setDkey={setDkey} toast={toast} />
            : <DesktopApp device={device} page={page} setPage={setPage} dkey={dkey} setDkey={setDkey} toast={toast} />}
          <Toast msg={toastMsg} />
        </div>

        <SyncBadge status={store.syncStatus} onRefresh={handleRefresh} />

        <TweaksPanel>
          <TweakSection label="Accent" />
          <TweakColor label="Accent color" value={t.accent}
            options={['#1f6feb', '#e8590c', '#0f9d6b', '#7048e8', '#111111']}
            onChange={(v) => setTweak('accent', v)} />
          <TweakSection label="Checkboxes" />
          <TweakRadio label="Fill style" value={t.checkStyle}
            options={[{ value: 'solid', label: 'Solid' }, { value: 'check', label: 'Checkmark' }]}
            onChange={(v) => setTweak('checkStyle', v)} />
        </TweaksPanel>
      </AppCtx.Provider>
    </StoreContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
