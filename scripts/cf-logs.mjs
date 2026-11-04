// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Real requests from Workers Logs (observability): which paths failed with 1102 and how much CPU each path uses.
//   node scripts/cf-logs.mjs [hours=12]
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const hours = Number(process.argv[2] || 12);
const to = Date.now(),
  from = to - hours * 3600e3;
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/observability/telemetry/query`;

async function query(extraFilters, limit = 2000) {
  const body = {
    queryId: `dyllu-${Date.now()}`,
    timeframe: { from, to },
    view: "events",
    limit,
    parameters: {
      datasets: ["cloudflare-workers"],
      filters: [{ key: "$metadata.service", operation: "eq", type: "string", value: "dyllu-catalog" }, ...extraFilters],
      filterCombination: "and",
    },
  };
  const r = await fetch(api, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) {
    console.log(`query failed ${r.status}:`, JSON.stringify(d.errors ?? d).slice(0, 600));
    return [];
  }
  return d.result?.events?.events ?? [];
}

const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
function row(e) {
  const w = e.$workers ?? {},
    m = e.$metadata ?? {};
  const url = get(w, "event.request.url") ?? m.url ?? get(e, "source.url") ?? "";
  let path = url;
  try {
    const u = new URL(url);
    path = u.pathname + (u.search ? "?…" : "");
  } catch {}
  return {
    t: new Date(Number(e.timestamp ?? m.startTime ?? 0)).toISOString().slice(11, 19),
    outcome: w.outcome ?? m.outcome ?? "?",
    method: get(w, "event.request.method") ?? "",
    path,
    status: get(w, "event.response.status") ?? "",
    cpu: Number(w.cpuTimeMs ?? 0),
    wall: Number(w.wallTimeMs ?? 0),
    type: w.eventType ?? m.type ?? "",
  };
}

const all = (await query([])).map(row).filter((r) => r.type !== "cron" && r.path);
console.log(`Workers Logs, last ${hours} h: ${all.length} requests read`);
if (process.env.DEBUG_LOGS && all.length === 0) {
  const raw = await query([], 1);
  console.log(JSON.stringify(raw[0] ?? {}, null, 1).slice(0, 3000));
}

const bad = all.filter((r) => r.outcome !== "ok" && r.outcome !== "canceled");
console.log(`\nFailed requests (outcome not ok): ${bad.length}`);
for (const r of bad.slice(0, 80)) console.log(`  ${r.t} ${r.outcome.padEnd(12)} ${r.method.padEnd(6)} cpu ${String(r.cpu).padStart(4)}ms ${r.path}`);

// Group by path pattern (ids and slugs folded)
const norm = (p) =>
  p
    .replace(/\/uploads\/[^/]+/, "/uploads/*")
    .replace(/\/products\/[^/?]+/, "/products/*")
    .replace(/\/categories\/[^/?]+/, "/categories/*")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
const groups = new Map();
for (const r of all) {
  const k = `${r.method} ${norm(r.path)}`;
  const g = groups.get(k) ?? { n: 0, fail: 0, cpu: [] };
  g.n++;
  if (r.outcome !== "ok" && r.outcome !== "canceled") g.fail++;
  g.cpu.push(r.cpu);
  groups.set(k, g);
}
const pct = (a, p) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0;
};
console.log(`\nCPU per path (ms) — requests, failures, p50, p90, max`);
const list = [...groups].sort((a, b) => pct(b[1].cpu, 90) - pct(a[1].cpu, 90));
for (const [k, g] of list.slice(0, 70))
  console.log(
    `  ${String(g.n).padStart(4)} ${String(g.fail).padStart(3)}  p50 ${String(pct(g.cpu, 50)).padStart(4)}  p90 ${String(pct(g.cpu, 90)).padStart(4)}  max ${String(Math.max(...g.cpu)).padStart(4)}  ${k}`,
  );
