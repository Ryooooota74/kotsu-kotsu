// desktop.jsx — iPad & laptop layouts: sidebar shell + multi-pane pages.
// Reuses the mobile primitives (SortableTaskList, DayTimeline, MonthGrid, …).
// Exports: DesktopApp, IPadFrame, BrowserFrame

const DT_DIMS = {
  ipad:   { sidebar: 214, schedule: 332, showMonth: false, pad: 22, cardW: 1130, screenH: 752 },
  laptop: { sidebar: 252, schedule: 392, showMonth: true,  pad: 28, cardW: 1280, screenH: 752 },
};

const DT_NAV = [
  { key: 'tasks',    label: 'Tasks',    Icon: IconList },
  { key: 'todo',     label: 'To-do',    Icon: IconInbox },
  { key: 'calendar', label: 'Calendar', Icon: IconCalendar },
  { key: 'groups',   label: 'Groups',   Icon: IconLayers },
];

// ── Sidebar ───────────────────────────────────────────────────
function DesktopSidebar({ device, page, setPage, cat, setCat, dkey, setDkey, counts, totalToday, onManage, viewMonth, setViewMonth }) {
  const dim = DT_DIMS[device];
  const { data } = React.useContext(StoreContext);
  const cats = data.categories || [];
  const d = parseKey(dkey);
  const todayKey = dateKey(new Date());

  const navItem = (item) => {
    const active = page === item.key;
    return (
      <button type="button" key={item.key} className="dt-navitem"
        onClick={() => setPage(item.key)}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 600, letterSpacing: -0.1, textAlign: 'left',
          padding: '9px 11px', borderRadius: 9,
          background: active ? 'var(--accent-soft)' : 'transparent',
          color: active ? 'var(--accent)' : 'var(--text2)',
          transition: 'background .14s, color .14s',
        }}>
        <item.Icon size={18} style={{ flexShrink: 0 }} />
        {item.label}
      </button>
    );
  };

  const catRow = (id, name, color, count) => {
    const active = page === 'tasks' && cat === id;
    return (
      <button type="button" key={id} className="dt-catrow"
        onClick={() => { setCat(id); setPage('tasks'); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, width: '100%',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, letterSpacing: -0.1, textAlign: 'left',
          padding: '7px 11px', borderRadius: 8,
          background: active ? 'var(--bg3)' : 'transparent',
          color: active ? 'var(--text)' : 'var(--text2)',
          transition: 'background .14s, color .14s',
        }}>
        {color
          ? <span style={{ width: 9, height: 9, borderRadius: 999, background: color, flexShrink: 0 }} />
          : <span style={{ width: 9, height: 9, borderRadius: 3, border: '1.6px solid var(--border2)', flexShrink: 0 }} />}
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        {count > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div style={{
      width: dim.sidebar, flexShrink: 0, height: '100%', boxSizing: 'border-box',
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '18px 12px 12px',
    }}>
      {/* brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 16px' }}>
        <img src="icon-192.png" alt="" width={30} height={30}
          style={{ borderRadius: 8, display: 'block', flexShrink: 0 }} />
        <div style={{ lineHeight: 1.1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>Kotsu-Kotsu</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Daily planner</div>
        </div>
      </div>

      {/* nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {DT_NAV.map(navItem)}
      </div>

      {/* lists / categories */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 8px 7px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lists</span>
        <IconBtn size={22} title="Manage lists" onClick={onManage}><IconPlus size={15} /></IconBtn>
      </div>
      <div className="dt-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flex: dim.showMonth ? '0 1 auto' : 1, minHeight: 0 }}>
        {catRow('all', 'All', null, totalToday)}
        {cats.map(c => catRow(c.id, c.name, c.color, counts[c.id] || 0))}
      </div>

      {/* laptop: mini month */}
      {dim.showMonth && (
        <div style={{ marginTop: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 2px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: -0.2 }}>
              {MON_SHORT[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              <IconBtn size={24} title="Previous month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}><IconArrowLeft size={15} /></IconBtn>
              <IconBtn size={24} title="Next month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}><IconArrowRight size={15} /></IconBtn>
            </div>
          </div>
          <div className="dt-mini-month">
            <MonthGrid viewDate={viewMonth} dkey={dkey} onPick={(k) => { setDkey(k); setPage('tasks'); }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable content header ───────────────────────────────────
function DTPageHead({ title, sub, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '20px 26px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>
    </div>
  );
}

// ── Tasks (list + schedule) ───────────────────────────────────
function DesktopTasks({ device, dkey, setDkey, cat, setCat, recordKeys, onAdd, onApplyGroup, onManage, onResetDay, onEditEvent, onEditTask, onEditCard, onNewEvent, toast }) {
  const backup = useBackup(toast);
  const dim = DT_DIMS[device];
  const { data, actions } = React.useContext(StoreContext);
  const cats = data.categories || [];
  const all = data.days[dkey] || [];
  const [confirmClear, setConfirmClear] = React.useState(false);
  const isAll = cat === 'all';
  const catObj = isAll ? null : (cats.find(c => c.id === cat) || null);
  const d = parseKey(dkey);
  const todayKey = dateKey(new Date());

  // keep stored order so grouped tasks stay together (completed tasks are greyed in place)
  const shown = React.useMemo(() => (isAll ? all : all.filter(t => t.category === cat)), [all, isAll, cat]);

  const dateLabel = dkey === todayKey ? 'Today' : WD_SHORT[d.getDay()];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <IconBtn size={36} onClick={() => setDkey(dateKey(addDays(d, -1)))} title="Previous day" style={{ border: '1px solid var(--border)' }}><IconArrowLeft size={17} /></IconBtn>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>{dateLabel}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)' }}>{MON_LONG[d.getMonth()]} {d.getDate()}, {d.getFullYear()}</div>
          </div>
          <IconBtn size={36} onClick={() => setDkey(dateKey(addDays(d, 1)))} title="Next day" style={{ border: '1px solid var(--border)' }}><IconArrowRight size={17} /></IconBtn>
          {dkey !== todayKey && (
            <Btn variant="accentGhost" size="sm" onClick={() => setDkey(todayKey)}><IconReset size={14} /> Back to today</Btn>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn variant="primary" size="md" onClick={() => onAdd(isAll ? null : cat)}><IconPlus size={15} /> Add task</Btn>
          <HeaderMenu items={[
            { label: 'Apply group', icon: <IconPlus size={16} />, onClick: onApplyGroup },
            { label: 'Manage lists', icon: <IconPencil size={16} />, onClick: onManage },
            { label: 'Save backup', icon: <IconDownload size={16} />, onClick: backup.exportNow, sep: true },
            { label: 'Restore backup…', icon: <IconUpload size={16} />, onClick: backup.pickImport },
            { label: 'Reset day', icon: <IconReset size={16} />, onClick: onResetDay, sep: true },
            { label: 'Delete all tasks', icon: <IconTrash size={16} />, onClick: () => setConfirmClear(true), danger: true },
          ]} />
        </div>
      </div>

      {/* body: list | schedule */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* list column */}
        {/* list column stops at its content width so the schedule absorbs the slack */}
        <div style={{ flex: '0 1 692px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '16px 26px 10px', flexShrink: 0 }}>
            {catObj && <span style={{ width: 10, height: 10, borderRadius: 999, background: catObj.color }} />}
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{isAll ? 'All tasks' : catObj?.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{shown.length}</span>
            {!isAll && <button type="button" onClick={() => setCat('all')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--text2)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Show all</button>}
          </div>
          <div className="dt-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 26px 28px' }}>
            <div style={{ maxWidth: 640 }}>
              {shown.length === 0 ? (
                <EmptyTasks onAdd={() => onAdd(isAll ? null : cat)} onApplyGroup={onApplyGroup} />
              ) : (
                <SortableTaskList tasks={shown} dkey={dkey} actions={actions} isAll={isAll} data={data} onEditTask={onEditCard} />
              )}
            </div>
          </div>
        </div>

        {/* schedule column (time view) — absorbs the slack next to the 640px task
            list so wide screens don't leave dead space between the two columns */}
        <div style={{
          flex: `1 1 ${dim.schedule}px`, minWidth: dim.schedule,
          borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClock size={17} style={{ color: 'var(--text2)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>Schedule</span>
            </div>
            <Btn variant="outline" size="sm" onClick={onNewEvent}><IconPlus size={14} /> Event</Btn>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <DayTimeline dkey={dkey} onEditEvent={onEditEvent} onEditTask={onEditTask} />
          </div>
        </div>
      </div>

      <ConfirmSheet open={confirmClear} title="Delete all tasks"
        message={`Delete all ${all.length} task${all.length === 1 ? '' : 's'} for this day? This can’t be undone.`}
        confirmLabel="Delete all" onConfirm={() => { actions.clearDay(dkey); setConfirmClear(false); }}
        onClose={() => setConfirmClear(false)} />
      {backup.ui}
    </div>
  );
}

// ── To-do (grid) ──────────────────────────────────────────────
function DesktopTodo({ device, dkey, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const [mode, setMode] = React.useState(null);
  const [catFilter, setCatFilter] = React.useState('all');
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

  const addedSet = React.useMemo(() => {
    const s = new Set();
    (data.days[todayKey] || []).forEach(t => { if (t.fromTodoId && t.completedCount < t.totalBoxes) s.add(t.fromTodoId); });
    return s;
  }, [data.days, todayKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DTPageHead title="To-do" sub="Things to do soon — drag the handle to reorder."
        actions={<Btn variant="primary" size="md" onClick={() => setMode('new')}><IconPlus size={15} /> New to-do</Btn>} />
      <div className="dt-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 30px' }}>
        {realTodos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', maxWidth: 720, marginBottom: 16 }}>
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
          <div style={{ maxWidth: 460, marginBottom: 18 }}>
            <TodoForm onCancel={() => setMode(null)} onSave={(t) => { actions.addTodo(t); setMode(null); toast('Added to To-do'); }} />
          </div>
        )}
        {realTodos.length === 0 && mode !== 'new' ? (
          <EmptyState mark={<MarkProjects size={66} />} title="Nothing on the list"
            sub="Jot down errands and one-offs you need to get to — like returning a package."
            cta={<Btn variant="primary" onClick={() => setMode('new')}><IconPlus size={15} /> Add a to-do</Btn>} />
        ) : (
          <div style={{ maxWidth: 720 }}>
            <SortableTodoList todos={todos} actions={actions} todayKey={todayKey}
              addedSet={addedSet} dkey={dkey} toast={toast} mode={mode} columns={1}
              onEdit={(td) => setMode(td)}
              onCancelEdit={() => setMode(null)}
              onSaveEdit={(id, nt) => { actions.updateTodo(id, nt); setMode(null); toast('Updated'); }} />
            {catFilter === 'all' && (
              <button type="button" onClick={() => actions.addDivider()} className="dashed-add" style={{ marginTop: 10 }}>
                <IconPlus size={15} /> Add a line
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Groups (grid) ─────────────────────────────────────────────
function DesktopGroups({ device, dkey, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const [editing, setEditing] = React.useState(null);

  if (editing === 'new')
    return <div style={{ height: '100%', overflowY: 'auto' }} className="dt-scroll"><div style={{ maxWidth: 620, margin: '0 auto' }}><GroupEditor onCancel={() => setEditing(null)} onSave={(g) => { actions.addGroup(g); setEditing(null); toast('Group saved'); }} /></div></div>;
  if (editing && typeof editing === 'object')
    return <div style={{ height: '100%', overflowY: 'auto' }} className="dt-scroll"><div style={{ maxWidth: 620, margin: '0 auto' }}><GroupEditor initial={editing} onCancel={() => setEditing(null)} onSave={(g) => { actions.updateGroup(editing.id, g); setEditing(null); toast('Group updated'); }} /></div></div>;

  const cols = device === 'laptop' ? 3 : 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DTPageHead title="Groups" sub="Bundles of tasks you can add to a day all at once."
        actions={<Btn variant="primary" size="md" onClick={() => setEditing('new')}><IconPlus size={15} /> New group</Btn>} />
      <div className="dt-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 30px' }}>
        {data.groups.length === 0 ? (
          <EmptyState mark={<MarkGroups size={66} />} title="No groups yet"
            sub="Bundle related tasks — like a morning routine — and add them together."
            cta={<Btn variant="primary" onClick={() => setEditing('new')}><IconPlus size={15} /> New group</Btn>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12, alignItems: 'start' }}>
            {data.groups.map(g => <GroupCard key={g.id} g={g} dkey={dkey} toast={toast} onEdit={(gr) => setEditing(gr)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendar (full width) ─────────────────────────────────────
function DesktopCalendar({ device, dkey, setDkey, viewMonth, setViewMonth, onEditEvent, onEditTask, onNewEvent }) {
  const [view, setView] = React.useState('month');
  const d = parseKey(dkey);
  const title = view === 'month'
    ? `${MON_LONG[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`
    : view === 'week'
      ? `${MON_SHORT[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`
      : `${WD_SHORT[d.getDay()]}, ${MON_LONG[d.getMonth()]} ${d.getDate()}`;
  const shift = (n) => {
    if (view === 'month') setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1));
    else if (view === 'week') setViewMonth(addDays(viewMonth, n * 7));
    else setDkey(dateKey(addDays(d, n)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 26px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, minWidth: device === 'laptop' ? 230 : 180 }}>{title}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn size={34} onClick={() => shift(-1)} title="Previous" style={{ border: '1px solid var(--border)' }}><IconArrowLeft size={17} /></IconBtn>
            <IconBtn size={34} onClick={() => shift(1)} title="Next" style={{ border: '1px solid var(--border)' }}><IconArrowRight size={17} /></IconBtn>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 9, padding: 3, gap: 3 }}>
            {[['month', 'Month'], ['week', 'Week'], ['day', 'Day']].map(([k, label]) => {
              const active = view === k;
              return (
                <button type="button" key={k} onClick={() => setView(k)} style={{
                  border: 'none', cursor: 'pointer', borderRadius: 7, padding: '7px 16px',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  background: active ? 'var(--bg)' : 'transparent', color: active ? 'var(--text)' : 'var(--text2)',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>{label}</button>
              );
            })}
          </div>
          <Btn variant="primary" size="md" onClick={onNewEvent}><IconPlus size={15} /> Event</Btn>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {view === 'month' && (
          <div className="dt-scroll dt-cal-month" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <MonthGrid viewDate={viewMonth} dkey={dkey} onPick={(k) => { setDkey(k); setView('day'); }} />
          </div>
        )}
        {view === 'week' && (
          <WeekView viewDate={viewMonth} dkey={dkey} onPick={(k) => setDkey(k)} onOpenDay={(k) => { setDkey(k); setView('day'); }} />
        )}
        {view === 'day' && (
          <div style={{ flex: 1, minHeight: 0, maxWidth: 760, width: '100%', margin: '0 auto' }}>
            <DayTimeline dkey={dkey} onEditEvent={onEditEvent} onEditTask={onEditTask} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────
function DesktopApp({ device, page, setPage, dkey, setDkey, toast }) {
  const { data, actions } = React.useContext(StoreContext);
  const [cat, setCat] = React.useState('all');
  const [addOpen, setAddOpen] = React.useState(false);
  const [addCat, setAddCat] = React.useState(null);
  const [editId, setEditId] = React.useState(null);
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [evSheet, setEvSheet] = React.useState(null);
  const [taskSheet, setTaskSheet] = React.useState(null);
  const [viewMonth, setViewMonth] = React.useState(() => parseKey(dkey));

  React.useEffect(() => { setViewMonth(parseKey(dkey)); }, [dkey]);

  const all = data.days[dkey] || [];
  const counts = React.useMemo(() => {
    const m = {};
    all.forEach(t => { m[t.category] = (m[t.category] || 0) + 1; });
    return m;
  }, [all]);
  const recordKeys = React.useMemo(
    () => new Set(Object.keys(data.days).filter(k => (data.days[k] || []).length > 0)),
    [data.days]);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: 'var(--bg)', display: 'flex' }}>
      <DesktopSidebar device={device} page={page} setPage={setPage} cat={cat} setCat={setCat}
        dkey={dkey} setDkey={setDkey} counts={counts} totalToday={all.length}
        onManage={() => setManageOpen(true)} viewMonth={viewMonth} setViewMonth={setViewMonth} />

      <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
        {page === 'tasks' && (
          <DesktopTasks device={device} dkey={dkey} setDkey={setDkey} cat={cat} setCat={setCat} recordKeys={recordKeys}
            onAdd={(c) => { setAddCat(c || null); setAddOpen(true); }}
            onApplyGroup={() => setApplyOpen(true)} onManage={() => setManageOpen(true)}
            onResetDay={() => actions.resetDay(dkey)}
            onEditEvent={(id) => setEvSheet(id)} onEditTask={(id) => setTaskSheet(id)} onEditCard={(id) => setEditId(id)} onNewEvent={() => setEvSheet('new')} toast={toast} />
        )}
        {page === 'todo' && <DesktopTodo device={device} dkey={dkey} toast={toast} />}
        {page === 'calendar' && (
          <DesktopCalendar device={device} dkey={dkey} setDkey={setDkey} viewMonth={viewMonth} setViewMonth={setViewMonth}
            onEditEvent={(id) => setEvSheet(id)} onEditTask={(id) => setTaskSheet(id)} onNewEvent={() => setEvSheet('new')} />
        )}
        {page === 'groups' && <DesktopGroups device={device} dkey={dkey} toast={toast} />}
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} dkey={dkey} defaultCat={addCat} toast={toast} />
      <AddTaskModal open={!!editId} editId={editId} onClose={() => setEditId(null)} dkey={dkey} />
      <ApplyGroupSheet open={applyOpen} onClose={() => setApplyOpen(false)} dkey={dkey} />
      <ManageCategoriesSheet open={manageOpen} onClose={() => setManageOpen(false)} />
      <EventEditorSheet open={!!evSheet} eventId={evSheet} dkey={dkey} onClose={() => setEvSheet(null)} />
      <TaskTimeSheet open={!!taskSheet} taskId={taskSheet} dkey={dkey} onClose={() => setTaskSheet(null)} />
    </div>
  );
}

// ── Device frames ─────────────────────────────────────────────
function IPadFrame({ children, width = 1130, height = 752 }) {
  const bezel = 16;
  return (
    <div style={{
      width: width + bezel * 2, height: height + bezel * 2, borderRadius: 38,
      background: '#1c1c1e', padding: bezel, boxSizing: 'border-box',
      boxShadow: '0 40px 90px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.18)',
      position: 'relative',
    }}>
      {/* front camera */}
      <div style={{ position: 'absolute', top: bezel / 2 - 2, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: 999, background: '#3a3a3c' }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  );
}

function BrowserFrame({ children, width = 1280, height = 752 }) {
  const bar = 44;
  return (
    <div style={{
      width, height: height + bar, borderRadius: 14, overflow: 'hidden',
      background: 'var(--bg)', boxShadow: '0 40px 90px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.10)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* chrome */}
      <div style={{ height: bar, flexShrink: 0, background: '#e8e8ec', borderBottom: '1px solid #d4d4d8', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />)}
        </div>
        <div style={{
          flex: 1, maxWidth: 460, height: 26, borderRadius: 8, background: '#fff',
          border: '1px solid #dcdce0', display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px',
          fontSize: 12.5, color: 'var(--text2)', fontWeight: 600,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9a9aa0" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          tasks.app
        </div>
        <div style={{ width: 54 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { DesktopApp, IPadFrame, BrowserFrame, DT_DIMS });
