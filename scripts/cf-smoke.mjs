// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Read-only check of a deployed site: main pages, product and category pages, images, health and search.
// Nothing is written. Usage: node scripts/cf-smoke.mjs https://<site>
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!base) throw new Error("usage: node scripts/cf-smoke.mjs <base-url>");
let fails = 0;
const bad = /Application error|Internal Server Error|تعذر تحميل الصفحة/;
async function get(path, { image = false } = {}) {
  const t = Date.now();
  const r = await fetch(base + path, { redirect: "manual", headers: { "user-agent": "dyllu-smoke" } }).catch((e) => ({ status: 0, err: e }));
  const ms = Date.now() - t;
  let ok = r.status >= 200 && r.status < 400, note = "", body = "";
  if (r.status && !image) {
    body = await r.text();
    if (r.status >= 500) note = `${r.headers?.get?.("cf-ray") || ""} ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 220)}`;
    if (bad.test(body)) (ok = false), (note = "error text in page");
  } else if (r.status) {
    const buf = Buffer.from(await r.arrayBuffer());
    const type = r.headers.get("content-type") || "";
    if (!type.startsWith("image/") && !type.includes("pdf")) (ok = false), (note = `type ${type}`);
    if (!buf.length) (ok = false), (note = "empty");
    note ||= `${type}, ${buf.length} bytes`;
  }
  if (!ok) fails++;
  console.log(`${ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(3)} ${String(ms).padStart(5)}ms ${path}${note ? "  (" + note + ")" : ""}`);
  return body;
}
const home = await get("/");
const links = (re) => [...new Set([...home.matchAll(re)].map((m) => m[1]))];
for (const p of ["/products", "/categories", "/cart", "/catalog", "/admin-login", "/rep-login", "/trade", "/api/health", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"])
  await get(p);
const listing = await get("/products");
const all = home + listing;
const products = [...new Set([...all.matchAll(/href="(\/products\/[^"?#]+)"/g)].map((m) => m[1]))].slice(0, 6);
const cats = [...new Set([...all.matchAll(/href="(\/categories\/[^"?#]+)"/g)].map((m) => m[1]))].slice(0, 3);
const imgs = [...new Set([...all.matchAll(/(\/uploads\/[A-Za-z0-9._-]+)/g)].map((m) => m[1]))].slice(0, 8);
if (!products.length) (fails++, console.log("FAIL no product links found on home/listing"));
if (!imgs.length) (fails++, console.log("FAIL no uploaded images found on home/listing"));
for (const p of [...products, ...cats]) await get(p);
for (const i of imgs) await get(i, { image: true });
await get("/api/search?q=a");
// Second pass: warm timings
console.log("\nWarm timings:");
for (const p of ["/", "/products", products[0], "/api/health"].filter(Boolean)) await get(p);
console.log(fails ? `\n${fails} check(s) failed` : "\nAll checks passed");
process.exitCode = fails ? 1 : 0;
