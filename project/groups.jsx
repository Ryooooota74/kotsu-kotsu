// groups.jsx — GroupsPage + full-page GroupEditor
// Exports to window: GroupsPage

function GroupCard({ g, dkey, toast, onEdit }) {
  const { data, actions } = React.useContext(StoreContext);
  // a group is one category — color the card frame with it
  const gCatId = g.category || (g.tasks[0] && g.tasks[0].category);
  const gColor = gCatId ? getCat(data, gCatId).color : null;
  return (
    <div className="task-card" style={{
      borderRadius: 8, padding: '13px 14px', background: 'var(--bg)',
      border: `${gColor ? 1.5 : 1}px solid ${gColor || 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {gColor && <span style={{ width: 9, height: 9, borderRadius: 999, background: gColor, flexShrink: 0 }} />}
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <IconBtn className="del-btn" size={28} onClick={() => onEdit(g)} title="Edit"><IconPencil size={16} /></IconBtn>
          <IconBtn className="del-btn" size={28} danger onClick={() => actions.deleteGroup(g.id)} title="Delete"><IconTrash size={16} /></IconBtn>
        </div>
      </div>

      {/* preview list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '11px 0' }}>
        {g.tasks.slice(0, 4).map((t, i) => (
          <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--border2)', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
          </div>
        ))}
        {g.tasks.length > 4 && <div style={{ fontSize: 11.5, color: 'var(--muted)', paddingLeft: 23 }}>+{g.tasks.length - 4} more</div>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <TagPill tone="accent">{g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}</TagPill>
        <div style={{ flex: 1 }} />
        <Btn variant="accentGhost" size="sm" disabled={g.tasks.length === 0}
          title={g.tasks.length === 0 ? 'This group has no tasks yet' : ''}
          onClick={() => {
          // always add to the real current day (the Groups page has no date context)
          actions.addTasksBulk(dateKey(new Date()), g.tasks.map(t => ({ title: t.title, category: t.category, totalBoxes: t.totalBoxes,
            subtasks: (t.subtasks || []).map(s => ({ title: s.title, totalBoxes: s.totalBoxes || 1 })), fromGroupId: g.id, fromGroupName: g.name })));
          toast(`Added ${g.tasks.length} tasks to today`);
        }}><IconPlus size={14} /> Add to today</Btn>
      </div>
    </div>
  );
}

// ── Full-page editor ──────────────────────────────────────────
function GroupEditor({ initial, onCancel, onSave }) {
  const cats = React.useContext(StoreContext).data.categories || [];
  const fallbackCat = (cats[0] || { id: 'work' }).id;
  const [name, setName] = React.useState(initial?.name || '');
  // a group has a single category (picked by color); every task inherits it
  const [category, setCategory] = React.useState(
    initial?.category || (initial?.tasks && initial.tasks[0] && initial.tasks[0].category) || fallbackCat
  );
  const [tasks, setTasks] = React.useState(
    (initial?.tasks || []).map(t => ({ id: uid(), title: t.title, totalBoxes: t.totalBoxes || 1,
      subtasks: (t.subtasks || []).map(s => ({ id: uid(), title: s.title, totalBoxes: s.totalBoxes || 1 })) }))
  );

  const addTask = () => setTasks(ts => [...ts, { id: uid(), title: '', totalBoxes: 1, subtasks: [] }]);
  const patch = (id, p) => setTasks(ts => ts.map(t => t.id === id ? { ...t, ...p } : t));
  const del = (id) => setTasks(ts => ts.filter(t => t.id !== id));
  const move = (i, dir) => setTasks(ts => {
    const j = i + dir; if (j < 0 || j >= ts.length) return ts;
    const c = [...ts]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  // per-task subtasks
  const addSub = (tid) => setTasks(ts => ts.map(t => t.id === tid ? { ...t, subtasks: [...(t.subtasks || []), { id: uid(), title: '', totalBoxes: 1 }] } : t));
  const setSub = (tid, sid, title) => setTasks(ts => ts.map(t => t.id === tid ? { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, title } : s) } : t));
  const delSub = (tid, sid) => setTasks(ts => ts.map(t => t.id === tid ? { ...t, subtasks: t.subtasks.filter(s => s.id !== sid) } : t));
  const save = () => {
    const nm = name.trim(); if (!nm) return;
    onSave({ name: nm, category, tasks: tasks.filter(t => t.title.trim()).map(t => ({ id: uid(), title: t.title.trim(), category, totalBoxes: t.totalBoxes,
      subtasks: (t.subtasks || []).filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), totalBoxes: s.totalBoxes || 1 })) })) });
  };

  return (
    <div>
      <StickyHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 12px', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{initial ? 'Edit group' : 'New group'}</span>
          <Btn variant="primary" size="sm" onClick={save} disabled={!name.trim()}>Save</Btn>
        </div>
      </StickyHeader>

      <div style={{ padding: '14px 14px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={enterSubmits(save)} placeholder="Group name"
          className="inp" style={{ width: '100%', fontSize: 16, fontWeight: 700, padding: '11px 13px' }} />

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 9 }}>Category</div>
          <CategoryPills categories={cats} value={category} onChange={setCategory} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t, i) => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px 10px 6px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 2 }}>
                <IconBtn size={22} onClick={() => move(i, -1)} title="Move up" style={{ opacity: i === 0 ? 0.3 : 1 }}><IconCaretUp size={15} /></IconBtn>
                <IconBtn size={22} onClick={() => move(i, 1)} title="Move down" style={{ opacity: i === tasks.length - 1 ? 0.3 : 1 }}><IconCaretDown size={15} /></IconBtn>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={t.title} onChange={e => patch(t.id, { title: e.target.value })} placeholder="Task name"
                    className="inp" style={{ flex: 1, minWidth: 0, fontSize: 13.5, padding: '9px 10px' }} />
                  <Counter value={t.totalBoxes} onChange={(v) => patch(t.id, { totalBoxes: v })} min={1} max={10} />
                  <IconBtn danger size={26} onClick={() => del(t.id)} title="Remove task"><IconClose size={16} /></IconBtn>
                </div>
                {/* subtasks */}
                {(t.subtasks || []).map(s => (
                  <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 10 }}>
                    <span style={{ width: 12, height: 1.5, background: 'var(--border2)', flexShrink: 0, borderRadius: 2 }} />
                    <input value={s.title} onChange={e => setSub(t.id, s.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addSub(t.id); }} placeholder="Subtask"
                      className="inp" style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: '7px 9px' }} />
                    <IconBtn danger size={24} onClick={() => delSub(t.id, s.id)} title="Remove subtask"><IconClose size={14} /></IconBtn>
                  </div>
                ))}
                <button type="button" onClick={() => addSub(t.id)}
                  style={{
                    alignSelf: 'flex-start', marginLeft: 10, border: 'none', background: 'transparent',
                    cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                    padding: '2px 0', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                  <IconPlus size={13} /> Add subtask
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addTask} className="dashed-add"><IconPlus size={15} /> Add task to group</button>
        </div>
      </div>
    </div>
  );
}

function GroupsPage({ page, setPage, dkey, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const [editing, setEditing] = React.useState(null); // null | 'new' | group

  if (editing === 'new')
    return <GroupEditor onCancel={() => setEditing(null)} onSave={(g) => { actions.addGroup(g); setEditing(null); toast('Group saved'); }} />;
  if (editing && typeof editing === 'object')
    return <GroupEditor initial={editing} onCancel={() => setEditing(null)} onSave={(g) => { actions.updateGroup(editing.id, g); setEditing(null); toast('Group updated'); }} />;

  return (
    <div>
      <StickyHeader>
        <AppHeader page={page} setPage={setPage} actions={
          <Btn variant="primary" size="sm" onClick={() => setEditing('new')}><IconPlus size={15} /> New</Btn>
        } />
      </StickyHeader>
      <div style={{ padding: '14px 14px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text2)', padding: '0 2px 2px' }}>
          Bundles of tasks you can add to a day all at once.
        </div>
        {data.groups.length === 0 ? (
          <EmptyState mark={<MarkGroups size={66} />} title="No groups yet"
            sub="Bundle related tasks — like a morning routine — and add them together."
            cta={<Btn variant="primary" onClick={() => setEditing('new')}><IconPlus size={15} /> New group</Btn>} />
        ) : (
          data.groups.map(g => <GroupCard key={g.id} g={g} dkey={dkey} toast={toast} onEdit={(gr) => setEditing(gr)} />)
        )}
      </div>
    </div>
  );
}

Object.assign(window, { GroupsPage, GroupCard, GroupEditor });
