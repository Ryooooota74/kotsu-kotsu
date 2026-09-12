// Guards against regressions that have actually shipped before: the dev build of
// React going out, in-browser Babel coming back, dead modules creeping into the
// bundle, and sync/offline wiring silently dropping out of the build.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

module.exports = async function run(t) {
  t.ok(html.includes('react.production.min.js'), 'ships production React');
  t.ok(!html.includes('babel'), 'no in-browser Babel');
  t.ok(!html.includes('text/babel'), 'JSX is precompiled, not transpiled in the browser');
  t.ok(!/IOSKeyboard|IOSGlassPill/.test(html), 'no dead ios-frame code in the bundle');

  t.ok(/__BUILD='\d+'/.test(html), 'carries a build id for the auto-updater');
  const build = /__BUILD='(\d+)'/.exec(html)[1];
  t.ok(sw.includes("kotsu-" + build), 'sw.js cache name matches this build');
  t.ok(html.includes('serviceWorker.register'), 'registers the service worker');

  t.ok(html.includes('push failed, will retry'), 'failed pushes are retried');
  t.ok(html.includes('visibilitychange'), 're-pulls when the app regains focus');
  t.ok(html.includes('LOADED_FROM_DISK'), 'seeded devices are gated from pushing');
  t.ok(html.includes('Save backup') && html.includes('Restore backup'), 'backup menu is wired');
  t.ok(html.includes('getDerivedStateFromError'), 'has a crash boundary');
  t.ok(html.includes('Often added') && html.includes('suggestTasks'), 'quick-add suggestions are wired');

  // every window-level drag must end on pointercancel, or the list keeps
  // following the pointer after the OS takes the gesture away
  const adds = (html.match(/addEventListener\('pointerup'/g) || []).length;
  const cancels = (html.match(/addEventListener\('pointercancel'/g) || []).length;
  t.eq(cancels, adds, 'every pointerup drag also listens for pointercancel');
  t.eq((html.match(/removeEventListener\('pointercancel'/g) || []).length, adds,
       'every pointercancel listener is removed again');

  t.ok(html.includes('knownToday'), 'the app watches for the date rolling over');

  // a stray pixel must not be mistaken for a drag, or tap-to-edit is swallowed
  t.ok(/newStart === d\.start \? d :/.test(html), 'timeline drags ignore sub-snap movement');
  t.ok(html.includes('setNowTick'), 'the now-line ticks instead of freezing');
  t.ok(html.includes('useDismissable'), 'overlays close on Escape and the back button');
  // one shared history entry for the whole stack: per-sheet entries broke the
  // action-sheet -> edit-sheet hand-off (the closing sheet popped the new one)
  t.ok(html.includes('armOverlayHistory') && html.includes('historyArmed'),
       'overlays share a single history entry');
  t.eq((html.match(/pushState/g) || []).length, 1, 'only one place pushes a history entry');

  t.ok(html.includes('Move to previous day') && html.includes('Move to next day'),
       'tasks can move either way between days');
  t.ok(html.includes('Move group to previous day') && html.includes('Move group to next day'),
       'group blocks can move either way between days');
  t.ok(html.includes('useDraftField'), 'text fields hold a draft instead of writing per keystroke');
  // the only surviving mention should be the migration that strips the old field
  t.eq((html.match(/isExpanded/g) || []).length, 1,
       'card expansion is device-local; isExpanded only remains as the strip-on-load');
  t.ok(html.includes('Already on this day'), 'an already-applied group says so');
  t.ok(html.includes('lastPushedJson'), 'unchanged payloads are not re-uploaded');
  t.ok(/<h1|createElement\("h1"/.test(html), 'the page has real headings');

  const sync = /window\.KOTSU_SYNC = \{[\s\S]*?\}/.exec(html)[0];
  t.ok(/url:\s*"https:\/\//.test(sync), 'sync URL is filled in');
  t.ok(!/anonKey:\s*""/.test(sync), 'sync key is filled in');

  t.ok(fs.statSync(path.join(ROOT, 'index.html')).size < 400 * 1024,
       'bundle stays under 400KB (' + Math.round(html.length / 1024) + 'KB)');
};
