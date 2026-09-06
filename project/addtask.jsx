// addtask.jsx — AddTaskModal (bottom sheet) + ApplyGroupSheet
// Exports to window: AddTaskModal, ApplyGroupSheet

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{children}</div>;
}

function AddTaskModal({ open, onClose, dkey, defaultCat, editId, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const cats = data.categories || [];

  // apply a whole group's tasks to this day, then close
  const applyGroup = (g) => {
    actions.addTasksBulk(dkey, g.tasks.map(t => ({
      title: t.title, category: t.category, totalBoxes: t.totalBoxes,
      subtasks: (t.subtasks || []).map(s => ({ title: s.title, totalBoxes: s.totalBoxes || 1 })),
      fromGroupId: g.id, fromGroupName: g.name,
    })));
    if (toast) toast(`Added ${g.tasks.length} task${g.tasks.length !== 1 ? 's' : ''} from “${g.name}”`);
    onClose();
  };
  const editing = editId ? (data.days[dkey] || []).find(t => t.id === editId) : null;
  const initialCat = defaultCat || defaultCategoryId(data);
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState(initialCat);
  const [boxes, setBoxes] = React.useState(1);
  const [subs, setSubs] = React.useState([]);
  const [usedTodo, setUsedTodo] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title); setCat(editing.category); setBoxes(editing.totalBoxes);
      setSubs((editing.subtasks || []).map(s => ({ id: s.id, title: s.title, totalBoxes: s.totalBoxes })));
      setUsedTodo(null);
    } else {
      setTitle(''); setCat(defaultCat || defaultCategoryId(data)); setBoxes(1); setSubs([]); setUsedTodo(null);
    }
  }, [open, editId, defaultCat]);

  const fillFromTodo = (td) => {
    setTitle(td.title); setUsedTodo(td.id);
    if (td.category) setCat(td.category);
    if ((td.subtasks || []).length) setSubs(td.subtasks.map(s => ({ id: uid(), title: s.title, totalBoxes: s.totalBoxes || 1 })));
  };

  const addSub = () => setSubs(s => [...s, { id: uid(), title: '', totalBoxes: 1 }]);
  const setSub = (id, t) => setSubs(s => s.map(x => x.id === id ? { ...x, title: t } : x));
  const delSub = (id) => setSubs(s => s.filter(x => x.id !== id));

  // edit existing task in place, preserving per-box / subtask progress
  const applyEdits = () => {
    const cleanSubs = subs.filter(s => s.title.trim());
    actions.updateTask(dkey, editId, t => {
      t.title = title.trim(); t.category = cat; t.totalBoxes = boxes;
      if (t.completedCount > boxes) t.completedCount = boxes;
      const prevById = new Map((t.subtasks || []).map(s => [s.id, s]));
      t.subtasks = cleanSubs.map(s => {
        const tb = s.totalBoxes || 1;
        const prev = prevById.get(s.id);
        return { id: s.id || uid(), title: s.title.trim(), totalBoxes: tb,
          completedCount: prev ? Math.min(prev.completedCount, tb) : 0 };
      });
    });
  };

  const submit = () => {
    const name = title.trim();
    if (!name) return;
    if (editing) {
      applyEdits();
    } else {
      actions.addTask(dkey, {
        title: name, category: cat, totalBoxes: boxes,
        subtasks: subs.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), totalBoxes: s.totalBoxes })),
        fromTodoId: usedTodo || undefined,
      });
    }
    onClose();
  };

  // move the (edited) task to the next day, keeping all its progress
  const moveToNextDay = () => {
    if (!title.trim()) return;
    applyEdits();
    actions.moveTask(dkey, editId, dateKey(addDays(parseKey(dkey), 1)));
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 18px 12px', flexShrink: 0,
      }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{editing ? 'Edit task' : 'New task'}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>

      <div style={{ overflow: 'auto', padding: '0 18px 4px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* from to-do (dividers are separators, not to-dos) */}
        {!editing && (data.todos || []).filter(p => p.type !== 'divider').length > 0 && (
          <div>
            <FieldLabel>From To-do</FieldLabel>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -2px' }}>
              {data.todos.filter(p => p.type !== 'divider').map(p => {
                const active = usedTodo === p.id;
                const info = dueInfo(p.due);
                return (
                  <button type="button" key={p.id} onClick={() => fillFromTodo(p)}
                    style={{
                      flexShrink: 0, textAlign: 'left', cursor: 'pointer', borderRadius: 10,
                      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                      background: active ? 'var(--accent-soft)' : 'var(--bg)',
                      padding: '9px 12px', minWidth: 120, maxWidth: 170,
                    }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{info.label || 'No date'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* apply a group (adds all its tasks to this day) */}
        {!editing && (data.groups || []).filter(g => g.tasks.length > 0).length > 0 && (
          <div>
            <FieldLabel>Apply a group</FieldLabel>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -2px' }}>
              {data.groups.filter(g => g.tasks.length > 0).map(g => {
                const color = getCat(data, g.category || (g.tasks[0] && g.tasks[0].category)).color;
                return (
                  <button type="button" key={g.id} onClick={() => applyGroup(g)}
                    style={{
                      flexShrink: 0, textAlign: 'left', cursor: 'pointer', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      padding: '9px 12px', minWidth: 120, maxWidth: 190,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* task name — no autofocus (don't pop the keyboard until tapped).
            Enter submits on desktop; on phones it just closes the keyboard so the
            rest of the form stays reachable (the button adds the task there). */}
        <div>
          <FieldLabel>Task name</FieldLabel>
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={enterSubmits(submit)}
            placeholder="What needs doing?" className="inp" style={{ width: '100%', fontSize: 15, padding: '11px 13px' }} />
        </div>

        {/* category */}
        <div>
          <FieldLabel>Category</FieldLabel>
          <CategoryPills categories={cats} value={cat} onChange={setCat} />
        </div>

        {/* times per day */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FieldLabel>Times per day</FieldLabel>
          <Counter value={boxes} onChange={setBoxes} min={1} max={10} />
        </div>

        {/* subtasks */}
        <div>
          <FieldLabel>Subtasks</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subs.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={s.title} onChange={e => setSub(s.id, e.target.value)} placeholder="Subtask"
                  className="inp" style={{ flex: 1, fontSize: 13, padding: '9px 11px' }} />
                <IconBtn danger onClick={() => delSub(s.id)} title="Remove"><IconClose size={16} /></IconBtn>
              </div>
            ))}
            <button type="button" onClick={addSub} className="dashed-add">
              <IconPlus size={15} /> Add subtask
            </button>
          </div>
        </div>

        {/* move to next day (edit only) */}
        {editing && (
          <button type="button" onClick={moveToNextDay}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13.5,
            }}>
            <IconArrowRight size={16} /> Move to next day
          </button>
        )}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 18px 18px', flexShrink: 0 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={!title.trim()} style={{ flex: 2 }}>{editing ? 'Save' : 'Add task'}</Btn>
      </div>
    </Sheet>
  );
}

// ── Apply group sheet ─────────────────────────────────────────
function ApplyGroupSheet({ open, onClose, dkey }) {
  const { data, actions } = React.useContext(StoreContext);
  const apply = (g) => {
    actions.addTasksBulk(dkey, g.tasks.map(t => ({
      title: t.title, category: t.category, totalBoxes: t.totalBoxes,
      subtasks: (t.subtasks || []).map(s => ({ title: s.title, totalBoxes: s.totalBoxes || 1 })),
      fromGroupId: g.id, fromGroupName: g.name,
    })));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Apply a group</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>
      <div style={{ overflow: 'auto', padding: '0 18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.groups.length === 0 && (
          <div style={{ color: 'var(--text2)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No groups yet.</div>
        )}
        {data.groups.map(g => (
          <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>{g.tasks.length} tasks</div>
              </div>
              <Btn variant="accentGhost" size="sm" disabled={g.tasks.length === 0} onClick={() => apply(g)}><IconPlus size={14} /> Add to today</Btn>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

Object.assign(window, { AddTaskModal, ApplyGroupSheet });
