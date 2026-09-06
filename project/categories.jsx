// categories.jsx — category UI: dot, switcher pills, selectors, manage sheet
// Exports to window: CATEGORY_COLORS, CatDot, CategoryPill, AllPill, CategoryPills,
//   CategorySelect, ManageCategoriesSheet

const CATEGORY_COLORS = ['#2f6feb', '#0f9d6b', '#e8590c', '#7048e8', '#d6336c', '#0c8599', '#f08c00', '#5c6b7a'];

// long-press hook: fires after ~480ms hold; cancels on move/scroll/release
function useLongPress(onLongPress, onClick) {
  const timer = React.useRef(null);
  const fired = React.useRef(false);
  const start = React.useRef([0, 0]);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const onDown = (e) => {
    fired.current = false;
    const p = e.touches ? e.touches[0] : e;
    start.current = [p.clientX, p.clientY];
    clear();
    timer.current = setTimeout(() => { fired.current = true; onLongPress && onLongPress(e); }, 480);
  };
  const onMove = (e) => {
    const p = e.touches ? e.touches[0] : e;
    if (Math.abs(p.clientX - start.current[0]) > 8 || Math.abs(p.clientY - start.current[1]) > 8) clear();
  };
  const onUp = (e) => {
    clear();
    if (!fired.current && onClick) onClick(e);
  };
  return {
    onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: clear,
    onTouchStart: onDown, onTouchMove: onMove, onTouchEnd: onUp,
    onContextMenu: (e) => { e.preventDefault(); onLongPress && onLongPress(e); },
  };
}

function CatDot({ color, size = 9, ring }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, background: color, flexShrink: 0,
      boxShadow: ring ? '0 0 0 2px rgba(255,255,255,0.55)' : 'none',
    }} />
  );
}

// ── color picker: preset swatches + a custom (any) color ──────
function CategoryColorPicker({ value, onChange, size = 26 }) {
  const isCustom = value && !CATEGORY_COLORS.includes(value);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, alignItems: 'center' }}>
      {CATEGORY_COLORS.map(col => (
        <button type="button" key={col} onClick={() => onChange(col)}
          style={{
            width: size, height: size, borderRadius: 999, background: col, cursor: 'pointer',
            border: col === value ? '2px solid var(--text)' : '2px solid transparent',
            boxShadow: '0 0 0 1px var(--border)',
          }} />
      ))}
      {/* custom: native color picker behind a swatch (rainbow until a custom color is set) */}
      <label title="Custom color"
        style={{
          position: 'relative', width: size, height: size, borderRadius: 999, cursor: 'pointer',
          flexShrink: 0,
          background: isCustom ? value : 'conic-gradient(from 0deg, #e5484d, #f08c00, #0f9d6b, #2f6feb, #7048e8, #d6336c, #e5484d)',
          border: isCustom ? '2px solid var(--text)' : '2px solid transparent',
          boxShadow: '0 0 0 1px var(--border)',
        }}>
        <input type="color" value={isCustom ? value : '#888888'}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }} />
      </label>
    </div>
  );
}

// ── switcher pill (Tasks page) ────────────────────────────────
function CategoryPill({ cat, active, count, onClick, onLongPress }) {
  const handlers = useLongPress(onLongPress, onClick);
  return (
    <button type="button" {...handlers}
      style={{
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
        WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none',
        border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
        background: active ? 'var(--accent)' : 'var(--bg)',
        color: active ? 'var(--on-accent)' : 'var(--text2)',
        fontFamily: 'inherit', fontWeight: 600, fontSize: 13, letterSpacing: -0.1,
        transition: 'background .14s, color .14s, border-color .14s',
      }}>
      {cat.color && <CatDot color={cat.color} ring={active} />}
      {cat.name}
      <span style={{
        fontVariantNumeric: 'tabular-nums', fontSize: 11.5, fontWeight: 700,
        minWidth: 17, height: 17, padding: '0 5px', borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
        color: active ? 'var(--on-accent)' : 'var(--text2)',
      }}>{count}</span>
    </button>
  );
}

// ── wrap selector (Add / forms) ───────────────────────────────
function CategoryPills({ categories, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {categories.map(c => {
        const active = value === c.id;
        return (
          <button type="button" key={c.id} onClick={() => onChange(c.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
              border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
              background: active ? 'var(--accent-soft)' : 'var(--bg)',
              color: active ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            }}>
            <CatDot color={c.color} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

// ── compact dropdown (group editor rows) ──────────────────────
function CategorySelect({ categories, value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const cat = categories.find(c => c.id === value) || categories[0] || { name: '—', color: '#aaa' };
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 150,
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg)',
          color: 'var(--text)', fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5,
        }}>
        <CatDot color={cat.color} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
        <IconCaretDown size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 160 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 170,
            minWidth: 150, maxHeight: 220, overflowY: 'auto',
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.16)', padding: 5,
          }}>
            {categories.map(c => (
              <button type="button" key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  padding: '8px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: c.id === value ? 'var(--bg3)' : 'transparent',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--text)',
                }}>
                <CatDot color={c.color} />
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── manage sheet ──────────────────────────────────────────────
function CategoryRow({ cat, index, total }) {
  const { data, actions } = React.useContext(StoreContext);
  const [showColors, setShowColors] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const usage = categoryUsage(data, cat.id);
  const fallback = (data.categories.find(c => c.id !== cat.id) || {});

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 8px 8px 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconBtn size={22} onClick={() => actions.moveCategory(cat.id, -1)} title="Move up" style={{ opacity: index === 0 ? 0.3 : 1 }}><IconCaretUp size={15} /></IconBtn>
          <IconBtn size={22} onClick={() => actions.moveCategory(cat.id, 1)} title="Move down" style={{ opacity: index === total - 1 ? 0.3 : 1 }}><IconCaretDown size={15} /></IconBtn>
        </div>
        <button type="button" onClick={() => setShowColors(s => !s)} title="Change color"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'inline-flex', flexShrink: 0 }}>
          <CatDot color={cat.color} size={16} />
        </button>
        <input value={cat.name} onChange={e => actions.updateCategory(cat.id, { name: e.target.value })}
          placeholder="Category name" className="inp"
          style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, padding: '8px 10px' }} />
        <IconBtn size={28} danger onClick={() => setConfirming(true)} title="Delete"
          style={{ opacity: total <= 1 ? 0.3 : 1, pointerEvents: total <= 1 ? 'none' : 'auto' }}>
          <IconTrash size={16} />
        </IconBtn>
      </div>

      {showColors && (
        <div style={{ padding: '10px 4px 4px 4px' }}>
          <CategoryColorPicker value={cat.color} size={24}
            onChange={col => actions.updateCategory(cat.id, { color: col })} />
        </div>
      )}

      {confirming && (
        <div style={{ marginTop: 8, padding: '9px 10px', background: 'var(--bg2)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>
            {usage > 0
              ? `Delete “${cat.name}”? ${usage} item${usage > 1 ? 's' : ''} use it — tasks move to “${fallback.name}”, to-dos become uncategorised.`
              : `Delete “${cat.name}”?`}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Btn>
            <Btn variant="primary" size="sm" style={{ background: '#e5484d' }}
              onClick={() => { actions.deleteCategory(cat.id, fallback.id); setConfirming(false); }}>Delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// long-press action sheet for a single category (rename / recolor / delete)
function CategoryActionSheet({ open, catId, onClose, onManageAll }) {
  const { data, actions } = React.useContext(StoreContext);
  const cat = (data.categories || []).find(c => c.id === catId);
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(() => { if (open) setConfirming(false); }, [open, catId]);
  if (!cat) return null;

  const usage = categoryUsage(data, cat.id);
  const fallback = (data.categories.find(c => c.id !== cat.id) || {});
  const canDelete = data.categories.length > 1;

  return (
    <Sheet open={open} onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 18px 10px' }}>
        <CatDot color={cat.color} size={13} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>

      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* rename */}
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Name</div>
          <input value={cat.name} onChange={e => actions.updateCategory(cat.id, { name: e.target.value })}
            placeholder="Category name" className="inp"
            style={{ width: '100%', fontSize: 15, fontWeight: 600, padding: '10px 12px' }} />
        </div>

        {/* color */}
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Color</div>
          <CategoryColorPicker value={cat.color} size={28}
            onChange={col => actions.updateCategory(cat.id, { color: col })} />
        </div>

        {/* delete */}
        {confirming ? (
          <div style={{ padding: '12px 13px', background: 'var(--bg2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 11, lineHeight: 1.45 }}>
              {usage > 0
                ? `Delete “${cat.name}”? ${usage} item${usage > 1 ? 's' : ''} use it — tasks move to “${fallback.name}”, to-dos become uncategorised.`
                : `Delete “${cat.name}”? This can’t be undone.`}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" style={{ background: '#e5484d' }}
                onClick={() => { actions.deleteCategory(cat.id, fallback.id); onClose(); }}>
                <IconTrash size={14} /> Delete
              </Btn>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => canDelete && setConfirming(true)} disabled={!canDelete}
            title={canDelete ? '' : 'Keep at least one category'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', borderRadius: 10, cursor: canDelete ? 'pointer' : 'not-allowed',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: canDelete ? '#e5484d' : 'var(--muted)',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13.5,
            }}>
            <IconTrash size={16} /> Delete category
          </button>
        )}

        <button type="button" onClick={onManageAll}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '2px 0',
          }}>Manage all categories →</button>
      </div>
    </Sheet>
  );
}

function ManageCategoriesSheet({ open, onClose }) {
  const { data, actions } = React.useContext(StoreContext);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(CATEGORY_COLORS[0]);

  React.useEffect(() => {
    if (open) {
      setName('');
      // pick a color not already used, if possible
      const used = new Set((data.categories || []).map(c => c.color));
      setColor(CATEGORY_COLORS.find(c => !used.has(c)) || CATEGORY_COLORS[0]);
    }
  }, [open]);

  const add = () => {
    const n = name.trim(); if (!n) return;
    actions.addCategory({ name: n, color });
    setName('');
    const used = new Set([...(data.categories || []).map(c => c.color), color]);
    setColor(CATEGORY_COLORS.find(c => !used.has(c)) || CATEGORY_COLORS[0]);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Categories</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>

      <div style={{ overflow: 'auto', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* add row */}
        <div style={{ border: '1px dashed var(--border2)', borderRadius: 12, padding: 12, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder="New category" className="inp"
              style={{ flex: 1, fontSize: 14, fontWeight: 600, padding: '9px 11px', background: 'var(--bg)' }} />
            <Btn variant="primary" size="sm" onClick={add} disabled={!name.trim()}><IconPlus size={14} /> Add</Btn>
          </div>
          <div style={{ marginTop: 11 }}>
            <CategoryColorPicker value={color} size={22} onChange={setColor} />
          </div>
        </div>

        {/* list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.categories.map((c, i) => (
            <CategoryRow key={c.id} cat={c} index={i} total={data.categories.length} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

Object.assign(window, {
  CATEGORY_COLORS, CatDot, CategoryPill, CategoryPills, CategorySelect,
  CategoryActionSheet, ManageCategoriesSheet,
});
