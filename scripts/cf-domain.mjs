// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Points the domain at the Worker as a Workers Custom Domain (Cloudflare creates the DNS record and certificate).
// Runs only when the zone is active on Cloudflare. A/AAAA/CNAME records for the same names (copied from the old host) are removed first.
//   node scripts/cf-domain.mjs dyllusa.com www.dyllusa.com
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const service = process.env.WORKER_NAME || "dyllu-catalog";
const hosts = process.argv.slice(2);
if (!token || !account || !hosts.length) throw new Error("usage: node scripts/cf-domain.mjs <hostname>... (needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)");
const api = "https://api.cloudflare.com/client/v4";
async function call(method, path, body) {
  const r = await fetch(api + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!d.success) throw new Error(`${method} ${path}: ${r.status} ${JSON.stringify(d.errors ?? d).slice(0, 400)}`);
  return d.result;
}
const apex = hosts[0].split(".").slice(-2).join(".");
const zones = await call("GET", `/zones?name=${apex}&account.id=${account}`);
const zone = zones[0];
if (!zone) throw new Error(`${apex} is not added to this Cloudflare account`);
console.log(`Zone ${apex}: ${zone.status}`);
if (zone.status !== "active") {
  console.log("Not active yet: the nameserver change has not been seen by Cloudflare. Nothing was changed. Try again later.");
  process.exit(2);
}
for (const hostname of hosts) {
  // Records copied from the old host (Vercel) for this exact name block the attach: remove them first
  for (const r of await call("GET", `/zones/${zone.id}/dns_records?name=${hostname}`)) {
    if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
    await call("DELETE", `/zones/${zone.id}/dns_records/${r.id}`);
    console.log(`Removed old record ${r.type} ${r.name} -> ${r.content}`);
  }
  const res = await call("PUT", `/accounts/${account}/workers/domains`, {
    hostname,
    service,
    zone_id: zone.id,
    environment: "production",
    override_existing_dns_record: true,
  });
  console.log(`Attached ${res.hostname} -> ${res.service}`);
}
