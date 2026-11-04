// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Copies the PostgreSQL (Neon) database into Cloudflare D1 + R2. The source is only read (SELECT), never changed.
//
//   node scripts/migrate-to-d1.mjs export  <postgres-url> <out-dir>
//       Writes <out-dir>/data.sql (all rows, original ids kept), <out-dir>/files/* (uploaded images/PDFs)
//       and <out-dir>/manifest.json (row counts + a fingerprint of every table).
//   node scripts/migrate-to-d1.mjs files   <out-dir> <--local | --remote>
//       Uploads <out-dir>/files to the R2 bucket (same names), then downloads each one back and compares its sha256.
//   node scripts/migrate-to-d1.mjs verify  <out-dir> <d1-sqlite-file | --local | --remote>
//       Recomputes counts + fingerprints from D1 and compares them with the manifest.
//
// The D1 schema (migrations/0001_init.sql) must be applied before data.sql.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCHEMA = fs.readFileSync(path.join(ROOT, "migrations/0001_init.sql"), "utf8");

// Table -> [column, sqlite type] from the D1 schema, in creation order (parents before children)
function d1Tables() {
  const out = [];
  for (const m of SCHEMA.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)) {
    const cols = [];
    for (const line of m[2].split("\n")) {
      const c = line.trim().match(/^"([^"]+)"\s+([A-Z]+)/);
      if (c) cols.push([c[1], c[2]]);
    }
    out.push({ name: m[1], cols });
  }
  return out;
}
// Children reference parents, so insert in an order that satisfies foreign keys
const ORDER = [
  "AdminUser",
  "Setting",
  "Category",
  "Product",
  "ProductImage",
  "ProductSpec",
  "ProductFeature",
  "ProductDocument",
  "_ProductExtraCategories",
  "_ProductAlternatives",
  "Rep",
  "RepAccount",
  "Store",
  "WholesaleCode",
  "Customer",
  "Order",
  "OrderItem",
  "TradeScan",
  "Banner",
  "Offer",
  "ImportLog",
  "ImportChange",
];
const SKIP = new Set(["Upload"]); // file bytes go to R2, not to D1

const isoDate = (v) => (v == null ? null : new Date(v).toISOString().replace("Z", "+00:00"));
// Values in the exact form Prisma writes to D1: dates as ISO text, decimals as numbers, booleans 0/1, JSON as text
function toD1(v, type) {
  if (v == null) return null;
  if (type === "DATETIME") return isoDate(v);
  if (type === "BOOLEAN") return v ? 1 : 0;
  if (type === "DECIMAL" || type === "REAL") return Number(v);
  if (type === "JSONB" || type === "JSON") return JSON.stringify(v);
  if (type === "BLOB") return Buffer.from(v);
  if (type === "INTEGER") return typeof v === "bigint" ? Number(v) : Number(v);
  return String(v);
}
const lit = (v) =>
  v == null
    ? "NULL"
    : typeof v === "number"
      ? Number.isFinite(v)
        ? String(v)
        : "NULL"
      : Buffer.isBuffer(v)
        ? `X'${v.toString("hex")}'`
        : `'${String(v).replace(/'/g, "''")}'`;
// Fingerprint of a table independent of the database: rows sorted by key, values normalized to text
function fingerprint(rows, cols) {
  const h = crypto.createHash("sha256");
  const norm = (v, t) => {
    if (v == null) return "∅";
    if (t === "DATETIME") return new Date(typeof v === "string" ? v.replace(" ", "T") : v).toISOString();
    if (t === "BOOLEAN") return v === true || v === 1 || v === "1" ? "1" : "0";
    if (t === "DECIMAL" || t === "REAL") return String(Number(v));
    if (t === "JSONB" || t === "JSON") return JSON.stringify(typeof v === "string" ? JSON.parse(v) : v);
    if (t === "BLOB") return crypto.createHash("sha256").update(Buffer.from(v)).digest("hex");
    return String(v);
  };
  const lines = rows.map((r) => cols.map(([c, t]) => norm(r[c], t)).join("\u0001"));
  lines.sort();
  for (const l of lines) h.update(l + "\n");
  return h.digest("hex");
}

async function exportData(url, outDir) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: url,
    ssl: /sslmode=require|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"); // one consistent, read-only snapshot
  fs.mkdirSync(path.join(outDir, "files"), { recursive: true });
  const tables = new Map(d1Tables().map((t) => [t.name, t]));
  const pgCols = async (t) =>
    new Set(
      (await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [t])).rows.map((r) => r.column_name),
    );
  const sql = fs.createWriteStream(path.join(outDir, "data.sql"));
  sql.write(
    "-- DYLLU data export for Cloudflare D1. Original ids are kept so every relation stays intact.\nPRAGMA defer_foreign_keys = true;\n",
  );
  const manifest = { exportedAt: new Date().toISOString(), tables: {}, files: [] };
  const legacy = [];
  for (const name of ORDER) {
    const t = tables.get(name);
    if (!t || SKIP.has(name)) continue;
    const have = await pgCols(name);
    if (!have.size) {
      manifest.tables[name] = { count: 0, hash: fingerprint([], t.cols), note: "not in source" };
      continue;
    }
    let rows = (await client.query(`SELECT * FROM "${name}"`)).rows;
    // Older imports kept every change inside one JSON value; D1 rows are limited in size, so those move to ImportChange
    if (name === "ImportLog")
      rows = rows.map((r) => {
        const items = Array.isArray(r.changes?.items) ? r.changes.items : [];
        for (const c of items)
          legacy.push({
            logId: r.id,
            productId: c.id ?? null,
            sku: c.sku ?? "",
            op: c.op,
            before: c.before ?? null,
            addedImages: c.addedImages ?? [],
            done: true,
          });
        return {
          ...r,
          status: r.status ?? (r.undoneAt ? "undone" : "done"),
          changes: items.length ? { createdCategories: r.changes.createdCategories ?? [] } : r.changes,
        };
      });
    const cols = t.cols.filter(([c]) => have.has(c) || (name === "ImportLog" && c === "status"));
    for (const r of rows) {
      const vals = cols.map(([c, ty]) => lit(toD1(r[c], ty)));
      sql.write(`INSERT INTO "${name}" (${cols.map(([c]) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});\n`);
    }
    manifest.tables[name] = { count: rows.length, hash: fingerprint(rows, cols), cols: cols.map(([c]) => c) };
    console.log(`  ${name}: ${rows.length}`);
  }
  if (legacy.length) {
    const t = tables.get("ImportChange");
    const cols = t.cols.filter(([c]) => ["logId", "productId", "sku", "op", "before", "addedImages", "done"].includes(c));
    for (const r of legacy)
      sql.write(
        `INSERT INTO "ImportChange" (${cols.map(([c]) => `"${c}"`).join(", ")}) VALUES (${cols.map(([c, ty]) => lit(toD1(r[c], ty))).join(", ")});\n`,
      );
    manifest.tables.ImportChange = { count: legacy.length, hash: fingerprint(legacy, cols), cols: cols.map(([c]) => c) };
    console.log(`  ImportChange (from older imports): ${legacy.length}`);
  }
  // Uploaded files: written out for R2 under the same names, so every "/uploads/<name>" link keeps working
  const up = await client.query(`SELECT name, type, size, data FROM "Upload" ORDER BY id`).catch(() => ({ rows: [] }));
  for (const f of up.rows) {
    const buf = Buffer.from(f.data);
    fs.writeFileSync(path.join(outDir, "files", f.name), buf);
    manifest.files.push({ name: f.name, type: f.type, size: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") });
  }
  await client.query("COMMIT");
  await client.end();
  await new Promise((r) => sql.end(r));
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(
    `Exported ${Object.values(manifest.tables).reduce((n, t) => n + t.count, 0)} rows and ${manifest.files.length} files to ${outDir}`,
  );
}

function readD1(target, query) {
  if (target === "--remote" || target === "--local") {
    const out = execFileSync("npx", ["wrangler", "d1", "execute", process.env.D1_NAME || "dyllu", target, "--json", "--command", query], {
      cwd: ROOT,
      maxBuffer: 1 << 30,
      encoding: "utf8",
    });
    return JSON.parse(out)[0].results;
  }
  const json = execFileSync(
    "python3",
    [
      "-c",
      "import sqlite3,json,sys;c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row;print(json.dumps([{k:(r[k].hex() if isinstance(r[k],bytes) else r[k]) for k in r.keys()} for r in c.execute(sys.argv[2])]))",
      target,
      query,
    ],
    {
      maxBuffer: 1 << 30,
      encoding: "utf8",
    },
  );
  return JSON.parse(json);
}

function verify(outDir, target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const tables = new Map(d1Tables().map((t) => [t.name, t]));
  let bad = 0;
  for (const [name, m] of Object.entries(manifest.tables)) {
    if (!m.cols) continue;
    const cols = tables.get(name).cols.filter(([c]) => m.cols.includes(c));
    const rows = readD1(
      target,
      `SELECT ${cols.map(([c, t]) => (t === "BLOB" ? `hex("${c}") AS "${c}"` : `"${c}"`)).join(", ")} FROM "${name}"`,
    ).map((r) => {
      for (const [c, t] of cols) if (t === "BLOB" && r[c] != null) r[c] = Buffer.from(r[c], "hex");
      return r;
    });
    const hash = fingerprint(rows, cols);
    const ok = rows.length === m.count && hash === m.hash;
    if (!ok) bad++;
    console.log(
      `${ok ? "OK  " : "DIFF"} ${name}: source ${m.count} rows, D1 ${rows.length} rows${ok ? "" : hash === m.hash ? "" : " (content differs)"}`,
    );
  }
  console.log(bad ? `\n${bad} table(s) differ. Do not switch over.` : `\nAll ${Object.keys(manifest.tables).length} tables match exactly.`);
  process.exitCode = bad ? 1 : 0;
}

function uploadFiles(outDir, target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const bucket = process.env.R2_BUCKET || "dyllu-files";
  const tmp = path.join(outDir, ".check");
  let bad = 0;
  for (const f of manifest.files) {
    const src = path.join(outDir, "files", f.name);
    const run = (args) => execFileSync("npx", ["wrangler", "r2", "object", ...args, target], { cwd: ROOT, stdio: "pipe" });
    run(["put", `${bucket}/${f.name}`, "--file", src, "--content-type", f.type, "--cache-control", "public, max-age=31536000, immutable"]);
    run(["get", `${bucket}/${f.name}`, "--file", tmp]);
    const ok = crypto.createHash("sha256").update(fs.readFileSync(tmp)).digest("hex") === f.sha256;
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "DIFF"} ${f.name} (${f.size} bytes)`);
  }
  fs.rmSync(tmp, { force: true });
  console.log(bad ? `\n${bad} file(s) differ. Do not switch over.` : `\nAll ${manifest.files.length} files are in R2 and identical.`);
  process.exitCode = bad ? 1 : 0;
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "export" && a && b) await exportData(a, b);
else if (cmd === "verify" && a && b) verify(a, b);
else if (cmd === "files" && a && b) uploadFiles(a, b);
else
  console.log(
    "usage: export <postgres-url> <out-dir> | files <out-dir> <--local|--remote> | verify <out-dir> <d1-sqlite-file|--local|--remote>",
  );
