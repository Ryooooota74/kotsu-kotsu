// store.jsx — data model, localStorage persistence, seed data, helpers
// Exports to window: useStore, StoreContext, dateKey, fmt helpers, uid

const uid = () => Math.random().toString(36).slice(2, 9);

// ── date helpers ──────────────────────────────────────────────
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function isSameDay(a, b) { return dateKey(a) === dateKey(b); }

// ── factories ─────────────────────────────────────────────────
function makeTask({ title, category = 'work', totalBoxes = 1, subtasks = [], fromTodoId, fromGroupId, fromGroupName, start = null, duration = 60 }) {
  return {
    id: uid(), title, category,
    completedCount: 0, totalBoxes,
    subtasks: subtasks.map(s => ({
      id: uid(), title: s.title, completedCount: 0, totalBoxes: s.totalBoxes || 1,
    })),
    isExpanded: false, fromTodoId, fromGroupId, fromGroupName,
    start, duration, // start = minutes from midnight (null = unscheduled); duration in minutes
  };
}

// minutes-from-midnight ↔ "9:30 AM" / "14:00"
function fmtTime(min) {
  if (min == null) return '';
  let h = Math.floor(min / 60), m = min % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}
function fmtRange(start, duration) {
  if (start == null) return '';
  return `${fmtTime(start)} – ${fmtTime(Math.min(1440, start + (duration || 60)))}`;
}

// soft-deadline phrasing for a To-do due date (YYYY-MM-DD | null)
function dueInfo(due) {
  if (!due) return { label: null, tone: 'none', sort: Infinity };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = parseKey(due); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  let label, tone;
  if (diff < 0) { label = diff === -1 ? '1 day overdue' : `${-diff} days overdue`; tone = 'over'; }
  else if (diff === 0) { label = 'Today'; tone = 'today'; }
  else if (diff === 1) { label = 'Tomorrow'; tone = 'soon'; }
  else if (diff <= 6) { label = `In ${diff} days`; tone = 'soon'; }
  else { label = `${MON_SHORT[d.getMonth()]} ${d.getDate()}`; tone = 'far'; }
  return { label, tone, sort: diff };
}

// ── seed ──────────────────────────────────────────────────────
function seed() {
  const today = dateKey(new Date());
  const yest = dateKey(addDays(new Date(), -1));
  const tom = dateKey(addDays(new Date(), 1));
  return {
    categories: [
      { id: 'work', name: 'Work', color: '#2f6feb' },
      { id: 'personal', name: 'Personal', color: '#0f9d6b' },
      { id: 'clienta', name: 'Client A', color: '#e8590c' },
      { id: 'clientb', name: 'Client B', color: '#7048e8' },
    ],
    days: {
      [today]: [
        { ...makeTask({ title: 'Morning pages', category: 'personal', totalBoxes: 1, start: 420, duration: 30 }), completedCount: 1 },
        makeTask({
          title: 'Inbox zero', category: 'work', totalBoxes: 3, start: 540, duration: 45,
          subtasks: [{ title: 'Reply to design review', totalBoxes: 1 }, { title: 'Archive newsletters', totalBoxes: 1 }],
        }),
        { ...makeTask({ title: 'Drink water', category: 'personal', totalBoxes: 8 }), completedCount: 5 },
        makeTask({ title: 'Design review deck', category: 'clienta', totalBoxes: 1, start: 870, duration: 90 }),
        makeTask({ title: 'Send invoice + timesheet', category: 'clientb', totalBoxes: 1 }),
        makeTask({ title: 'Stand-up notes', category: 'work', totalBoxes: 1 }),
      ],
      [yest]: [
        { ...makeTask({ title: 'Plan the week', category: 'work', totalBoxes: 1 }), completedCount: 1 },
        { ...makeTask({ title: 'Stretch', category: 'personal', totalBoxes: 2 }), completedCount: 2 },
      ],
    },
    // imported / local calendar events. start+duration in minutes from midnight.
    events: [
      { id: uid(), title: 'Team stand-up', date: today, start: 600, duration: 30, color: '#e5484d', source: 'apple', cal: 'Work' },
      { id: uid(), title: 'Lunch with Sara', date: today, start: 750, duration: 60, color: '#0c8599', source: 'apple', cal: 'Personal' },
      { id: uid(), title: 'Client A — design sync', date: today, start: 900, duration: 60, color: '#e5484d', source: 'apple', cal: 'Work' },
      { id: uid(), title: 'Gym', date: today, start: 1140, duration: 60, color: '#0c8599', source: 'apple', cal: 'Personal' },
      { id: uid(), title: 'Dentist', date: tom, start: 540, duration: 45, color: '#e5484d', source: 'apple', cal: 'Personal' },
      { id: uid(), title: 'Sprint planning', date: tom, start: 660, duration: 90, color: '#e5484d', source: 'apple', cal: 'Work' },
    ],
    todos: [
      { id: uid(), title: 'Return library books', due: dateKey(addDays(new Date(), -2)), createdAt: Date.now() },
      { id: uid(), title: 'Book dentist appointment', due: dateKey(new Date()), createdAt: Date.now() },
      { id: uid(), title: 'Return Amazon package', due: dateKey(addDays(new Date(), 2)), createdAt: Date.now() },
      { id: uid(), title: 'Buy birthday gift for Mei', due: dateKey(addDays(new Date(), 5)), createdAt: Date.now() },
      { id: uid(), title: 'Gather tax documents', due: null, createdAt: Date.now() },
    ],
    groups: [
      {
        id: uid(), name: 'Morning routine', createdAt: Date.now(),
        tasks: [
          { id: uid(), title: 'Morning pages', category: 'personal', totalBoxes: 1, subtasks: [] },
          { id: uid(), title: 'Drink water', category: 'personal', totalBoxes: 2, subtasks: [] },
          { id: uid(), title: 'Review calendar', category: 'work', totalBoxes: 1, subtasks: [] },
        ],
      },
      {
        id: uid(), name: 'Ship day', createdAt: Date.now(),
        tasks: [
          { id: uid(), title: 'Final QA pass', category: 'work', totalBoxes: 1, subtasks: [] },
          { id: uid(), title: 'Update changelog', category: 'work', totalBoxes: 1, subtasks: [] },
          { id: uid(), title: 'Announce in #general', category: 'work', totalBoxes: 1, subtasks: [] },
        ],
      },
    ],
  };
}

const LS_KEY = 'taskmgr_v4';
// phones use the same <768px breakpoint as the layout switcher. On a phone the
// on-screen keyboard covers the form, so Enter should dismiss it rather than save.
function isPhoneWidth() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

// Enter: save on desktop, just close the keyboard on phones
function enterSubmits(save) {
  return (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (isPhoneWidth()) e.currentTarget.blur(); else save();
  };
}

// strip fields left behind by removed features so old rows don't carry dead data
function normalise(d) {
  if (d && Array.isArray(d.todos)) {
    d.todos.forEach(t => { delete t.dividerBelow; delete t.dividerLabel; });
  }
  return d;
}

// True when this device had real saved data to start from. When it's false we're
// holding demo seed data, which must never be pushed over the cloud (see below).
let LOADED_FROM_DISK = false;

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { LOADED_FROM_DISK = true; return normalise(JSON.parse(raw)); }
  } catch (e) {}
  const s = seed();
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}

const StoreContext = React.createContext(null);

// ── cloud sync (Supabase) ─────────────────────────────────────
// Config is supplied by the host page as `window.KOTSU_SYNC = { url, anonKey, rowId }`.
// When it's absent/empty, the app runs exactly as before (localStorage only).
const SYNC_CFG = (typeof window !== 'undefined' && window.KOTSU_SYNC) || {};
const SYNC_ENABLED = !!(SYNC_CFG.url && SYNC_CFG.anonKey && typeof window !== 'undefined' && window.supabase);
const SYNC_ROW = SYNC_CFG.rowId || 'main';
const SYNC_TABLE = SYNC_CFG.table || 'app_state';
const REV_KEY = 'taskmgr_rev';
let _sbClient = null;
function sbClient() {
  if (!SYNC_ENABLED) return null;
  if (!_sbClient) _sbClient = window.supabase.createClient(SYNC_CFG.url, SYNC_CFG.anonKey);
  return _sbClient;
}

function useStoreProvider() {
  const [data, setData] = React.useState(load);
  // 'off' | 'connecting' | 'saving' | 'synced' | 'error'
  const [syncStatus, setSyncStatus] = React.useState(SYNC_ENABLED ? 'connecting' : 'off');
  const hydratedRef = React.useRef(!SYNC_ENABLED); // gate pushes until first pull resolves
  const applyingRemoteRef = React.useRef(false);   // skip the push triggered by an incoming pull
  const pushTimer = React.useRef(null);
  const pendingRef = React.useRef(null);   // { data, rev } edited locally but not yet in the cloud
  const retryTimer = React.useRef(null);
  const retryDelay = React.useRef(0);
  const pullingRef = React.useRef(false);
  const lastPullAt = React.useRef(0);
  const pullRetryTimer = React.useRef(null);
  const pullRetryDelay = React.useRef(0);

  // send whatever is queued; on failure keep it queued and retry with backoff, so a
  // change made while offline still reaches the cloud instead of being dropped
  const flush = React.useCallback(async () => {
    clearTimeout(retryTimer.current);
    const p = pendingRef.current;
    if (!SYNC_ENABLED || !p) return;
    setSyncStatus('saving');
    try {
      const { error } = await sbClient()
        .from(SYNC_TABLE).upsert({ id: SYNC_ROW, data: p.data, updated_at: new Date(p.rev).toISOString() });
      if (error) throw error;
      retryDelay.current = 0;
      // a newer edit may have queued while we were in flight — keep that one
      if (pendingRef.current === p) { pendingRef.current = null; setSyncStatus('synced'); }
    } catch (e) {
      console.warn('[sync] push failed, will retry', e && e.message);
      setSyncStatus('error');
      retryDelay.current = Math.min(retryDelay.current ? retryDelay.current * 2 : 3000, 60000);
      retryTimer.current = setTimeout(flush, retryDelay.current);
    }
  }, []);

  // pull from the cloud; remote is authoritative when it's newer than our local copy
  const pull = React.useCallback(async () => {
    if (!SYNC_ENABLED || pullingRef.current) return { ok: false, changed: false };
    pullingRef.current = true;
    lastPullAt.current = Date.now();
    setSyncStatus('connecting');
    let changed = false;
    try {
      const { data: row, error } = await sbClient()
        .from(SYNC_TABLE).select('data, updated_at').eq('id', SYNC_ROW).maybeSingle();
      if (error) throw error;
      if (row && row.data) {
        const localRev = Number(localStorage.getItem(REV_KEY) || 0);
        const remoteRev = new Date(row.updated_at).getTime();
        if (remoteRev > localRev) {
          // remote is newer than anything we have queued — drop the stale pending push
          // so it can't overwrite the other device's more recent work
          clearTimeout(pushTimer.current);
          clearTimeout(retryTimer.current);
          pendingRef.current = null;
          applyingRemoteRef.current = true;
          setData(normalise(row.data));
          changed = true;
          try { localStorage.setItem(REV_KEY, String(remoteRev)); } catch (e) {}
        }
      }
      setSyncStatus(pendingRef.current ? 'saving' : 'synced');
      hydratedRef.current = true;
      pullRetryDelay.current = 0;
      clearTimeout(pullRetryTimer.current);
      if (pendingRef.current) flush();
      return { ok: true, changed };
    } catch (e) {
      console.warn('[sync] pull failed', e && e.message);
      setSyncStatus('error');
      // A device holding only demo seed data must not start pushing just because
      // the first pull failed — that would overwrite real cloud data with the
      // seed. Stay gated and keep trying to read the cloud instead.
      if (LOADED_FROM_DISK) hydratedRef.current = true;
      else {
        pullRetryDelay.current = Math.min(pullRetryDelay.current ? pullRetryDelay.current * 2 : 3000, 60000);
        clearTimeout(pullRetryTimer.current);
        pullRetryTimer.current = setTimeout(() => pull(), pullRetryDelay.current);
      }
      return { ok: false, changed: false };
    } finally {
      pullingRef.current = false;
    }
  }, [flush]);

  // initial pull on mount
  React.useEffect(() => { pull(); }, [pull]);

  // The app stays open for days on a phone home screen. Without this, coming back to
  // it shows a stale day and the first edit overwrites whatever the other device did.
  React.useEffect(() => {
    if (!SYNC_ENABLED) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastPullAt.current < 10000) { if (pendingRef.current) flush(); return; }
      pull();
    };
    const onOnline = () => {
      retryDelay.current = 0;
      clearTimeout(retryTimer.current);
      // pull() flushes on success; if the pull itself fails, still try the queued push
      pull().then((r) => { if (!r.ok && pendingRef.current) flush(); });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [pull, flush]);

  // persist to localStorage always; debounce-push to the cloud once hydrated
  React.useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
    if (!SYNC_ENABLED || !hydratedRef.current) return;
    if (applyingRemoteRef.current) { applyingRemoteRef.current = false; return; }
    const rev = Date.now();
    try { localStorage.setItem(REV_KEY, String(rev)); } catch (e) {}
    pendingRef.current = { data, rev };
    setSyncStatus('saving');
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    retryDelay.current = 0;
    pushTimer.current = setTimeout(flush, 700);
  }, [data, flush]);

  // mutate(draft => {...}) — clones, applies, sets
  const mutate = React.useCallback((fn) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }, []);

  const actions = React.useMemo(() => ({
    dayTasks(key) { return (data.days[key] || []); },

    addTask(key, taskInput) {
      mutate(d => {
        if (!d.days[key]) d.days[key] = [];
        d.days[key].push(makeTask(taskInput));
      });
    },
    addTasksBulk(key, taskInputs) {
      mutate(d => {
        if (!d.days[key]) d.days[key] = [];
        taskInputs.forEach(t => d.days[key].push(makeTask(t)));
      });
    },
    updateTask(key, id, fn) {
      mutate(d => {
        const t = (d.days[key] || []).find(x => x.id === id);
        if (!t) return;
        fn(t);
        if (!t.fromTodoId) return;
        const done = t.totalBoxes > 0 && t.completedCount >= t.totalBoxes;
        d.todos = d.todos || [];
        const idx = d.todos.findIndex(td => td.id === t.fromTodoId);
        if (done && idx >= 0) {
          // completing a To-do-sourced task takes it off the To-do list, but keep a
          // copy on the task so un-checking puts it back exactly as it was
          t.todoSnapshot = d.todos[idx];
          d.todos.splice(idx, 1);
        } else if (!done && idx < 0 && t.todoSnapshot) {
          // un-checked again — restore the To-do where it was removed from
          d.todos.unshift(t.todoSnapshot);
          delete t.todoSnapshot;
        }
      });
    },
    deleteTask(key, id) {
      mutate(d => { d.days[key] = (d.days[key] || []).filter(x => x.id !== id); });
    },
    // remove a specific set of tasks (by id) from a day
    removeTasks(key, ids) {
      mutate(d => { const set = new Set(ids); d.days[key] = (d.days[key] || []).filter(x => !set.has(x.id)); });
    },
    // move a task (with all its progress) from one day to another
    moveTask(fromKey, id, toKey) {
      mutate(d => {
        const arr = d.days[fromKey] || [];
        const idx = arr.findIndex(t => t.id === id);
        if (idx < 0) return;
        const [task] = arr.splice(idx, 1);
        if (!d.days[toKey]) d.days[toKey] = [];
        d.days[toKey].push(task);
      });
    },
    // move several tasks (e.g. a whole group block) to another day, keeping order
    moveTasks(fromKey, ids, toKey) {
      mutate(d => {
        const set = new Set(ids);
        const arr = d.days[fromKey] || [];
        const moving = arr.filter(t => set.has(t.id));
        d.days[fromKey] = arr.filter(t => !set.has(t.id));
        if (!d.days[toKey]) d.days[toKey] = [];
        d.days[toKey].push(...moving);
      });
    },
    // reorder the tasks whose ids appear in orderedIds, leaving any task not in
    // that list (e.g. filtered out by category) at its current array position
    reorderTasks(key, orderedIds) {
      mutate(d => {
        const arr = d.days[key] || [];
        const idSet = new Set(orderedIds);
        const byId = new Map(arr.map(t => [t.id, t]));
        const queue = orderedIds.map(id => byId.get(id)).filter(Boolean);
        let qi = 0;
        d.days[key] = arr.map(t => (idSet.has(t.id) ? queue[qi++] : t));
      });
    },
    // wholesale replace (restoring a backup file). Missing sections fall back to
    // empty rather than the seed, so a partial file can't resurrect demo data.
    replaceAll(next) {
      const clean = normalise({
        categories: Array.isArray(next.categories) ? next.categories : [],
        days: (next.days && typeof next.days === 'object') ? next.days : {},
        events: Array.isArray(next.events) ? next.events : [],
        todos: Array.isArray(next.todos) ? next.todos : [],
        groups: Array.isArray(next.groups) ? next.groups : [],
      });
      setData(clean);
    },

    resetDay(key) {
      mutate(d => {
        (d.days[key] || []).forEach(t => {
          t.completedCount = 0;
          t.subtasks.forEach(s => { s.completedCount = 0; });
        });
      });
    },
    // remove every task for a given day
    clearDay(key) {
      mutate(d => { d.days[key] = []; });
    },
    // place/unplace a task on the day timeline
    scheduleTask(key, id, start, duration) {
      mutate(d => {
        const t = (d.days[key] || []).find(x => x.id === id);
        if (!t) return;
        t.start = start;
        if (duration != null) t.duration = duration;
        else if (t.duration == null) t.duration = 60;
      });
    },
    unscheduleTask(key, id) {
      mutate(d => {
        const t = (d.days[key] || []).find(x => x.id === id);
        if (t) t.start = null;
      });
    },

    // calendar events
    addEvent(ev) { mutate(d => { if (!d.events) d.events = []; d.events.push({ id: uid(), source: 'local', color: '#e5484d', duration: 60, ...ev }); }); },
    updateEvent(id, patch) { mutate(d => { const i = (d.events || []).findIndex(e => e.id === id); if (i >= 0) d.events[i] = { ...d.events[i], ...patch }; }); },
    deleteEvent(id) { mutate(d => { d.events = (d.events || []).filter(e => e.id !== id); }); },

    // to-do backlog
    addTodo(t) { mutate(d => { d.todos.unshift({ ...t, id: uid(), createdAt: Date.now() }); }); },
    // a divider is a standalone entry in the backlog you can drag anywhere
    addDivider() { mutate(d => { d.todos.unshift({ id: uid(), type: 'divider', label: '', createdAt: Date.now() }); }); },
    updateTodo(id, t) { mutate(d => { const i = d.todos.findIndex(x => x.id === id); if (i >= 0) d.todos[i] = { ...d.todos[i], ...t }; }); },
    deleteTodo(id) { mutate(d => { d.todos = d.todos.filter(x => x.id !== id); }); },
    // reorder the to-do backlog to match orderedIds
    // reorder only the todos in orderedIds, leaving any not listed (e.g. filtered
    // out by category) at their current position
    reorderTodos(orderedIds) {
      mutate(d => {
        const arr = d.todos || [];
        const idSet = new Set(orderedIds);
        const byId = new Map(arr.map(t => [t.id, t]));
        const queue = orderedIds.map(id => byId.get(id)).filter(Boolean);
        let qi = 0;
        d.todos = arr.map(t => (idSet.has(t.id) ? queue[qi++] : t));
      });
    },

    // groups
    addGroup(g) { mutate(d => { d.groups.unshift({ ...g, id: uid(), createdAt: Date.now() }); }); },
    updateGroup(id, g) { mutate(d => { const i = d.groups.findIndex(x => x.id === id); if (i >= 0) d.groups[i] = { ...d.groups[i], ...g }; }); },
    deleteGroup(id) { mutate(d => { d.groups = d.groups.filter(x => x.id !== id); }); },

    // categories
    addCategory(c) { mutate(d => { d.categories.push({ id: uid(), name: c.name, color: c.color }); }); },
    updateCategory(id, patch) { mutate(d => { const i = d.categories.findIndex(c => c.id === id); if (i >= 0) d.categories[i] = { ...d.categories[i], ...patch }; }); },
    moveCategory(id, dir) {
      mutate(d => {
        const i = d.categories.findIndex(c => c.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.categories.length) return;
        const a = d.categories;
        [a[i], a[j]] = [a[j], a[i]];
      });
    },
    // delete a category, reassigning any tasks that referenced it to `fallbackId`
    deleteCategory(id, fallbackId) {
      mutate(d => {
        if (d.categories.length <= 1) return;
        const fb = fallbackId || (d.categories.find(c => c.id !== id) || {}).id;
        Object.values(d.days).forEach(arr => arr.forEach(t => { if (t.category === id) t.category = fb; }));
        d.groups.forEach(g => {
          if (g.category === id) g.category = fb;
          g.tasks.forEach(t => { if (t.category === id) t.category = fb; });
        });
        // to-dos may be uncategorised, so drop the reference instead of reassigning —
        // otherwise they'd keep a dead id and match no filter at all
        (d.todos || []).forEach(t => { if (t.category === id) t.category = null; });
        d.categories = d.categories.filter(c => c.id !== id);
      });
    },
  }), [data, mutate]);

  return { data, actions, syncStatus, syncEnabled: SYNC_ENABLED, refresh: pull };
}

// usage count for a category across all stored days
// how much a category is referenced: day tasks, group tasks and to-dos
function categoryUsage(data, id) {
  let n = 0;
  Object.values(data.days || {}).forEach(arr => arr.forEach(t => { if (t.category === id) n++; }));
  (data.groups || []).forEach(g => (g.tasks || []).forEach(t => { if (t.category === id) n++; }));
  (data.todos || []).forEach(t => { if (t.category === id) n++; });
  return n;
}
function getCat(data, id) {
  return (data.categories || []).find(c => c.id === id) || { id, name: 'Uncategorized', color: '#aaaaaa' };
}
function defaultCategoryId(data) {
  const cats = data.categories || [];
  return (cats.find(c => c.id === 'personal') || cats[0] || { id: 'work' }).id;
}

Object.assign(window, {
  StoreContext, useStoreProvider, dateKey, parseKey, addDays, isSameDay,
  WD_SHORT, MON_SHORT, MON_LONG, makeTask, uid, dueInfo,
  categoryUsage, getCat, defaultCategoryId, fmtTime, fmtRange,
});
