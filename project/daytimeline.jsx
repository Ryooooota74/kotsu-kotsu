// daytimeline.jsx — single-day hour-by-hour timeline (0–24h).
// Scheduled tasks + calendar events placed by time; drag to move, resize handle,
// tap to edit, unscheduled tray to drop tasks in. Exports: DayTimeline

const HOUR_PX = 58;
const SNAP = 15; // minutes
const DAY_MIN = 1440;

function snap(min) { return Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP) * SNAP)); }

// lay items into non-overlapping columns, clustered so width is only split
// among items that actually overlap (not across the whole day)
function packColumns(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const layout = new Map();
  let i = 0;
  while (i < sorted.length) {
    // grow a cluster of transitively-overlapping items
    const cluster = [sorted[i]];
    let clusterEnd = sorted[i].end;
    let j = i + 1;
    while (j < sorted.length && sorted[j].start < clusterEnd) {
      cluster.push(sorted[j]);
      clusterEnd = Math.max(clusterEnd, sorted[j].end);
      j++;
    }
    // greedy column assignment within the cluster
    const cols = [];
    cluster.forEach(it => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c] <= it.start) { cols[c] = it.end; it._col = c; placed = true; break; }
      }
      if (!placed) { it._col = cols.length; cols.push(it.end); }
    });
    const total = cols.length;
    cluster.forEach(it => layout.set(it.key, { col: it._col, cols: total }));
    i = j;
  }
  return { layout };
}

function DayTimeline({ dkey, onEditEvent, onEditTask }) {
  const { data, actions } = React.useContext(StoreContext);
  const scrollRef = React.useRef(null);
  const laneRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null); // {kind:'move'|'resize', id, type, offset, start, duration}

  const tasks = (data.days[dkey] || []);
  const events = (data.events || []).filter(e => e.date === dkey);
  const scheduled = tasks.filter(t => t.start != null);
  const unscheduled = tasks.filter(t => t.start == null);

  // scroll to ~7am on mount
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX - 10;
  }, [dkey]);

  // build blocks
  const blocks = [
    ...events.map(e => ({ key: 'e' + e.id, id: e.id, type: 'event', title: e.title,
      start: e.start, end: Math.min(DAY_MIN, e.start + (e.duration || 60)), duration: e.duration || 60,
      color: e.color || '#e5484d', source: e.source, sub: e.cal })),
    ...scheduled.map(t => { const cat = getCat(data, t.category);
      const dur = t.duration || 60;
      return { key: 't' + t.id, id: t.id, type: 'task', title: t.title,
        start: t.start, end: Math.min(DAY_MIN, t.start + dur), duration: dur,
        color: cat.color, done: t.completedCount >= t.totalBoxes && t.totalBoxes > 0 }; }),
  ];
  const { layout } = packColumns(blocks.map(b => ({ key: b.key, start: b.start, end: b.end })));

  // live drag override
  const livePos = (b) => {
    if (drag && drag.id === b.id && drag.type === b.type) {
      return { start: drag.start, duration: drag.duration };
    }
    return { start: b.start, duration: b.duration };
  };

  const onPointerDownBlock = (e, b, kind) => {
    e.stopPropagation();
    const laneRect = laneRef.current.getBoundingClientRect();
    const y = e.clientY - laneRect.top;
    const blockTop = (b.start / 60) * HOUR_PX;
    setDrag({ kind, id: b.id, type: b.type, grabOffset: y - blockTop, start: b.start, duration: b.duration, moved: false });
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const laneRect = laneRef.current.getBoundingClientRect();
    const y = e.clientY - laneRect.top + (scrollRef.current ? 0 : 0);
    if (drag.kind === 'move') {
      let newStart = snap(((y - drag.grabOffset) / HOUR_PX) * 60);
      newStart = Math.max(0, Math.min(DAY_MIN - drag.duration, newStart));
      setDrag(d => ({ ...d, start: newStart, moved: true }));
    } else {
      let newDur = snap(((y) / HOUR_PX) * 60 - drag.start);
      newDur = Math.max(SNAP, Math.min(DAY_MIN - drag.start, newDur));
      setDrag(d => ({ ...d, duration: newDur, moved: true }));
    }
  };

  const commitDrag = (e) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (!d.moved) {
      // treat as tap → edit
      if (d.type === 'event') onEditEvent && onEditEvent(d.id);
      else onEditTask && onEditTask(d.id);
      return;
    }
    if (d.type === 'event') actions.updateEvent(d.id, { start: d.start, duration: d.duration });
    else actions.scheduleTask(dkey, d.id, d.start, d.duration);
  };

  // drop an unscheduled task: place at 9:00 or first open-ish hour
  const scheduleFromTray = (taskId) => {
    actions.scheduleTask(dkey, taskId, 9 * 60, 60);
  };

  const hours = Array.from({ length: 25 }, (_, i) => i);
  const nowMin = (() => {
    const n = new Date();
    return (dkey === dateKey(n)) ? n.getHours() * 60 + n.getMinutes() : null;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* unscheduled tray */}
      {unscheduled.length > 0 && (
        <div style={{ flexShrink: 0, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Unscheduled · {unscheduled.length}
          </div>
          <div className="scrollarea" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {unscheduled.map(t => {
              const cat = getCat(data, t.category);
              return (
                <button type="button" key={t.id} onClick={() => scheduleFromTray(t.id)}
                  title="Tap to place at 9:00, then drag"
                  style={{
                    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 999,
                    padding: '7px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: cat.color, flexShrink: 0 }} />
                  <span style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  <IconPlus size={13} style={{ color: 'var(--muted)' }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* timeline scroll */}
      <div ref={scrollRef} className="scrollarea" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <div ref={laneRef} style={{ position: 'relative', height: HOUR_PX * 24, marginLeft: 52 }}
          onPointerMove={onPointerMove} onPointerUp={commitDrag} onPointerCancel={commitDrag}>
          {/* hour lines + labels */}
          {hours.map(h => (
            <div key={h} style={{ position: 'absolute', top: h * HOUR_PX, left: 0, right: 0, height: 0 }}>
              <div style={{ position: 'absolute', left: -52, top: -7, width: 46, textAlign: 'right',
                fontSize: 10.5, color: 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {h === 0 || h === 24 ? '' : (h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`)}
              </div>
              <div style={{ position: 'absolute', left: 0, right: 8, top: 0, borderTop: '1px solid var(--border)' }} />
            </div>
          ))}

          {/* now indicator */}
          {nowMin != null && (
            <div style={{ position: 'absolute', top: (nowMin / 60) * HOUR_PX, left: 0, right: 8, zIndex: 6, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />
              <div style={{ borderTop: '2px solid var(--accent)' }} />
            </div>
          )}

          {/* blocks */}
          {blocks.map(b => {
            const pos = livePos(b);
            const lay = layout.get(b.key) || { col: 0, cols: 1 };
            const top = (pos.start / 60) * HOUR_PX;
            const height = Math.max(20, (pos.duration / 60) * HOUR_PX - 3);
            const isDragging = drag && drag.id === b.id && drag.type === b.type;
            const isEvent = b.type === 'event';
            return (
              <div key={b.key}
                onPointerDown={(e) => onPointerDownBlock(e, b, 'move')}
                style={{
                  position: 'absolute', top, height,
                  left: `calc(${(lay.col / lay.cols) * 100}% + 2px)`,
                  width: `calc(${(1 / lay.cols) * 100}% - 10px)`,
                  borderRadius: 7, padding: '5px 8px', cursor: 'grab', touchAction: 'none',
                  zIndex: isDragging ? 20 : 8, overflow: 'hidden',
                  background: isEvent ? `color-mix(in srgb, ${b.color} 15%, #fff)` : b.color,
                  border: isEvent ? `1px solid color-mix(in srgb, ${b.color} 45%, #fff)` : 'none',
                  borderLeft: isEvent ? `3px solid ${b.color}` : 'none',
                  color: isEvent ? 'var(--text)' : '#fff',
                  opacity: b.done ? 0.5 : 1,
                  boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.22)' : 'none',
                  userSelect: 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {isEvent && <IconCalendar size={11} style={{ color: b.color, flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.1, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: b.done ? 'line-through' : 'none' }}>{b.title}</span>
                </div>
                {height > 30 && (
                  <div style={{ fontSize: 10.5, marginTop: 1, opacity: isEvent ? 0.7 : 0.85, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtRange(pos.start, pos.duration)}
                  </div>
                )}
                {/* resize handle */}
                <div onPointerDown={(e) => onPointerDownBlock(e, b, 'resize')}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, cursor: 'ns-resize', touchAction: 'none' }}>
                  <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                    width: 22, height: 3, borderRadius: 9, background: isEvent ? b.color : 'rgba(255,255,255,0.7)', opacity: 0.7 }} />
                </div>
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div style={{ position: 'absolute', top: 8 * HOUR_PX, left: 0, right: 8, textAlign: 'center', color: 'var(--muted)', fontSize: 12.5 }}>
              Nothing scheduled. Tap a task in the tray, or use “+ Event”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DayTimeline, HOUR_PX, DAY_MIN, SNAP });
