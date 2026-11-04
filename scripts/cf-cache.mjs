// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Uploads the prerendered page cache from `opennextjs-cloudflare build` to the R2 cache bucket through the
// Cloudflare API, and makes sure the D1 tag table exists. Same keys as `opennextjs-cloudflare populateCache`,
// without the temporary remote worker that command starts (it can hang on new accounts).
//   node scripts/cf-cache.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(ROOT, ".open-next", "cache");
const bucket = process.env.R2_CACHE_BUCKET || "dyllu-cache";
const prefix = process.env.NEXT_INC_CACHE_R2_PREFIX || "incremental-cache";
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
if (!token || !account) throw new Error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required");
const api = `${process.env.CLOUDFLARE_API_BASE_URL || "https://api.cloudflare.com/client/v4"}/accounts/${account}`;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = fs.existsSync(dir) ? walk(dir) : [];
const entries = files.map((full) => {
  const rel = path.relative(dir, full).split(path.sep).join("/");
  let buildId, keyParts, type;
  if (rel.startsWith("__fetch/")) [, buildId, ...keyParts] = rel.split("/"), (type = "fetch");
  else {
    if (!rel.endsWith(".cache")) throw new Error(`Unexpected cache file: ${rel}`);
    [buildId, ...keyParts] = rel.slice(0, -".cache".length).split("/");
    type = "cache";
  }
  const hash = crypto.createHash("sha256").update(`/${keyParts.join("/")}`).digest("hex");
  return { full, key: `${prefix}/${buildId}/${hash}.${type}`.replace(/\/+/g, "/") };
});

async function put(e) {
  for (let i = 1; ; i++) {
    const r = await fetch(`${api}/r2/buckets/${bucket}/objects/${e.key.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: fs.readFileSync(e.full),
    }).catch((err) => ({ ok: false, status: 0, text: async () => String(err) }));
    if (r.ok) return;
    if (i >= 8) throw new Error(`PUT ${e.key}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    await new Promise((res) => setTimeout(res, r.status === 429 ? 30000 : 1000 * 2 ** i));
  }
}
const queue = [...entries];
await Promise.all(Array.from({ length: 4 }, async () => { for (let e; (e = queue.shift()); ) await put(e); }));
console.log(`Page cache: ${entries.length} entries uploaded to R2 "${bucket}"`);
