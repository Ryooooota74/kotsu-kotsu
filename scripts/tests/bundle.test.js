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

  const sync = /window\.KOTSU_SYNC = \{[\s\S]*?\}/.exec(html)[0];
  t.ok(/url:\s*"https:\/\//.test(sync), 'sync URL is filled in');
  t.ok(!/anonKey:\s*""/.test(sync), 'sync key is filled in');

  t.ok(fs.statSync(path.join(ROOT, 'index.html')).size < 400 * 1024,
       'bundle stays under 400KB (' + Math.round(html.length / 1024) + 'KB)');
};
