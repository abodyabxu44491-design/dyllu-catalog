// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// CPU time per request of the live Worker (Cloudflare Analytics), to check the free-plan 10 ms limit.
//   node scripts/cf-cpu.mjs [hours=6]
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const hours = Number(process.argv[2] || 6);
const since = new Date(Date.now() - hours * 3600e3).toISOString();
const query = `query Q($a: string!, $s: Time!) { viewer { accounts(filter: { accountTag: $a }) {
  byStatus: workersInvocationsAdaptive(limit: 50, filter: { scriptName: "dyllu-catalog", datetime_geq: $s }) {
    dimensions { status }
    sum { requests errors subrequests }
    quantiles { cpuTimeP50 cpuTimeP75 cpuTimeP90 cpuTimeP99 cpuTimeP999 }
    max { cpuTime }
  }
} } }`;
const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { a: account, s: since } }),
});
const d = await r.json();
if (d.errors?.length) console.log("errors:", JSON.stringify(d.errors).slice(0, 500));
const rows = d.data?.viewer?.accounts?.[0]?.byStatus ?? [];
console.log(`Last ${hours} h (CPU in ms; free plan limit 10 ms)`);
for (const x of rows) {
  const q = x.quantiles;
  const ms = (v) => (v / 1000).toFixed(1);
  console.log(
    `${x.dimensions.status.padEnd(18)} requests ${String(x.sum.requests).padStart(6)}  p50 ${ms(q.cpuTimeP50)}  p75 ${ms(q.cpuTimeP75)}  p90 ${ms(q.cpuTimeP90)}  p99 ${ms(q.cpuTimeP99)}  max ${ms(x.max.cpuTime)}`,
  );
}
