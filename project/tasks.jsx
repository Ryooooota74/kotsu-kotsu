// tasks.jsx — TaskCard, DateNav, CalendarPopover, TasksPage
// Exports to window: TasksPage

// ── Subtask row ───────────────────────────────────────────────
function SubtaskRow({ sub, onChange, onDelete }) {
  return (
    <div className="task-card" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0 7px 6px',
    }}>
      <span style={{ width: 14, height: 1.5, background: 'var(--border2)', flexShrink: 0, borderRadius: 2 }} />
      <span style={{
        flex: 1, fontSize: 12.5, color: sub.completedCount >= sub.totalBoxes ? 'var(--muted)' : 'var(--text2)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{sub.title}</span>
      <CheckboxRow completedCount={sub.completedCount} totalBoxes={sub.totalBoxes}
        boxSize={16} onChange={(n) => onChange({ ...sub, completedCount: n })} />
      <IconBtn className="del-btn" size={24} danger title="Delete subtask" onClick={onDelete}>
        <IconClose size={14} />
      </IconBtn>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────
function TaskCard({ task, dkey, actions, catColor, dragHandle, dragging, onEdit, onLongPress }) {
  const [addingSub, setAddingSub] = React.useState(false);
  const [subText, setSubText] = React.useState('');
  const done = task.totalBoxes > 0 && task.completedCount >= task.totalBoxes;
  // phone: long-press the title opens an action sheet (edit/delete) instead of inline buttons
  const lp = useLongPress(onLongPress ? () => onLongPress(task.id) : undefined);

  const upd = (fn) => actions.updateTask(dkey, task.id, fn);

  const submitSub = () => {
    const t = subText.trim();
    if (t) upd(tk => tk.subtasks.push({ id: uid(), title: t, completedCount: 0, totalBoxes: 1 }));
    setSubText(''); setAddingSub(false);
  };

  // category color shows on the card frame (instead of a dot) to save space;
  // completed tasks are filled with a muted gray so "done" reads at a glance
  const cardBorder = dragging ? 'var(--accent)' : (done ? '#d2d2d6' : (catColor || 'var(--border)'));
  const bw = (catColor && !done) ? 1.5 : 1;
  return (
    <div className="task-card" style={{
      background: done ? '#e7e7ea' : 'var(--bg)', borderRadius: 8, border: `${bw}px solid ${cardBorder}`,
      padding: '7px 12px', transition: 'background .18s, box-shadow .14s, border-color .14s',
      boxShadow: dragging ? '0 10px 24px rgba(0,0,0,0.14)' : 'none',
    }}>
      {/* main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {dragHandle && (
          <span onPointerDown={dragHandle} title="Drag to reorder"
            style={{
              cursor: 'grab', color: 'var(--muted)', display: 'inline-flex', flexShrink: 0,
              touchAction: 'none', marginLeft: -4, marginRight: -2, padding: '2px 0',
            }}>
            <IconGrip size={16} />
          </span>
        )}
        <button type="button" onClick={() => upd(t => { t.isExpanded = !t.isExpanded; })}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 2,
            color: 'var(--muted)', display: 'inline-flex', flexShrink: 0,
          }} title={task.isExpanded ? 'Collapse' : 'Expand'}>
          <IconChevron size={15} style={{ transform: task.isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
        </button>

        <span {...(onLongPress ? lp : {})} title={onLongPress ? 'Hold for options' : undefined}
          style={{
            flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, letterSpacing: -0.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: done ? 'var(--muted)' : 'inherit',
            textDecorationLine: done ? 'line-through' : 'none', textDecorationColor: 'var(--muted)',
            cursor: onLongPress ? 'pointer' : 'default',
            WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          {task.title}
        </span>

        <CheckboxRow
          completedCount={task.completedCount} totalBoxes={task.totalBoxes}
          onChange={(n) => upd(t => { t.completedCount = n; })}
          onAddBox={() => upd(t => { t.totalBoxes = Math.min(10, t.totalBoxes + 1); })}
          onRemoveBox={task.totalBoxes > 1 ? () => upd(t => { t.totalBoxes -= 1; t.completedCount = Math.min(t.completedCount, t.totalBoxes); }) : null}
        />

        {!onLongPress && (
          <>
            {onEdit && (
              <IconBtn className="del-btn" size={26} title="Edit task" onClick={() => onEdit(task.id)}>
                <IconPencil size={15} />
              </IconBtn>
            )}
            <IconBtn className="del-btn" size={26} danger title="Delete task"
              onClick={() => actions.deleteTask(dkey, task.id)}>
              <IconClose size={15} />
            </IconBtn>
          </>
        )}
      </div>

      {/* expanded */}
      {task.isExpanded && (
        <div style={{ marginTop: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          {task.subtasks.map(s => (
            <SubtaskRow key={s.id} sub={s}
              onChange={(ns) => upd(t => { const i = t.subtasks.findIndex(x => x.id === s.id); if (i >= 0) t.subtasks[i] = ns; })}
              onDelete={() => upd(t => { t.subtasks = t.subtasks.filter(x => x.id !== s.id); })} />
          ))}
          {addingSub ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0 4px 6px' }}>
              <input autoFocus value={subText} onChange={e => setSubText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitSub(); if (e.key === 'Escape') { setAddingSub(false); setSubText(''); } }}
                onBlur={submitSub} placeholder="Subtask name"
                className="inp" style={{ flex: 1, fontSize: 12.5, padding: '6px 9px' }} />
            </div>
          ) : (
            <button type="button" onClick={() => setAddingSub(true)}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 0 3px 6px',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
              <IconPlus size={13} /> Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Confirm sheet (destructive actions) ───────────────────────
function ConfirmSheet({ open, title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 10px' }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{title}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="primary" onClick={onConfirm} style={{ flex: 2, background: '#e5484d' }}>
            <IconTrash size={15} /> {confirmLabel || 'Delete'}
          </Btn>
        </div>
      </div>
    </Sheet>
  );
}

// ── Task action sheet (phone long-press: edit / delete) ───────
function TaskActionSheet({ open, taskId, dkey, onClose, onEdit }) {
  const { data, actions } = React.useContext(StoreContext);
  const task = (data.days[dkey] || []).find(t => t.id === taskId);
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(() => { if (open) setConfirming(false); }, [open, taskId]);
  if (!task) return null;
  const cat = getCat(data, task.category);

  return (
    <Sheet open={open} onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 18px 10px' }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: cat.color, flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>

      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" onClick={() => { onClose(); onEdit(task.id); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
            padding: '13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
          }}>
          <IconPencil size={17} /> Edit task
        </button>

        <button type="button" onClick={() => { actions.moveTask(dkey, task.id, dateKey(addDays(parseKey(dkey), 1))); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
            padding: '13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
          }}>
          <IconArrowRight size={17} /> Move to next day
        </button>

        {confirming ? (
          <div style={{ padding: '12px 13px', background: 'var(--bg2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 11, lineHeight: 1.45 }}>
              Delete “{task.title}”? This can’t be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" style={{ background: '#e5484d' }}
                onClick={() => { actions.deleteTask(dkey, task.id); onClose(); }}>
                <IconTrash size={14} /> Delete
              </Btn>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
              padding: '13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)',
              color: '#e5484d', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
            }}>
            <IconTrash size={17} /> Delete task
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ── Calendar popover ──────────────────────────────────────────
function CalendarPopover({ selected, onSelect, onClose, recordKeys, popStyle }) {
  const [view, setView] = React.useState(() => { const d = parseKey(selected); return { y: d.getFullYear(), m: d.getMonth() }; });
  const todayKey = dateKey(new Date());

  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shift = (n) => setView(v => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 140 }} />
      <div style={{
        position: 'absolute', top: '100%', left: '50%',
        marginLeft: -160, marginTop: 6, width: 320, zIndex: 150,
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14,
        boxShadow: '0 12px 36px rgba(0,0,0,0.16)', padding: 14, ...popStyle,
      }}>
        {/* month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <IconBtn onClick={() => shift(-1)} title="Previous month"><IconArrowLeft size={17} /></IconBtn>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.2 }}>{MON_LONG[view.m]} {view.y}</span>
          <IconBtn onClick={() => shift(1)} title="Next month"><IconArrowRight size={17} /></IconBtn>
        </div>
        {/* dow row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', padding: '4px 0' }}>{w}</div>
          ))}
        </div>
        {/* day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const k = dateKey(new Date(view.y, view.m, d));
            const isSel = k === selected, isToday = k === todayKey, hasRec = recordKeys.has(k);
            return (
              <button type="button" key={i} onClick={() => onSelect(k)}
                style={{
                  position: 'relative', aspectRatio: '1', border: 'none', cursor: 'pointer',
                  borderRadius: 8, fontFamily: 'inherit', fontSize: 13,
                  fontWeight: isToday ? 700 : 500, fontVariantNumeric: 'tabular-nums',
                  background: isSel ? 'var(--accent)' : 'transparent',
                  color: isSel ? 'var(--on-accent)' : (isToday ? 'var(--accent)' : 'var(--text)'),
                  transition: 'background .12s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                {d}
                {hasRec && !isSel && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: 99, background: 'var(--accent)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" size="sm" onClick={() => onSelect(todayKey)}>Today</Btn>
        </div>
      </div>
    </>
  );
}

// ── Date navigation bar ───────────────────────────────────────
function DateNav({ dkey, setDkey, recordKeys }) {
  const [calOpen, setCalOpen] = React.useState(false);
  const d = parseKey(dkey);
  const todayKey = dateKey(new Date());
  const top = dkey === todayKey ? 'Today' : WD_SHORT[d.getDay()];
  const bottom = `${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
  return (
    <div style={{ position: 'relative', padding: '8px 12px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn size={38} onClick={() => setDkey(dateKey(addDays(d, -1)))} title="Previous day"
          style={{ border: '1px solid var(--border)' }}><IconArrowLeft size={18} /></IconBtn>
        <button type="button" onClick={() => setCalOpen(o => !o)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)',
            cursor: 'pointer', padding: '5px 12px',
          }}>
          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: dkey === todayKey ? 'var(--accent)' : 'var(--text2)' }}>{top}</div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{bottom}</div>
          </div>
          <IconCalendar size={17} style={{ color: 'var(--text2)' }} />
        </button>
        <IconBtn size={38} onClick={() => setDkey(dateKey(addDays(d, 1)))} title="Next day"
          style={{ border: '1px solid var(--border)' }}><IconArrowRight size={18} /></IconBtn>
      </div>

      {/* only shown when you're away from today, so it costs no space otherwise */}
      {dkey !== todayKey && (
        <button type="button" onClick={() => setDkey(todayKey)}
          style={{
            width: '100%', marginTop: 8, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, cursor: 'pointer',
            border: '1px solid var(--accent)', borderRadius: 999, background: 'var(--accent-soft)',
            color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5,
            padding: '7px 12px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
          }}>
          <IconReset size={14} /> Back to today
        </button>
      )}

      {calOpen && (
        <CalendarPopover selected={dkey} recordKeys={recordKeys}
          onSelect={(k) => { setDkey(k); setCalOpen(false); }}
          onClose={() => setCalOpen(false)} />
      )}
    </div>
  );
}

// split a day's tasks into top-level blocks: standalone tasks, and runs of
// consecutive tasks that came from the same group
function groupRuns(list) {
  const out = [];
  for (let i = 0; i < list.length;) {
    const t = list[i];
    if (t.fromGroupId) {
      const gid = t.fromGroupId, run = [];
      while (i < list.length && list[i].fromGroupId === gid) { run.push(list[i]); i++; }
      out.push({ type: 'group', gid, tasks: run });
    } else { out.push({ type: 'task', tasks: [t] }); i++; }
  }
  return out;
}

// ── Sortable task list (pointer-based drag to reorder) ────────
function SortableTaskList({ tasks, dkey, actions, isAll, data, onEditTask, onLongPressTask }) {
  const [order, setOrder] = React.useState(tasks);
  const [dragId, setDragId] = React.useState(null);
  // collapsed group ids persist across page changes and reloads
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('taskmgr_collapsed') || '{}') || {}; } catch (e) { return {}; }
  });
  // persist only the groups that are actually collapsed, so this can't grow forever
  React.useEffect(() => {
    try {
      const on = {};
      Object.keys(collapsed).forEach(k => { if (collapsed[k]) on[k] = true; });
      localStorage.setItem('taskmgr_collapsed', JSON.stringify(on));
    } catch (e) {}
  }, [collapsed]);
  const [confirmGroup, setConfirmGroup] = React.useState(null);
  const [dragBlockId, setDragBlockId] = React.useState(null); // first task id of a dragged group
  const orderRef = React.useRef(tasks);
  const rowRefs = React.useRef(new Map());
  const blockRefs = React.useRef(new Map());

  // resync from props whenever not mid-drag
  React.useEffect(() => {
    if (dragId == null && dragBlockId == null) { orderRef.current = tasks; setOrder(tasks); }
  }, [tasks, dragId, dragBlockId]);

  const setOrd = (next) => { orderRef.current = next; setOrder(next); };

  const startDrag = (id) => (e) => {
    e.preventDefault();
    setDragId(id);
    document.body.style.userSelect = 'none';
    const move = (ev) => {
      const y = ev.clientY;
      let targetId = null;
      for (const [rid, el] of rowRefs.current.entries()) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) { targetId = rid; break; }
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
      document.body.style.userSelect = '';
      setDragId(null);
      actions.reorderTasks(dkey, orderRef.current.map(t => t.id));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // drag a whole group block (all its tasks move together)
  const startBlockDrag = (anchorId) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragBlockId(anchorId);
    document.body.style.userSelect = 'none';
    const elFor = (b) => (b.type === 'group'
      ? blockRefs.current.get(b.tasks[0].id)
      : rowRefs.current.get(b.tasks[0].id));
    const move = (ev) => {
      const y = ev.clientY;
      const blks = groupRuns(orderRef.current);
      const from = blks.findIndex(b => b.tasks[0].id === anchorId);
      if (from < 0) return;
      let to = -1;
      blks.forEach((b, i) => {
        const el = elFor(b);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) to = i;
      });
      if (to >= 0 && to !== from) {
        const a = [...blks];
        const [m] = a.splice(from, 1);
        a.splice(to, 0, m);
        setOrd(a.reduce((acc, b) => acc.concat(b.tasks), []));
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.userSelect = '';
      setDragBlockId(null);
      actions.reorderTasks(dkey, orderRef.current.map(t => t.id));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // one draggable task row (ref tracked for pointer hit-testing)
  const taskRow = (t, plain) => (
    <div key={t.id}
      ref={el => { if (el) rowRefs.current.set(t.id, el); else rowRefs.current.delete(t.id); }}>
      <TaskCard task={t} dkey={dkey} actions={actions}
        catColor={plain ? null : getCat(data, t.category).color}
        dragHandle={startDrag(t.id)} dragging={dragId === t.id} onEdit={onEditTask} onLongPress={onLongPressTask} />
    </div>
  );

  // group consecutive tasks that came from the same group into a collapsible block
  const blocks = groupRuns(order).map(b => {
    if (b.type !== 'group') return { type: 'task', task: b.tasks[0] };
    const t = b.tasks[0];
    // prefer the name saved on the task; fall back to the live group, then a generic label
    const liveName = (data.groups || []).find(g => g.id === b.gid);
    const name = t.fromGroupName || (liveName && liveName.name) || 'Group';
    return { type: 'group', gid: b.gid, name, color: getCat(data, t.category).color, tasks: b.tasks };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {blocks.map(b => {
        if (b.type === 'task') return taskRow(b.task, false);
        // key collapse per block, not per group id, so the same group placed twice
        // in a day collapses independently
        const collapseKey = b.tasks[0].id;
        const isCollapsed = !!collapsed[collapseKey];
        const doneCount = b.tasks.filter(t => t.totalBoxes > 0 && t.completedCount >= t.totalBoxes).length;
        const anchorId = b.tasks[0].id;
        const blockDragging = dragBlockId === anchorId;
        return (
          <div key={'g:' + b.gid + ':' + anchorId}
            ref={el => { if (el) blockRefs.current.set(anchorId, el); else blockRefs.current.delete(anchorId); }}
            style={{
              border: `1.5px solid ${blockDragging ? 'var(--accent)' : b.color}`, borderRadius: 10, background: 'var(--bg)',
              boxShadow: blockDragging ? '0 10px 24px rgba(0,0,0,0.14)' : 'none',
              transition: 'box-shadow .14s, border-color .14s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px 7px 8px' }}>
              <span onPointerDown={startBlockDrag(anchorId)} title="Drag to move this group"
                style={{
                  cursor: 'grab', color: 'var(--muted)', display: 'inline-flex', flexShrink: 0,
                  touchAction: 'none', padding: '2px 0',
                }}>
                <IconGrip size={16} />
              </span>
              <div onClick={() => setCollapsed(c => ({ ...c, [collapseKey]: !c[collapseKey] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <IconChevron size={15} style={{ transform: isCollapsed ? 'none' : 'rotate(90deg)', transition: 'transform .15s', color: 'var(--muted)', flexShrink: 0 }} />
                <span style={{ width: 9, height: 9, borderRadius: 999, background: b.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: -0.2, color: 'var(--text)', flex: 1, textAlign: 'left', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{doneCount}/{b.tasks.length}</span>
              <IconBtn size={26} title="Move group to next day"
                onClick={() => actions.moveTasks(dkey, b.tasks.map(t => t.id), dateKey(addDays(parseKey(dkey), 1)))}>
                <IconArrowRight size={15} />
              </IconBtn>
              <IconBtn size={26} danger title="Remove group from this day"
                onClick={() => setConfirmGroup({ name: b.name, n: b.tasks.length, ids: b.tasks.map(t => t.id) })}>
                <IconTrash size={15} />
              </IconBtn>
            </div>
            {!isCollapsed && (
              <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {b.tasks.map(t => taskRow(t, true))}
              </div>
            )}
          </div>
        );
      })}

      <ConfirmSheet open={!!confirmGroup} title="Remove group"
        message={confirmGroup ? `Remove “${confirmGroup.name}” and its ${confirmGroup.n} task${confirmGroup.n === 1 ? '' : 's'} from this day? The group itself is kept.` : ''}
        confirmLabel="Remove" onConfirm={() => { actions.removeTasks(dkey, confirmGroup.ids); setConfirmGroup(null); }}
        onClose={() => setConfirmGroup(null)} />
    </div>
  );
}

// ── Overflow menu (top-right) ─────────────────────────────────
function HeaderMenu({ items }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <IconBtn size={36} onClick={() => setOpen(o => !o)} title="Menu"
        style={{ border: '1px solid var(--border)' }}><IconMenu size={18} /></IconBtn>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 160 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 170,
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.16)', padding: 6, minWidth: 182,
          }}>
            {items.map((it, i) => (
              <button type="button" key={i} onClick={() => { setOpen(false); it.onClick(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                  color: it.danger ? '#e5484d' : 'var(--text)', padding: '9px 10px', borderRadius: 8,
                  marginTop: it.sep ? 6 : 0, borderTop: it.sep ? '1px solid var(--border)' : 'none',
                  paddingTop: it.sep ? 13 : 9,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {it.icon}{it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tasks page ────────────────────────────────────────────────
function TasksPage({ page, setPage, dkey, setDkey, onAdd, onApplyGroup, onEditTask }) {
  const { data, actions } = React.useContext(StoreContext);
  const cats = data.categories || [];
  const [cat, setCat] = React.useState(() => (cats[0] ? cats[0].id : 'all'));
  const [manageOpen, setManageOpen] = React.useState(false);
  const [actionCat, setActionCat] = React.useState(null);
  const [actionTask, setActionTask] = React.useState(null);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const all = data.days[dkey] || [];
  const isAll = cat === 'all';
  const counts = React.useMemo(() => {
    const m = {};
    all.forEach(t => { m[t.category] = (m[t.category] || 0) + 1; });
    return m;
  }, [all]);
  // keep stored order so grouped tasks stay together (completed tasks are greyed in place)
  const shown = React.useMemo(() => (isAll ? all : all.filter(t => t.category === cat)), [all, isAll, cat]);
  const recordKeys = React.useMemo(
    () => new Set(Object.keys(data.days).filter(k => (data.days[k] || []).length > 0)),
    [data.days]);

  return (
    <div>
      <StickyHeader>
        <AppHeader page={page} setPage={setPage} actions={
          <HeaderMenu items={[
            { label: 'Apply group', icon: <IconPlus size={16} />, onClick: () => onApplyGroup() },
            { label: 'Manage categories', icon: <IconPencil size={16} />, onClick: () => setManageOpen(true) },
            { label: 'Reset day', icon: <IconReset size={16} />, onClick: () => actions.resetDay(dkey), sep: true },
            { label: 'Delete all tasks', icon: <IconTrash size={16} />, onClick: () => setConfirmClear(true), danger: true },
          ]} />
        } />
        <DateNav dkey={dkey} setDkey={setDkey} recordKeys={recordKeys} />
      </StickyHeader>

      <div style={{ padding: '12px 0 calc(104px + env(safe-area-inset-bottom))' }}>
        {/* category switcher */}
        <div className="scrollarea" style={{
          display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto',
          padding: '0 14px', alignItems: 'center',
        }}>
          <CategoryPill cat={{ name: 'All' }} active={isAll} count={all.length} onClick={() => setCat('all')} />
          {cats.map(c => (
            <CategoryPill key={c.id} cat={c} active={cat === c.id} count={counts[c.id] || 0}
              onClick={() => setCat(c.id)} onLongPress={() => setActionCat(c.id)} />
          ))}
          <button type="button" onClick={() => setManageOpen(true)} title="Manage categories"
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 999, cursor: 'pointer',
              border: '1px dashed var(--border2)', background: 'var(--bg)', color: 'var(--text2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><IconPlus size={16} /></button>
        </div>

        <div style={{ padding: '0 14px' }}>
          {shown.length === 0 ? (
            <EmptyTasks onAdd={() => onAdd(isAll ? null : cat)} onApplyGroup={onApplyGroup} />
          ) : (
            <SortableTaskList tasks={shown} dkey={dkey} actions={actions} isAll={isAll} data={data}
              onEditTask={onEditTask} onLongPressTask={(id) => setActionTask(id)} />
          )}
        </div>
      </div>

      <ManageCategoriesSheet open={manageOpen} onClose={() => setManageOpen(false)} />
      <CategoryActionSheet open={!!actionCat} catId={actionCat}
        onClose={() => setActionCat(null)}
        onManageAll={() => { setActionCat(null); setManageOpen(true); }} />
      <TaskActionSheet open={!!actionTask} taskId={actionTask} dkey={dkey}
        onClose={() => setActionTask(null)} onEdit={(id) => onEditTask(id)} />
      <ConfirmSheet open={confirmClear} title="Delete all tasks"
        message={`Delete all ${all.length} task${all.length === 1 ? '' : 's'} for this day? This can’t be undone.`}
        confirmLabel="Delete all" onConfirm={() => { actions.clearDay(dkey); setConfirmClear(false); }}
        onClose={() => setConfirmClear(false)} />
    </div>
  );
}

function EmptyTasks({ onAdd, onApplyGroup }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '44px 24px 30px', color: 'var(--text2)',
    }}>
      <div style={{ color: 'var(--border2)', marginBottom: 16 }}><MarkTasks size={70} /></div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No tasks</div>
      <div style={{ fontSize: 13, marginBottom: 18 }}>Add a task or apply a group to get started.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" size="md" onClick={onAdd}><IconPlus size={15} /> Add task</Btn>
        <Btn variant="outline" size="md" onClick={onApplyGroup}>Apply group</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { TasksPage, CalendarPopover, SortableTaskList, DateNav, HeaderMenu, TaskCard, TaskActionSheet, ConfirmSheet, EmptyTasks });
