// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Summarise `wrangler tail --format json` output: CPU and wall time for each request, in order.
//   node scripts/cf-profile.mjs tail.jsonl
import fs from "node:fs";
// wrangler prints one pretty-printed JSON object per event: split them by brace depth
function objects(text) {
  const out = [];
  let depth = 0, start = -1, str = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (str) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') str = false;
      continue;
    }
    if (c === '"') str = true;
    else if (c === "{") (depth++ === 0) && (start = i);
    else if (c === "}" && --depth === 0) {
      try {
        out.push(JSON.parse(text.slice(start, i + 1)));
      } catch {}
    }
  }
  return out;
}
let n = 0;
for (const e of objects(fs.readFileSync(process.argv[2], "utf8"))) {
  const url = e.event?.request?.url ?? e.event?.cron ?? "?";
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const ex = (e.exceptions ?? []).map((x) => x.message).join("; ");
  const logs = (e.logs ?? []).map((x) => (x.message ?? []).join(" ")).join(" | ").slice(0, 140);
  console.log(
    `${String(++n).padStart(3)} ${String(e.outcome).padEnd(18)} cpu ${String(e.cpuTime ?? "?").padStart(5)}ms wall ${String(e.wallTime ?? "?").padStart(6)}ms ${path.slice(0, 70)}${ex ? "  EXC " + ex.slice(0, 120) : ""}${logs ? "  LOG " + logs : ""}`,
  );
}
