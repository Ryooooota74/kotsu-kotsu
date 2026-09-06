#!/usr/bin/env bash
# Builds the standalone single-file app(s) from the modules in project/*.jsx.
# Output: index.html (clean URL for GitHub Pages) and "Task Manager.html".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/project"
TMP="$(mktemp)"

cat > "$TMP" <<'HTMLHEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
<title>Kotsu-Kotsu — Daily Task Manager</title>
<link rel="icon" type="image/png" href="icon-192.png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="manifest.webmanifest" />
<meta name="theme-color" content="#ffffff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Kotsu-Kotsu" />
<script>window.__BUILD='KOTSU_BUILD_PLACEHOLDER';</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg: #ffffff;
    --bg2: #f7f7f7;
    --bg3: #f0f0f0;
    --text: #111111;
    --text2: #6b6b6b;
    --muted: #aaaaaa;
    --border: #e5e5e5;
    --border2: #d0d0d0;
    --accent: #1f6feb;
    --accent-soft: #e9f1fe;
    --on-accent: #ffffff;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #ededf0;
    font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'tnum' 1, 'cv11' 1;
  }
  #root { min-height: 100vh; }

  /* inputs */
  .inp {
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--bg2);
    color: var(--text);
    outline: none;
    font-family: inherit;
    transition: border-color .14s, background .14s, box-shadow .14s;
  }
  .inp::placeholder { color: var(--muted); }
  .inp:focus {
    border-color: var(--accent);
    background: var(--bg);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  /* dashed add button */
  .dashed-add {
    width: 100%;
    border: 1.5px dashed var(--border2);
    border-radius: 8px;
    background: transparent;
    color: var(--text2);
    font-family: inherit; font-weight: 600; font-size: 12.5px;
    padding: 10px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    transition: border-color .14s, color .14s, background .14s;
  }
  .dashed-add:hover { border-color: var(--accent); color: var(--accent); }

  /* hover-reveal controls */
  .box-ctrl { opacity: 0; transition: opacity .14s; }
  .task-card:hover .box-ctrl { opacity: 1; }
  .del-btn { opacity: 0; transition: opacity .14s, background .14s, color .14s; }
  .task-card:hover .del-btn { opacity: 1; }
  /* touch devices never hover, so these would stay invisible — always show them */
  @media (hover: none) {
    .box-ctrl, .del-btn { opacity: 1; }
  }

  /* app-like UI: disable text selection / long-press callout everywhere except
     real form fields, so long-press opens our menus instead of selecting text (iOS) */
  body {
    -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;
    -webkit-touch-callout: none;
  }
  input, textarea, [contenteditable="true"] {
    -webkit-user-select: text; user-select: text; -webkit-touch-callout: default;
  }

  /* on phones, keep form fields >= 16px so iOS Safari doesn't auto-zoom (and
     shift/cut off the sheet) when an input is focused */
  @media (max-width: 767px) {
    input, textarea, select { font-size: 16px !important; }
  }

  /* icon button hover */
  .iconbtn:hover { background: var(--bg3); color: var(--text); }
  .iconbtn-danger:hover { background: #fdecec; color: #e5484d; }

  /* button hover */
  .btn-primary:hover { filter: brightness(0.94); }
  .btn-outline:hover { background: var(--bg2); }
  .btn-ghost:hover { background: var(--bg3); color: var(--text); }
  .btn-accentGhost:hover { filter: brightness(0.97); }

  /* hide scrollbars inside the phone */
  .scrollarea::-webkit-scrollbar { width: 0; height: 0; }
  .scrollarea { scrollbar-width: none; }

  /* desktop (iPad / laptop) chrome */
  .dt-navitem:hover { background: var(--bg3) !important; color: var(--text) !important; }
  .dt-catrow:hover { background: var(--bg3) !important; }
  .dt-scroll { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
  .dt-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
  .dt-scroll::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 999px; border: 3px solid var(--bg); }
  .dt-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  .dt-scroll::-webkit-scrollbar-track { background: transparent; }
  .dt-mini-month > div { padding: 0 !important; }

  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  textarea.inp { line-height: 1.45; }
</style>
</head>
<body>
  <div id="root"></div>

  <!-- ───────────────────────────────────────────────────────────────
       CLOUD SYNC CONFIG  (fill these two in to sync across devices)
       Get them from: Supabase dashboard → Project Settings → API
       Leave them blank to run local-only (data stays on this device).
       ─────────────────────────────────────────────────────────────── -->
  <script>
    window.KOTSU_SYNC = {
      url: "https://qgigeglnultxvtxjhvhw.supabase.co",
      anonKey: "sb_publishable_QpOCMkO9ARPfWbeu2_lNvQ_2rH2BwtN",
      table: "app_state",
      rowId: "main"
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1" crossorigin="anonymous"></script>

  <script>
HTMLHEAD

FILES="store.jsx icons.jsx components.jsx header.jsx categories.jsx tasks.jsx daytimeline.jsx calendar.jsx addtask.jsx projects.jsx groups.jsx desktop.jsx ios-frame.jsx tweaks-panel.jsx app.jsx"

# The JSX is compiled here at build time rather than by Babel in the browser:
# it drops a ~640KB download and the per-load transpile cost on every device.
if [ ! -d "$ROOT/node_modules/@babel/core" ]; then
  echo "Installing build dependencies (first run only)…"
  (cd "$ROOT" && npm install --silent) || {
    echo "ERROR: npm install failed — needed to compile the JSX." >&2; exit 1; }
fi

JSXTMP="$(mktemp -t kotsu-jsx)"
for f in $FILES; do
  printf '\n// ===================== %s =====================\n' "$f" >> "$JSXTMP"
  cat "$SRC/$f" >> "$JSXTMP"
done

ROOT="$ROOT" JSXTMP="$JSXTMP" node -e '
  const babel = require(process.env.ROOT + "/node_modules/@babel/core");
  const fs = require("fs");
  const src = fs.readFileSync(process.env.JSXTMP, "utf8");
  const out = babel.transformSync(src, {
    presets: [[require(process.env.ROOT + "/node_modules/@babel/preset-react"), { runtime: "classic" }]],
    compact: false, comments: false, babelrc: false, configFile: false,
  });
  process.stdout.write(out.code);
' >> "$TMP" || { echo "ERROR: JSX compilation failed." >&2; rm -f "$JSXTMP"; exit 1; }
rm -f "$JSXTMP"

cat >> "$TMP" <<'HTMLFOOT'
  </script>

  <script>
    /* Auto-update: GitHub Pages caches the HTML for ~10 min, so phones (and the
       home-screen app) can show a stale build. Shortly after load, fetch the live
       page uncached; if the build id changed, reload to pick it up. Guarded so it
       can only reload once per new build per session (no loops). */
    (function () {
      var BUILD = window.__BUILD;
      if (!BUILD || /[^0-9]/.test(BUILD) || location.protocol === 'file:') return;
      setTimeout(function () {
        fetch(location.pathname + '?_=' + Date.now(), { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.text() : null; })
          .then(function (html) {
            if (!html) return;
            var m = html.match(/__BUILD='(\d+)'/);
            if (m && m[1] !== BUILD && sessionStorage.getItem('kotsuUpd') !== m[1]) {
              sessionStorage.setItem('kotsuUpd', m[1]);
              location.reload();
            }
          })['catch'](function () {});
      }, 1500);
    })();
  </script>

  <script>
    /* Native spell-check / autocorrect on text fields (no API). Covers inputs that
       React mounts later, and skips non-text inputs like the color picker. */
    (function () {
      var SKIP = ['checkbox','radio','color','range','file','date','time','number','hidden'];
      function enhance(el) {
        if (!el || el.nodeType !== 1 || el.dataset.scEnhanced) return;
        var tag = el.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
        var t = (el.getAttribute('type') || 'text').toLowerCase();
        if (tag === 'INPUT' && SKIP.indexOf(t) !== -1) return;
        el.dataset.scEnhanced = '1';
        el.setAttribute('spellcheck', 'true');
        el.setAttribute('autocorrect', 'on');
        el.setAttribute('autocapitalize', 'sentences');
      }
      function scan(root) {
        if (root && root.querySelectorAll) root.querySelectorAll('input, textarea').forEach(enhance);
      }
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1) continue;
            enhance(n); scan(n);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener('focusin', function (e) { enhance(e.target); });
      scan(document);
    })();
  </script>
</body>
</html>
HTMLFOOT

# stamp a build id so deployed clients can detect a new version and self-update
sed -i '' "s/KOTSU_BUILD_PLACEHOLDER/$(date +%s)/g" "$TMP"

cp "$TMP" "$ROOT/index.html"
cp "$TMP" "$ROOT/Task Manager.html"
rm -f "$TMP"
echo "Built: index.html and 'Task Manager.html' ($(wc -l < "$ROOT/index.html") lines each)"
