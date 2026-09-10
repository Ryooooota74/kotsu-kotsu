// calendar.jsx — CalendarPage: Month / Week / Day views + event & task-time editors.
// Exports: CalendarPage

const WD_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ── small time stepper ────────────────────────────────────────
function TimeStepper({ label, minutes, onChange, step = 15, min = 0, max = 1440, fmt }) {
  const dec = () => onChange(Math.max(min, minutes - step));
  const inc = () => onChange(Math.min(max, minutes + step));
  const sbtn = (icon, fn) => (
    <button type="button" onClick={fn} style={{
      width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)',
      color: 'var(--text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{icon}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{label}</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {sbtn(<IconMinus size={15} />, dec)}
        <span style={{ minWidth: 92, textAlign: 'center', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
          {fmt ? fmt(minutes) : fmtTime(minutes)}
        </span>
        {sbtn(<IconPlus size={15} />, inc)}
      </div>
    </div>
  );
}

const EV_COLORS = ['#e5484d', '#2f6feb', '#0f9d6b', '#e8590c', '#7048e8', '#0c8599', '#f08c00', '#5c6b7a'];

// ── event editor sheet (add / edit / delete) ──────────────────
function EventEditorSheet({ open, eventId, dkey, onClose }) {
  const { data, actions } = React.useContext(StoreContext);
  const editing = eventId && eventId !== 'new'
    ? (data.events || []).find(e => e.id === eventId) : null;
  const [title, setTitle] = React.useState('');
  const [start, setStart] = React.useState(540);
  const [duration, setDuration] = React.useState(60);
  const [color, setColor] = React.useState(EV_COLORS[0]);

  React.useEffect(() => {
    if (!open) return;
    if (editing) { setTitle(editing.title); setStart(editing.start); setDuration(editing.duration || 60); setColor(editing.color || EV_COLORS[0]); }
    else { setTitle(''); setStart(540); setDuration(60); setColor(EV_COLORS[0]); }
  }, [open, eventId]);

  const save = () => {
    const n = title.trim(); if (!n) return;
    if (editing) actions.updateEvent(editing.id, { title: n, start, duration, color });
    else actions.addEvent({ title: n, date: dkey, start, duration, color, source: 'local' });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{editing ? 'Edit event' : 'New event'}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>
      <div style={{ overflow: 'auto', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {editing && editing.source === 'apple' && (
          <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600,
            color: 'var(--text2)', background: 'var(--bg3)', padding: '4px 9px', borderRadius: 999 }}>
            <IconCalendar size={12} /> From Apple Calendar{editing.cal ? ` · ${editing.cal}` : ''}
          </div>
        )}
        <input value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={enterSubmits(save)} placeholder="Event title"
          className="inp" style={{ width: '100%', fontSize: 15, fontWeight: 600, padding: '11px 13px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TimeStepper label="Starts" minutes={start} onChange={(v) => setStart(Math.min(v, DAY_MIN - SNAP))} />
          <TimeStepper label="Duration" minutes={duration} onChange={setDuration} min={15} max={DAY_MIN}
            fmt={(m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`} />
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Color</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {EV_COLORS.map(col => (
              <button type="button" key={col} onClick={() => setColor(col)} style={{
                width: 28, height: 28, borderRadius: 999, background: col, cursor: 'pointer',
                border: col === color ? '2px solid var(--text)' : '2px solid transparent', boxShadow: '0 0 0 1px var(--border)',
              }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
        {editing ? (
          <Btn variant="outline" onClick={() => { actions.deleteEvent(editing.id); onClose(); }}
            style={{ flex: 1, color: '#e5484d', borderColor: 'var(--border)' }}><IconTrash size={15} /> Delete</Btn>
        ) : (
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        )}
        <Btn variant="primary" onClick={save} disabled={!title.trim()} style={{ flex: 2 }}>{editing ? 'Save' : 'Add event'}</Btn>
      </div>
    </Sheet>
  );
}

// ── task time editor sheet ────────────────────────────────────
function TaskTimeSheet({ open, taskId, dkey, onClose }) {
  const { data, actions } = React.useContext(StoreContext);
  const task = (data.days[dkey] || []).find(t => t.id === taskId);
  const [start, setStart] = React.useState(540);
  const [duration, setDuration] = React.useState(60);
  React.useEffect(() => {
    if (open && task) { setStart(task.start ?? 540); setDuration(task.duration || 60); }
  }, [open, taskId]);
  if (!task) return null;
  const cat = getCat(data, task.category);

  return (
    <Sheet open={open} onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 18px 12px' }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: cat.color, flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
        <IconBtn onClick={onClose} title="Close"><IconClose size={18} /></IconBtn>
      </div>
      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TimeStepper label="Starts" minutes={start} onChange={(v) => setStart(Math.min(v, DAY_MIN - SNAP))} />
        <TimeStepper label="Duration" minutes={duration} onChange={setDuration} min={15} max={DAY_MIN}
          fmt={(m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="outline" onClick={() => { actions.unscheduleTask(dkey, task.id); onClose(); }} style={{ flex: 1 }}>
            Remove from day
          </Btn>
          <Btn variant="primary" onClick={() => { actions.scheduleTask(dkey, task.id, start, duration); onClose(); }} style={{ flex: 1 }}>
            Save time
          </Btn>
        </div>
      </div>
    </Sheet>
  );
}

// ── month grid ────────────────────────────────────────────────
function MonthGrid({ viewDate, dkey, onPick }) {
  const { data } = React.useContext(StoreContext);
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const todayKey = dateKey(new Date());
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // index the events once instead of rescanning them for all 42 cells
  const eventsByDate = React.useMemo(() => {
    const m = new Map();
    (data.events || []).forEach(e => {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date).push(e.color || '#e5484d');
    });
    return m;
  }, [data.events]);

  // A busy day used to fill all four dots with events and show nothing for the
  // tasks — take from both so each is represented.
  const dotsFor = (k) => {
    const ev = eventsByDate.get(k) || [];
    const tk = (data.days[k] || []).map(t => getCat(data, t.category).color);
    const out = [];
    for (let i = 0; out.length < 4 && (i < ev.length || i < tk.length); i++) {
      if (i < ev.length && out.length < 4) out.push(ev[i]);
      if (i < tk.length && out.length < 4) out.push(tk[i]);
    }
    return out;
  };

  return (
    <div style={{ padding: '4px 12px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {WD_MIN.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', padding: '4px 0' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const k = dateKey(new Date(y, m, d));
          const isToday = k === todayKey, isSel = k === dkey;
          const dots = dotsFor(k);
          return (
            <button type="button" key={i} onClick={() => onPick(k)}
              style={{
                aspectRatio: '0.82', border: '1px solid ' + (isSel ? 'var(--accent)' : 'transparent'),
                background: isSel ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer',
                borderRadius: 9, padding: '5px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{
                width: 24, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12.5, fontWeight: isToday ? 700 : 500, fontVariantNumeric: 'tabular-nums',
                background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? 'var(--on-accent)' : 'var(--text)',
              }}>{d}</span>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 30 }}>
                {dots.map((c, j) => <span key={j} style={{ width: 4, height: 4, borderRadius: 999, background: c }} />)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── week view (mini 7-col timeline) ───────────────────────────
const WK_HOUR = 44;
function WeekView({ viewDate, dkey, onPick, onOpenDay }) {
  const { data } = React.useContext(StoreContext);
  const scrollRef = React.useRef(null);
  const todayKey = dateKey(new Date());
  // week starts Sunday
  const base = new Date(viewDate); base.setDate(base.getDate() - base.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(base, i));

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 7 * WK_HOUR; }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(7,1fr)', flexShrink: 0,
        borderBottom: '1px solid var(--border)', paddingBottom: 6, paddingTop: 2 }}>
        <div />
        {days.map((d, i) => {
          const k = dateKey(d), isToday = k === todayKey, isSel = k === dkey;
          return (
            <button type="button" key={i} onClick={() => onOpenDay(k)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '2px 0' }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--muted)' }}>{WD_SHORT[d.getDay()][0]}</span>
              <span style={{
                width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                background: isToday ? 'var(--accent)' : (isSel ? 'var(--accent-soft)' : 'transparent'),
                color: isToday ? 'var(--on-accent)' : 'var(--text)',
              }}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* scrollable grid */}
      <div ref={scrollRef} className="scrollarea" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ position: 'relative', height: WK_HOUR * 24, display: 'grid', gridTemplateColumns: '28px repeat(7,1fr)' }}>
          {/* hour labels col */}
          <div style={{ position: 'relative' }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ position: 'absolute', top: h * WK_HOUR - 6, right: 4, fontSize: 8.5, color: 'var(--muted)', fontWeight: 600 }}>
                {h === 0 ? '' : (h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p')}
              </div>
            ))}
          </div>
          {/* day columns */}
          {days.map((d, di) => {
            const k = dateKey(d);
            const evs = (data.events || []).filter(e => e.date === k).map(e => ({ ...e, color: e.color, isEvent: true }));
            const tks = (data.days[k] || []).filter(t => t.start != null).map(t => ({ start: t.start, duration: t.duration || 60, color: getCat(data, t.category).color, title: t.title }));
            const items = [...evs, ...tks];
            return (
              <div key={di} onClick={() => onPick(k)} style={{ position: 'relative', borderLeft: '1px solid var(--border)' }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} style={{ position: 'absolute', top: h * WK_HOUR, left: 0, right: 0, borderTop: '1px solid var(--border)', opacity: 0.5 }} />
                ))}
                {items.map((it, ii) => (
                  <div key={ii} style={{
                    position: 'absolute', top: (it.start / 60) * WK_HOUR, height: Math.max(8, (it.duration / 60) * WK_HOUR - 2),
                    left: 1, right: 1, borderRadius: 3, background: it.isEvent ? `color-mix(in srgb, ${it.color} 22%, #fff)` : it.color,
                    borderLeft: `2px solid ${it.color}`, overflow: 'hidden',
                  }} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── calendar page ─────────────────────────────────────────────
function CalendarPage({ page, setPage, dkey, setDkey }) {
  const [view, setView] = React.useState('month'); // month | week | day
  const [viewDate, setViewDate] = React.useState(() => parseKey(dkey));
  const [evSheet, setEvSheet] = React.useState(null); // null | 'new' | id
  const [taskSheet, setTaskSheet] = React.useState(null);

  React.useEffect(() => { setViewDate(parseKey(dkey)); }, [dkey]);

  const d = parseKey(dkey);
  const title = view === 'month'
    ? `${MON_LONG[viewDate.getMonth()]} ${viewDate.getFullYear()}`
    : view === 'week'
      ? `${MON_SHORT[viewDate.getMonth()]} ${viewDate.getFullYear()}`
      : `${WD_SHORT[d.getDay()]}, ${MON_SHORT[d.getMonth()]} ${d.getDate()}`;

  const shift = (n) => {
    if (view === 'month') setViewDate(v => new Date(v.getFullYear(), v.getMonth() + n, 1));
    else if (view === 'week') { setViewDate(v => addDays(v, n * 7)); }
    else { setDkey(dateKey(addDays(d, n))); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <StickyHeader>
        <AppHeader page={page} setPage={setPage} actions={
          <Btn variant="primary" size="sm" onClick={() => setEvSheet('new')}><IconPlus size={15} /> Event</Btn>
        } />
        {/* view switcher */}
        <div style={{ padding: '6px 12px 10px' }}>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 9, padding: 3, gap: 3 }}>
            {[['month', 'Month'], ['week', 'Week'], ['day', 'Day']].map(([k, label]) => {
              const active = view === k;
              return (
                <button type="button" key={k} onClick={() => setView(k)} style={{
                  flex: 1, border: 'none', cursor: 'pointer', borderRadius: 7, padding: '7px 10px',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  background: active ? 'var(--bg)' : 'transparent', color: active ? 'var(--text)' : 'var(--text2)',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>{label}</button>
              );
            })}
          </div>
        </div>
        {/* period nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 10px' }}>
          <IconBtn size={34} onClick={() => shift(-1)} title="Previous" style={{ border: '1px solid var(--border)' }}><IconArrowLeft size={17} /></IconBtn>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{title}</span>
          <IconBtn size={34} onClick={() => shift(1)} title="Next" style={{ border: '1px solid var(--border)' }}><IconArrowRight size={17} /></IconBtn>
        </div>
      </StickyHeader>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {view === 'month' && (
          <div className="scrollarea" style={{ overflowY: 'auto' }}>
            <MonthGrid viewDate={viewDate} dkey={dkey} onPick={(k) => { setDkey(k); setView('day'); }} />
          </div>
        )}
        {view === 'week' && (
          <WeekView viewDate={viewDate} dkey={dkey}
            onPick={(k) => setDkey(k)} onOpenDay={(k) => { setDkey(k); setView('day'); }} />
        )}
        {view === 'day' && (
          <DayTimeline dkey={dkey}
            onEditEvent={(id) => setEvSheet(id)} onEditTask={(id) => setTaskSheet(id)} />
        )}
      </div>

      <EventEditorSheet open={!!evSheet} eventId={evSheet} dkey={dkey} onClose={() => setEvSheet(null)} />
      <TaskTimeSheet open={!!taskSheet} taskId={taskSheet} dkey={dkey} onClose={() => setTaskSheet(null)} />
    </div>
  );
}

Object.assign(window, { CalendarPage, MonthGrid, WeekView, EventEditorSheet, TaskTimeSheet });
