# Kotsu-Kotsu — Cross-device sync setup

The app stores all your data as **one JSON row** in a free Supabase database, and
loads/saves it automatically. Use it on iPhone, iPad and laptop and they all share
the same data.

> Sync model: **auto-sync** (writes when you change something, reads on launch),
> **last-write-wins**. No realtime, no password — anyone with the link + key can
> read/write, so keep the URL to yourself. (This matches the options you chose.)

When the two keys below are blank, the app just runs locally on one device — no
errors. Fill them in to turn sync on.

---

## 1. Create the Supabase project (once, ~3 min)

1. Go to <https://supabase.com> → sign up (free) → **New project**.
   Pick any name/password/region. Wait for it to finish provisioning.
2. Open the **SQL Editor** (left sidebar) → **New query** → paste this and **Run**:

   ```sql
   create table if not exists app_state (
     id text primary key,
     data jsonb,
     updated_at timestamptz default now()
   );

   -- IMPORTANT: a request must pass BOTH a table-level GRANT *and* an RLS policy.
   -- Missing this GRANT is what makes the badge stay "Offline" (HTTP 401, code
   -- 42501 "permission denied for table") even when the keys and policies are fine.
   grant select, insert, update on table app_state to anon;

   alter table app_state enable row level security;

   -- single-user, no login: allow the public anon key to read/write this table
   create policy "anon read"   on app_state for select to anon using (true);
   create policy "anon insert" on app_state for insert to anon with check (true);
   create policy "anon update" on app_state for update to anon using (true) with check (true);
   ```

3. Get your keys: **Project Settings → API**. Copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key (the long one labeled `anon` / `public`)

---

## 2. Put the keys into the app

Open `index.html` and edit the config block near the top of `<body>`:

```html
<script>
  window.KOTSU_SYNC = {
    url: "https://abcdefgh.supabase.co",   // ← your Project URL
    anonKey: "eyJhbGci...your anon key...", // ← your anon public key
    table: "app_state",
    rowId: "main"
  };
</script>
```

Save. (The same block exists in `Task Manager.html` if you host that one instead.)
A small **"Synced"** badge appears in the top-left when sync is active.

---

## 3. Host it so every device can open it — GitHub Pages

GitHub Pages serves `index.html` at a public URL for free.

```bash
# from the repo root, after you've created an empty GitHub repo:
git add -A
git commit -m "Kotsu-Kotsu: single-file app + cloud sync"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a
branch" → Branch: `main` / `/ (root)` → Save**. After a minute your app is live at:

```
https://<you>.github.io/<repo>/
```

Open that URL on each device and **Add to Home Screen** (iOS Safari: Share →
Add to Home Screen) to use it like an app. All devices now share one dataset.

> Security note: the `index.html` you push contains your anon key. The repo can be
> **private** — GitHub Pages still works on private repos for personal use. Keeping
> it private is the simplest way to keep the key (and your tasks) to yourself.

---

## Rebuilding after code changes

The HTML files are generated from the modules in `project/*.jsx`:

```bash
bash scripts/build.sh   # regenerates index.html and "Task Manager.html"
```

Your `KOTSU_SYNC` keys live in the build script's head template
(`scripts/build.sh`) — set them there if you want every rebuild to keep them,
or just re-paste them into the generated HTML.

---

## Recommended: let the database stamp `updated_at`

Which device's copy wins is decided by comparing `updated_at`. If each device
writes that column from *its own* clock, a device whose clock is wrong makes its
edits look older than they are — and the other devices then quietly ignore them.

Run this once in the SQL editor so Postgres stamps the column itself:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists app_state_set_updated_at on public.app_state;

create trigger app_state_set_updated_at
  before insert or update on public.app_state
  for each row execute function public.set_updated_at();
```

Every comparison is then server-clock vs server-clock and device clocks stop
mattering.

**This is optional.** The app sends its write without `updated_at`, checks
whether the row actually moved forward, and — if the trigger isn't there — falls
back to sending its own timestamp (logging `[sync] database is not stamping
updated_at` once). Sync keeps working either way; the trigger just removes the
clock-skew failure mode.

---

## Troubleshooting

- **Badge says "Offline" (red):** the URL/key is wrong, or the table/policies/GRANT
  weren't created. Re-check step 1's SQL and step 2's keys. Your data is still
  saved locally and will sync once the connection works.
  - **HTTP 401, code `42501` "permission denied for table app_state":** the RLS
    policies exist but the `anon` role is missing the table-level GRANT. Run:
    `grant select, insert, update on table app_state to anon;` (RLS policies and
    GRANTs are two separate checks — you need both).
- **A device shows old data:** it had newer *local* edits than the cloud, so it
  kept them (last-write-wins by timestamp). Make a tiny change on it to push them
  up, or refresh the other device. If this keeps happening on one device, check
  its clock and install the `updated_at` trigger above.
- **A device never seems to send anything:** if it started with no local data
  (new device, cleared site data, private window) it deliberately refuses to
  push until it has successfully read the cloud at least once — otherwise the
  built-in demo tasks would overwrite your real data. Fix the connection and it
  picks up your data on the next retry.
- **Reset everything:** delete the `app_state` row in Supabase → Table Editor,
  and clear the site data in each browser.
