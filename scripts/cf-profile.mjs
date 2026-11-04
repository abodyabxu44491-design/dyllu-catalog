// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Summarise `wrangler tail --format json` output: CPU and wall time for each request, in order.
//   node scripts/cf-profile.mjs tail.jsonl
import fs from "node:fs";
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").filter((l) => l.trim().startsWith("{"));
let n = 0;
for (const l of lines) {
  let e;
  try {
    e = JSON.parse(l);
  } catch {
    continue;
  }
  const url = e.event?.request?.url ?? e.event?.cron ?? "?";
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const ex = (e.exceptions ?? []).map((x) => x.message).join("; ");
  const logs = (e.logs ?? []).map((x) => (x.message ?? []).join(" ")).join(" | ").slice(0, 140);
  console.log(
    `${String(++n).padStart(3)} ${String(e.outcome).padEnd(18)} cpu ${String(e.cpuTime ?? "?").padStart(5)}ms wall ${String(e.wallTime ?? "?").padStart(6)}ms ${path.slice(0, 70)}${ex ? "  EXC " + ex.slice(0, 120) : ""}${logs ? "  LOG " + logs : ""}`,
  );
}
