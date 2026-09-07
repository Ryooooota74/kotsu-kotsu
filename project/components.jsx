// components.jsx — shared UI primitives. Exports to window.
// AppCtx carries { checkStyle } so the checkbox row can switch fill style live.

const AppCtx = React.createContext({ checkStyle: 'solid' });

// ── Button ────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, style, title, type }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent', borderRadius: 999, whiteSpace: 'nowrap',
    transition: 'background .14s, border-color .14s, color .14s, opacity .14s',
    fontSize: size === 'sm' ? 12.5 : 13.5,
    padding: size === 'sm' ? '6px 12px' : '9px 16px',
    lineHeight: 1, letterSpacing: -0.1,
  };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--on-accent)', opacity: disabled ? 0.4 : 1 },
    outline: { background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border2)' },
    ghost: { background: 'transparent', color: 'var(--text2)' },
    accentGhost: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  };
  return (
    <button type={type || 'button'} title={title} onClick={disabled ? undefined : onClick} disabled={disabled}
      className={'btn btn-' + variant}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// round icon button
function IconBtn({ children, onClick, title, size = 32, danger, style, className }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={'iconbtn ' + (danger ? 'iconbtn-danger ' : '') + (className || '')}
      style={{
        width: size, height: size, borderRadius: 8, border: 'none', background: 'transparent',
        color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, transition: 'background .14s, color .14s', ...style,
      }}>
      {children}
    </button>
  );
}

// ── Segmented control (Work / Personal in forms) ──────────────
function Segmented({ value, onChange, options }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 3, gap: 3,
    }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button type="button" key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer', borderRadius: 6,
              padding: '7px 10px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: active ? 'var(--bg)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text2)',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'background .14s, color .14s',
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Pill toggle with count badge (Work / Personal switcher) ───
function PillToggle({ active, onClick, label, count }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: '9px 12px', borderRadius: 999, cursor: 'pointer',
        border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
        background: active ? 'var(--accent)' : 'var(--bg)',
        color: active ? 'var(--on-accent)' : 'var(--text2)',
        fontFamily: 'inherit', fontWeight: 600, fontSize: 13, letterSpacing: -0.1,
        transition: 'background .14s, color .14s, border-color .14s',
      }}>
      {label}
      <span style={{
        fontVariantNumeric: 'tabular-nums', fontSize: 11.5, fontWeight: 700,
        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
        color: active ? 'var(--on-accent)' : 'var(--text2)',
      }}>{count}</span>
    </button>
  );
}

// ── Tag pill ──────────────────────────────────────────────────
function TagPill({ children, tone = 'neutral', style }) {
  const tones = {
    neutral: { background: 'var(--bg3)', color: 'var(--text2)' },
    accent: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  };
  return (
    <span style={{
      ...tones[tone], fontSize: 11, fontWeight: 600, letterSpacing: -0.05,
      padding: '3px 8px', borderRadius: 999, lineHeight: 1.4, whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums', ...style,
    }}>{children}</span>
  );
}

// ── Counter (− N× +) ──────────────────────────────────────────
function Counter({ value, onChange, min = 1, max = 10, suffix = '×' }) {
  const btn = (label, fn, disabled) => (
    <button type="button" onClick={disabled ? undefined : fn} disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)',
        background: 'var(--bg)', color: disabled ? 'var(--muted)' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {btn(<IconMinus size={15} />, () => onChange(value - 1), value <= min)}
      <span style={{
        minWidth: 34, textAlign: 'center', fontWeight: 600, fontSize: 14,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}{suffix}</span>
      {btn(<IconPlus size={15} />, () => onChange(value + 1), value >= max)}
    </div>
  );
}

// ── Checkbox row (the signature control) ──────────────────────
function CheckboxRow({ completedCount, totalBoxes, onChange, onAddBox, onRemoveBox, boxSize = 20, showCtrls = true }) {
  const { checkStyle } = React.useContext(AppCtx);
  const click = (i) => {
    const next = (i + 1 <= completedCount) ? i : i + 1;
    onChange(next);
  };
  return (
    <div className="cbrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {onRemoveBox && (
        <button type="button" className="box-ctrl" title="Fewer" onClick={onRemoveBox}
          style={ctrlBtn(boxSize)}><IconMinus size={13} /></button>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {Array.from({ length: totalBoxes }).map((_, i) => {
          const filled = i < completedCount;
          return (
            <button type="button" key={i} onClick={() => click(i)} aria-label={`box ${i + 1}`}
              style={{
                width: boxSize, height: boxSize, borderRadius: Math.max(4, boxSize * 0.28),
                border: '1.5px solid ' + (filled ? 'var(--accent)' : 'var(--border2)'),
                background: (filled && checkStyle === 'solid') ? 'var(--accent)' : 'var(--bg)',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
                transition: 'background .12s, border-color .12s',
              }}>
              {filled && checkStyle === 'check' && (
                <IconCheck size={boxSize - 5} sw={2.4} style={{ color: 'var(--accent)' }} />
              )}
            </button>
          );
        })}
      </div>
      {onAddBox && totalBoxes < 10 && (
        <button type="button" className="box-ctrl" title="More" onClick={onAddBox}
          style={ctrlBtn(boxSize)}><IconPlus size={13} /></button>
      )}
    </div>
  );
}
function ctrlBtn(boxSize) {
  return {
    width: boxSize, height: boxSize, borderRadius: 6, border: 'none',
    background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
}

// ── Bottom sheet / modal shell ────────────────────────────────
function Sheet({ open, onClose, children, maxWidth = 480 }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (open) { const t = setTimeout(() => setShow(true), 10); return () => clearTimeout(t); }
    setShow(false);
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: show ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0)',
        backdropFilter: show ? 'blur(3px)' : 'none',
        WebkitBackdropFilter: show ? 'blur(3px)' : 'none',
        transition: 'background .22s',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth, background: 'var(--bg)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          transform: show ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .26s cubic-bezier(.22,1,.36,1)',
          maxHeight: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 2, flexShrink: 0 }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: 'var(--border2)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── crash screen ──────────────────────────────────────────────
// A throw anywhere in the tree used to blank the page, stranding the user with
// their data in localStorage and no way to get it out. This reads localStorage
// directly, so it still works when the store itself is what broke.
function CrashScreen({ error }) {
  const [saved, setSaved] = React.useState(false);
  const raw = (() => { try { return localStorage.getItem('taskmgr_v4'); } catch (e) { return null; } })();

  const save = () => {
    try {
      const blob = new Blob([raw || '{}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kotsu-kotsu-rescue.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setSaved(true);
    } catch (e) {}
  };

  const btn = {
    fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: '10px 16px',
    borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border2)',
    background: 'var(--bg)', color: 'var(--text)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, marginBottom: 8 }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 18 }}>
          Your tasks are still saved on this device — nothing has been deleted. Save a copy
          before reloading, just in case.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          <button type="button" onClick={save} style={{ ...btn, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            {saved ? 'Saved ✓' : 'Save my data'}
          </button>
          <button type="button" onClick={() => location.reload()} style={btn}>Reload</button>
          <button type="button" style={btn}
            onClick={() => {
              // view state (which page, which groups are collapsed) is a common cause;
              // clearing it never touches the tasks themselves
              try { localStorage.removeItem('taskmgr_page'); localStorage.removeItem('taskmgr_collapsed'); } catch (e) {}
              location.reload();
            }}>Reset the view</button>
        </div>

        <details style={{ fontSize: 12, color: 'var(--muted)' }}>
          <summary style={{ cursor: 'pointer' }}>Error details</summary>
          <pre style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8,
            fontSize: 11.5, lineHeight: 1.5, color: 'var(--text2)',
          }}>{String((error && (error.stack || error.message)) || error)}</pre>
        </details>
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[crash]', error, info && info.componentStack); }
  render() {
    return this.state.error ? <CrashScreen error={this.state.error} /> : this.props.children;
  }
}

// ── backup / restore ──────────────────────────────────────────
// Sync is last-write-wins across devices, so a bad merge can wipe real work. This
// gives a plain JSON file you can keep, and a way to put it back.
function useBackup(toast) {
  const { data, actions } = React.useContext(StoreContext);
  const inputRef = React.useRef(null);
  const [pending, setPending] = React.useState(null); // parsed file awaiting confirmation

  const exportNow = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kotsu-kotsu-' + dateKey(new Date()) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('Backup saved');
    } catch (e) {
      toast('Could not save the backup');
    }
  };

  const pickImport = () => { if (inputRef.current) inputRef.current.click(); };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same file be picked again
    if (!f) return;
    const r = new FileReader();
    r.onerror = () => toast('Could not read that file');
    r.onload = () => {
      let obj = null;
      try { obj = JSON.parse(String(r.result)); } catch (err) { obj = null; }
      if (!obj || typeof obj !== 'object' || (!obj.days && !obj.todos && !obj.groups)) {
        toast('That file isn’t a Kotsu-Kotsu backup');
        return;
      }
      setPending(obj);
    };
    r.readAsText(f);
  };

  const counts = pending ? [
    Object.keys(pending.days || {}).length + ' days',
    (pending.todos || []).length + ' to-dos',
    (pending.groups || []).length + ' groups',
  ].join(' · ') : '';

  const ui = (
    <React.Fragment>
      <input ref={inputRef} type="file" accept="application/json,.json"
        onChange={onFile} style={{ display: 'none' }} />
      <ConfirmSheet open={!!pending} title="Restore backup"
        message={'Replace everything on this device — and in the cloud — with this file? (' + counts + ') This can’t be undone.'}
        confirmLabel="Restore"
        onConfirm={() => { actions.replaceAll(pending); setPending(null); toast('Backup restored'); }}
        onClose={() => setPending(null)} />
    </React.Fragment>
  );

  return { exportNow, pickImport, ui };
}

Object.assign(window, {
  AppCtx, Btn, IconBtn, Segmented, PillToggle, TagPill, Counter, CheckboxRow, Sheet, useBackup, AppErrorBoundary, CrashScreen,
});
