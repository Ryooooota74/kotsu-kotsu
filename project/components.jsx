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

Object.assign(window, {
  AppCtx, Btn, IconBtn, Segmented, PillToggle, TagPill, Counter, CheckboxRow, Sheet,
});
