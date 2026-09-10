// projects.jsx — To-do backlog: single tasks with soft deadlines.
// Exports to window: TodoPage, EmptyState

// upcoming Saturday from today
function nextWeekendKey() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const delta = (6 - d.getDay() + 7) % 7 || 7; // next Sat (never today)
  return dateKey(addDays(d, delta));
}

const DUE_TONES = {
  over: { background: '#fdecec', color: '#e5484d' },
  today: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  soon: { background: 'var(--bg3)', color: 'var(--text2)' },
  far: { background: 'var(--bg3)', color: 'var(--text2)' },
};

function DuePill({ due }) {
  const info = dueInfo(due);
  if (!info.label) return <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>No date</span>;
  const tone = DUE_TONES[info.tone] || DUE_TONES.soon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, ...tone,
      fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <IconCalendar size={12} /> {info.label}
    </span>
  );
}

// ── Due-date picker (chips + calendar) ────────────────────────
function DuePicker({ value, onChange }) {
  const [calOpen, setCalOpen] = React.useState(false);
  const todayKey = dateKey(new Date());
  const tomKey = dateKey(addDays(new Date(), 1));
  const wkndKey = nextWeekendKey();
  const chips = [
    { label: 'None', val: null },
    { label: 'Today', val: todayKey },
    { label: 'Tomorrow', val: tomKey },
    { label: 'Weekend', val: wkndKey },
  ];
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {chips.map(c => {
          const active = value === c.val;
          return (
            <button type="button" key={c.label} onClick={() => onChange(c.val)}
              style={{
                border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
                background: active ? 'var(--accent)' : 'var(--bg)',
                color: active ? 'var(--on-accent)' : 'var(--text2)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                padding: '6px 11px', borderRadius: 999,
              }}>{c.label}</button>
          );
        })}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setCalOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              border: '1px solid ' + (calOpen ? 'var(--accent)' : 'var(--border)'),
              background: 'var(--bg)', color: 'var(--text2)',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              padding: '6px 11px', borderRadius: 999,
            }}>
            <IconCalendar size={13} /> Pick…
          </button>
          {calOpen && (
            <CalendarPopover selected={value || todayKey} recordKeys={new Set()}
              popStyle={{ left: 0, right: 'auto', marginLeft: 0, width: 300 }}
              onSelect={(k) => { onChange(k); setCalOpen(false); }}
              onClose={() => setCalOpen(false)} />
          )}
        </div>
      </div>
      {value && (
        <div style={{ marginTop: 9 }}><DuePill due={value} /></div>
      )}
    </div>
  );
}

// optional category picker (includes a "None" choice)
function TodoCategoryPicker({ categories, value, onChange }) {
  const opt = (active, color, label, onClick) => (
    <button type="button" key={label} onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
        border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        background: active ? 'var(--accent-soft)' : 'var(--bg)',
        color: active ? 'var(--accent)' : 'var(--text2)',
        fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
      }}>
      {color ? <CatDot color={color} /> : null}
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opt(!value, null, 'None', () => onChange(null))}
      {categories.map(c => opt(value === c.id, c.color, c.name, () => onChange(c.id)))}
    </div>
  );
}

// ── To-do create / edit form ──────────────────────────────────
function TodoForm({ initial, onCancel, onSave }) {
  const { data } = React.useContext(StoreContext);
  const [title, setTitle] = React.useState(initial?.title || '');
  const [due, setDue] = React.useState(initial?.due ?? null);
  const [category, setCategory] = React.useState(initial?.category ?? null);
  const [subs, setSubs] = React.useState(() => (initial?.subtasks || []).map(s => ({ id: uid(), title: s.title, totalBoxes: s.totalBoxes || 1 })));
  const addSub = () => setSubs(s => [...s, { id: uid(), title: '', totalBoxes: 1 }]);
  const setSub = (id, t) => setSubs(s => s.map(x => x.id === id ? { ...x, title: t } : x));
  const delSub = (id) => setSubs(s => s.filter(x => x.id !== id));
  const save = () => {
    const n = title.trim(); if (!n) return;
    onSave({ title: n, due, category,
      subtasks: subs.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), totalBoxes: s.totalBoxes || 1 })) });
  };
  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 12, padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={enterSubmits(save)}
        placeholder="What do you need to do?" className="inp"
        style={{ width: '100%', fontSize: 15, fontWeight: 600, padding: '10px 12px', background: 'var(--bg)' }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 9 }}>Category (optional)</div>
        <TodoCategoryPicker categories={data.categories || []} value={category} onChange={setCategory} />
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 9 }}>Due (optional)</div>
        <DuePicker value={due} onChange={setDue} />
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 9 }}>Subtasks (optional)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={s.title} onChange={e => setSub(s.id, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addSub(); }}
                placeholder="Subtask" className="inp"
                style={{ flex: 1, fontSize: 13, padding: '9px 11px', background: 'var(--bg)' }} />
              <IconBtn danger onClick={() => delSub(s.id)} title="Remove"><IconClose size={16} /></IconBtn>
            </div>
          ))}
          <button type="button" onClick={addSub} className="dashed-add">
            <IconPlus size={15} /> Add subtask
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()} style={{ flex: 2 }}>Save</Btn>
      </div>
    </div>
  );
}

// ── To-do card ────────────────────────────────────────────────
function TodoCard({ todo, dkey, todayKey, addedToday, toast, onEdit, dragHandle, dragging }) {
  const { data, actions } = React.useContext(StoreContext);
  const info = dueInfo(todo.due);
  // optional category color-coding on the drag handle (falls back to the neutral grip)
  const catColor = todo.category ? getCat(data, todo.category).color : null;
  const cardBorder = dragging ? 'var(--accent)' : (catColor || 'var(--border)');
  const bw = catColor ? 1.5 : 1;
  return (
    <div className="task-card" style={{
      borderRadius: 8, padding: '6px 8px 6px 11px', background: 'var(--bg)',
      border: `${bw}px solid ${cardBorder}`,
      borderLeft: (!catColor && info.tone === 'over') ? '3px solid #e5484d' : `${bw}px solid ${cardBorder}`,
      boxShadow: dragging ? '0 10px 24px rgba(0,0,0,0.14)' : 'none',
      transition: 'box-shadow .14s, border-color .14s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {dragHandle && (
          <span onPointerDown={dragHandle} title={catColor ? getCat(data, todo.category).name + ' — drag to reorder' : 'Drag to reorder'}
            style={{
              cursor: 'grab', color: catColor || 'var(--muted)', display: 'inline-flex', flexShrink: 0,
              touchAction: 'none', marginLeft: -3, padding: '2px 0',
            }}>
            <IconGrip size={16} />
          </span>
        )}
        <span style={{ flex: '1 1 140px', minWidth: 0, fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{todo.title}</span>

        {/* meta + actions — wraps to a second line on narrow screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          {todo.due && <DuePill due={todo.due} />}
          {(todo.subtasks || []).length > 0 && (
            <span title={`${todo.subtasks.length} subtask${todo.subtasks.length === 1 ? '' : 's'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>
              <IconCheck size={12} /> {todo.subtasks.length}
            </span>
          )}
          {addedToday ? (
            <span title="On today’s list" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)', flexShrink: 0, padding: '0 4px' }}>
              <IconCheck size={15} /> Added
            </span>
          ) : (
            <Btn variant="accentGhost" size="sm" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={() => {
                actions.addTask(todayKey, { title: todo.title, category: todo.category || defaultCategoryId(data), totalBoxes: 1, subtasks: todo.subtasks || [], fromTodoId: todo.id });
                toast(`Added “${todo.title}” to today`);
              }}><IconPlus size={14} /> Add to today</Btn>
          )}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <IconBtn className="del-btn" size={26} onClick={() => onEdit(todo)} title="Edit"><IconPencil size={16} /></IconBtn>
            <IconBtn className="del-btn" size={26} danger onClick={() => actions.deleteTodo(todo.id)} title="Delete"><IconTrash size={16} /></IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Divider row — a standalone separator you can drag anywhere ─
function DividerRow({ divider, actions, dragHandle, dragging }) {
  // size the label to its text — CJK glyphs are about twice as wide as latin ones
  const label = divider.label || '';
  const labelWidth = Math.min(240, Math.max(72,
    [...label].reduce((n, ch) => n + (/[　-鿿가-힯＀-￯]/.test(ch) ? 15 : 8), 0) + 26));
  return (
    <div className="task-card" style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 2px 2px',
      background: 'transparent', border: 'none',
      opacity: dragging ? 1 : undefined,
    }}>
      {dragHandle && (
        <span onPointerDown={dragHandle} title="Drag to move the line"
          style={{
            cursor: 'grab', color: 'var(--muted)', display: 'inline-flex', flexShrink: 0,
            touchAction: 'none', padding: '4px 0',
          }}>
          <IconGrip size={16} />
        </span>
      )}
      <span style={{ flex: 1, height: 0, borderTop: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}` }} />
      <input value={label} onChange={e => actions.updateTodo(divider.id, { label: e.target.value })}
        placeholder="Label…" title="Name this section"
        style={{
          flexShrink: 0, width: labelWidth,
          textAlign: 'center', border: 'none', outline: 'none', borderRadius: 999,
          background: 'var(--bg3)', color: 'var(--text2)', padding: '4px 10px',
          fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2,
        }} />
      <span style={{ flex: 1, height: 0, borderTop: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}` }} />
      <IconBtn className="del-btn" size={24} danger title="Remove line"
        onClick={() => actions.deleteTodo(divider.id)}><IconClose size={14} /></IconBtn>
    </div>
  );
}

// ── Sortable to-do list (pointer-based drag to reorder) ───────
// columns > 1 renders a grid; hit-testing checks both axes so it works either way.
function SortableTodoList({ todos, actions, todayKey, addedSet, dkey, toast, mode, onEdit, onCancelEdit, onSaveEdit, columns = 1 }) {
  const [order, setOrder] = React.useState(todos);
  const [dragId, setDragId] = React.useState(null);
  const orderRef = React.useRef(todos);
  const rowRefs = React.useRef(new Map());

  React.useEffect(() => {
    if (dragId == null) { orderRef.current = todos; setOrder(todos); }
  }, [todos, dragId]);

  const setOrd = (next) => { orderRef.current = next; setOrder(next); };

  const startDrag = (id) => (e) => {
    e.preventDefault();
    setDragId(id);
    document.body.style.userSelect = 'none';
    const move = (ev) => {
      const x = ev.clientX, y = ev.clientY;
      let targetId = null;
      for (const [rid, el] of rowRefs.current.entries()) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { targetId = rid; break; }
      }
      if (targetId && targetId !== id) {
        const cur = orderRef.current;
        const from = cur.findIndex(t => t.id === id);
        const to = cur.findIndex(t => t.id === targetId);
        if (from >= 0 && to >= 0) {
          const a = [...cur];
          const [m] = a.splice(from, 1);
          a.splice(to, 0, m);
          setOrd(a);
        }
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.style.userSelect = '';
      setDragId(null);
      actions.reorderTodos(orderRef.current.map(t => t.id));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    // the OS can take the gesture away mid-drag (scroll takeover, a call, an edge
    // swipe). Without this the drag never ends: the listeners stay attached and the
    // list keeps following the pointer with nothing held down.
    window.addEventListener('pointercancel', up);
  };

  const containerStyle = columns > 1
    ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 12, alignItems: 'start' }
    : { display: 'flex', flexDirection: 'column', gap: 8 };

  return (
    <div style={containerStyle}>
      {order.map(t => (
        <div key={t.id}
          ref={el => { if (el) rowRefs.current.set(t.id, el); else rowRefs.current.delete(t.id); }}>
          {t.type === 'divider' ? (
            <DividerRow divider={t} actions={actions}
              dragHandle={startDrag(t.id)} dragging={dragId === t.id} />
          ) : mode && mode.id === t.id ? (
            <TodoForm initial={t} onCancel={onCancelEdit} onSave={(nt) => onSaveEdit(t.id, nt)} />
          ) : (
            <TodoCard todo={t} dkey={dkey} todayKey={todayKey}
              addedToday={addedSet.has(t.id)} toast={toast} onEdit={onEdit}
              dragHandle={startDrag(t.id)} dragging={dragId === t.id} />
          )}
        </div>
      ))}
    </div>
  );
}

function TodoPage({ page, setPage, dkey, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const [mode, setMode] = React.useState(null); // null | 'new' | todo
  const [catFilter, setCatFilter] = React.useState('all'); // 'all' | 'none' | catId
  const todayKey = dateKey(new Date());
  const cats = data.categories || [];

  // manual order: respect the stored backlog order (drag to reorder).
  // dividers live in the same list but are separators, not to-dos.
  const allEntries = data.todos || [];
  const realTodos = React.useMemo(() => allEntries.filter(t => t.type !== 'divider'), [allEntries]);
  const catCounts = React.useMemo(() => {
    const m = {};
    realTodos.forEach(t => { const k = t.category || 'none'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [realTodos]);
  // a filtered view is partial, so dividers only make sense in the "All" view
  const todos = React.useMemo(() => (
    catFilter === 'all' ? allEntries
      : catFilter === 'none' ? realTodos.filter(t => !t.category)
        : realTodos.filter(t => t.category === catFilter)
  ), [allEntries, realTodos, catFilter]);

  // which todos already have an incomplete task on today's list
  const addedSet = React.useMemo(() => {
    const s = new Set();
    (data.days[todayKey] || []).forEach(t => {
      if (t.fromTodoId && t.completedCount < t.totalBoxes) s.add(t.fromTodoId);
    });
    return s;
  }, [data.days, todayKey]);

  return (
    <div>
      <StickyHeader>
        <AppHeader page={page} setPage={setPage} actions={
          <Btn variant="primary" size="sm" onClick={() => setMode('new')}><IconPlus size={15} /> New</Btn>
        } />
      </StickyHeader>

      <div style={{ padding: '14px 14px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text2)', padding: '0 2px 2px' }}>
          Things to do soon — drag the handle to reorder. Add one to a day when you’re ready to tackle it.
        </div>

        {/* category filter — shows every category so you can always pick one */}
        {realTodos.length > 0 && (
          <div className="scrollarea" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 4px', alignItems: 'center' }}>
            <CategoryPill cat={{ name: 'All' }} active={catFilter === 'all'} count={realTodos.length} onClick={() => setCatFilter('all')} />
            {cats.map(c => (
              <CategoryPill key={c.id} cat={c} active={catFilter === c.id} count={catCounts[c.id] || 0} onClick={() => setCatFilter(c.id)} />
            ))}
            {catCounts['none'] > 0 && (
              <CategoryPill cat={{ name: 'No category' }} active={catFilter === 'none'} count={catCounts['none']} onClick={() => setCatFilter('none')} />
            )}
          </div>
        )}

        {mode === 'new' && (
          <TodoForm onCancel={() => setMode(null)} onSave={(t) => { actions.addTodo(t); setMode(null); toast('Added to To-do'); }} />
        )}

        {realTodos.length === 0 && mode !== 'new' ? (
          <EmptyState mark={<MarkProjects size={66} />} title="Nothing on the list"
            sub="Jot down errands and one-offs you need to get to — like returning a package."
            cta={<Btn variant="primary" onClick={() => setMode('new')}><IconPlus size={15} /> Add a to-do</Btn>} />
        ) : (
          <SortableTodoList todos={todos} actions={actions} todayKey={todayKey}
            addedSet={addedSet} dkey={dkey} toast={toast} mode={mode}
            onEdit={(td) => setMode(td)}
            onCancelEdit={() => setMode(null)}
            onSaveEdit={(id, nt) => { actions.updateTodo(id, nt); setMode(null); toast('Updated'); }} />
        )}

        {/* dividers only make sense against the full, ordered list */}
        {realTodos.length > 0 && catFilter === 'all' && (
          <button type="button" onClick={() => actions.addDivider()} className="dashed-add" style={{ marginTop: 2 }}>
            <IconPlus size={15} /> Add a line
          </button>
        )}
      </div>
    </div>
  );
}

// shared empty state
function EmptyState({ mark, title, sub, cta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px 24px', color: 'var(--text2)' }}>
      <div style={{ color: 'var(--border2)', marginBottom: 16 }}>{mark}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, marginBottom: 18, maxWidth: 260 }}>{sub}</div>
      {cta}
    </div>
  );
}

Object.assign(window, { TodoPage, EmptyState, TodoCard, TodoForm, DuePill });
