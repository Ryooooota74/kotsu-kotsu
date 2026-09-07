#!/usr/bin/env bash
# Pre-deploy smoke test. Rebuilds, then checks the built output and the service
# worker's routing. Run this before pushing.
#
# What it does NOT cover: the live Supabase round-trip, and anything that needs a
# real browser. Sync behaviour (retry, focus re-pull, seed gating) is verified by
# hand against a stub endpoint — see README.
set -euo pipefail
export ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ building"
bash "$ROOT/scripts/build.sh" > /dev/null

echo "→ checking sw.js parses"
node --check "$ROOT/sw.js"

node -e '
  const files = ["bundle", "sw", "suggest"];
  let pass = 0, fail = 0;
  const t = {
    ok(cond, msg) { cond ? (pass++, console.log("  ✓ " + msg))
                         : (fail++, console.log("  ✗ " + msg)); },
    eq(a, b, msg) { this.ok(a === b, msg + (a === b ? "" : "  (got " + JSON.stringify(a) + ")")); },
  };
  (async () => {
    for (const f of files) {
      console.log("→ " + f);
      await require(process.env.ROOT + "/scripts/tests/" + f + ".test.js")(t);
    }
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  })();
' 
