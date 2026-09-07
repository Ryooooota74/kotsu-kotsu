// Exercises sw.js's routing decisions with a stubbed cache + network.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

const listeners = {}, store = new Map(), deleted = [];
let netMode = 'online', skipped = false, claimed = false;

const fakeCache = {
  addAll: async (u) => u.forEach((k) => store.set(k, 'shell:' + k)),
  put: async (k, v) => store.set(typeof k === 'string' ? k : k.url, v),
};
const caches = {
  open: async () => fakeCache,
  keys: async () => ['kotsu-OLD', /kotsu-(\d+)/.exec(src)[0]],
  delete: async (k) => { deleted.push(k); return true; },
  match: async (r) => store.get(typeof r === 'string' ? r : r.url),
};
const self = {
  addEventListener: (t, f) => { listeners[t] = f; },
  skipWaiting: async () => { skipped = true; },
  clients: { claim: async () => { claimed = true; } },
};
const fetchFn = async (req) => {
  if (netMode === 'offline') throw new Error('offline');
  return { ok: true, type: 'basic', url: req.url, clone: () => 'net:' + req.url };
};
Object.assign(globalThis, { self, caches, fetch: fetchFn, URL });
vm.runInThisContext(src);

async function route(url, mode) {
  let out = null;
  listeners.fetch({ request: { method: 'GET', url, mode: mode || 'no-cors' },
                    respondWith: (p) => { out = p; }, waitUntil: (p) => p });
  return out === null ? 'PASS-THROUGH' : await out;
}

module.exports = async function run(t) {
  await listeners.install({ waitUntil: (p) => p });
  await new Promise((r) => setImmediate(r));
  t.ok(store.has('./index.html'), 'install caches the app shell');

  await listeners.activate({ waitUntil: (p) => p });
  await new Promise((r) => setImmediate(r));
  t.ok(deleted.includes('kotsu-OLD'), 'activate deletes the previous build cache');
  t.ok(skipped && claimed, 'activate takes over open clients');

  t.eq(await route('https://x.supabase.co/rest/v1/app_state'), 'PASS-THROUGH',
       'Supabase is never served from cache');
  t.eq(await route('https://x/index.html?_=1'), 'PASS-THROUGH',
       'the auto-updater cache-buster is not cached');

  await route('https://x/', 'navigate');
  t.ok(store.has('./index.html'), 'a navigation refreshes the cached HTML');

  store.set('https://x/icon.png', 'cached-icon');
  t.eq(await route('https://x/icon.png'), 'cached-icon', 'static assets are served cache-first');

  netMode = 'offline';
  t.ok(await route('https://x/', 'navigate'), 'offline navigation falls back to the cache');
  store.set('https://x/icon.png', 'cached-icon');   // the online pass revalidated it
  t.eq(await route('https://x/icon.png'), 'cached-icon', 'offline static assets come from the cache');
  t.eq(await route('https://x/never-fetched.png'), undefined,
       'an asset that was never cached simply fails offline');
};
