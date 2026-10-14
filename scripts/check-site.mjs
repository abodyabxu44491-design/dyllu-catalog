// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Full site check: every page on many phones, tablets and desktops, in Arabic and English.
// For each page it checks: HTTP status, JS/console errors, horizontal overflow, broken images,
// and that exactly one cart button is visible. Exits with code 1 when anything fails.
//
// Usage (site must be running):
//   npx playwright install chromium        # once
//   CHECK_URL=http://localhost:3000 CHECK_ADMIN_EMAIL=... CHECK_ADMIN_PASSWORD=... node scripts/check-site.mjs
// Optional: CHECK_REP_PHONE, CHECK_REP_PASSWORD (rep portal), CHECK_QUICK=1 (fewer devices),
// CHECK_DEVICES="iPhone SE,iPad" (only these devices), CHECK_REPORT=report.json
import fs from "node:fs";
import { chromium, devices } from "playwright";

const BASE = (process.env.CHECK_URL || "http://localhost:3000").replace(/\/$/, "");
const QUICK = !!process.env.CHECK_QUICK;
const pick = (name) => {
  const { defaultBrowserType, ...d } = devices[name];
  return { name, ...d };
};
const desk = (w, h) => ({
  name: `Desktop ${w}x${h}`,
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
});
const ALL_DEVICES = QUICK
  ? [pick("iPhone SE"), pick("Pixel 7"), pick("iPad Mini"), desk(1440, 900)]
  : [
      {
        name: "Small Android 360x640",
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: devices["Galaxy S8"].userAgent,
      },
      pick("iPhone SE"),
      pick("iPhone 12"),
      pick("iPhone 14 Pro Max"),
      pick("Pixel 5"),
      pick("Pixel 7"),
      pick("Galaxy S9+"),
      pick("iPad Mini"),
      pick("iPad Pro 11"),
      pick("Galaxy Tab S4"),
      pick("iPad Pro 11 landscape"),
      desk(1280, 720),
      desk(1440, 900),
      desk(1920, 1080),
      desk(2560, 1440),
    ];
// CHECK_DEVICES="iPhone SE,Pixel 7" limits the run to devices whose name contains one of these
const only = (process.env.CHECK_DEVICES || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const DEVICES = only.length ? ALL_DEVICES.filter((d) => only.some((o) => d.name.toLowerCase().includes(o))) : ALL_DEVICES;
const ADMIN_DEVICES = DEVICES.filter(
  (d, i) =>
    QUICK || only.length || ["iPhone SE", "Pixel 7", "iPad Mini", "Desktop 1440x900", "Desktop 1920x1080"].includes(d.name) || i === 0,
);

const results = [];
const fail = (r, msg) => {
  r.ok = false;
  r.problems.push(msg);
};

async function discover(ctx) {
  const p = await ctx.newPage();
  await p.goto(BASE + "/products", { waitUntil: "networkidle" });
  const product = await p
    .locator('main a[href^="/products/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  await p.goto(BASE + "/categories", { waitUntil: "networkidle" });
  const category = await p
    .locator('main a[href^="/categories/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  await p.close();
  return { product, category };
}

async function checkPage(ctx, dev, path, { lang = "ar", expect = 200, area = "store" } = {}) {
  const r = { device: dev.name, lang, path, ok: true, problems: [] };
  const p = await ctx.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|favicon/i.test(m.text())) errors.push(m.text());
  });
  try {
    const res = await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
    const status = res?.status() ?? 0;
    if (status !== expect) fail(r, `HTTP ${status} (expected ${expect})`);
    // scroll through the page so lazy images load, then come back
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((s) => setTimeout(s, 60));
      }
      scrollTo(0, 0);
    });
    await p.waitForTimeout(400);
    const info = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return (
            b.width > 0 &&
            b.right > vw + 2 &&
            cs.position !== "fixed" &&
            !el.closest("[data-allow-overflow], .overflow-x-auto, .no-scrollbar, [role=dialog]")
          );
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")}`);
      const broken = [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src"))
        .map((i) => i.getAttribute("src"))
        .slice(0, 3);
      const vis = (el) => {
        const b = el.getBoundingClientRect(),
          cs = getComputedStyle(el);
        return b.width > 0 && b.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0;
      };
      const carts = [...document.querySelectorAll('header a[href="/cart"], nav.fixed a[href="/cart"]')].filter(vis).length;
      return { overflow: document.documentElement.scrollWidth > vw + 1, wide, broken, carts };
    });
    if (info.overflow) fail(r, `horizontal overflow ${info.wide.join(", ")}`);
    if (info.broken.length) fail(r, `broken images ${info.broken.join(", ")}`);
    if (area === "store" && expect === 200 && info.carts !== 1) fail(r, `${info.carts} cart buttons visible (expected 1)`);
    if (errors.length) fail(r, `JS errors: ${errors.slice(0, 2).join(" | ").slice(0, 300)}`);
  } catch (e) {
    fail(r, `load failed: ${e.message.split("\n")[0]}`);
  }
  await p.close();
  results.push(r);
  process.stdout.write(r.ok ? "." : "x");
}

async function login(b) {
  const email = process.env.CHECK_ADMIN_EMAIL,
    password = process.env.CHECK_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const ctx = await b.newContext(),
    res = await ctx.request.post(BASE + "/api/admin/login", { data: { email, password } });
  if (!res.ok()) {
    console.log(`\nadmin login failed (${res.status()}), admin pages skipped`);
    await ctx.close();
    return null;
  }
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}
async function repLogin(b) {
  const phone = process.env.CHECK_REP_PHONE,
    password = process.env.CHECK_REP_PASSWORD;
  if (!phone || !password) return null;
  const ctx = await b.newContext(),
    res = await ctx.request.post(BASE + "/api/rep/login", { data: { phone, password } });
  if (!res.ok()) {
    console.log(`\nrep login failed (${res.status()}), rep pages skipped`);
    await ctx.close();
    return null;
  }
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

const b = await chromium.launch();
const probe = await b.newContext();
const { product, category } = await discover(probe);
await probe.close();
const adminState = await login(b),
  repState = await repLogin(b);
let adminProduct = null;
if (adminState) {
  const c = await b.newContext({ storageState: adminState }),
    p = await c.newPage();
  await p.goto(BASE + "/admin/products", { waitUntil: "networkidle" });
  adminProduct = await p
    .locator('main a[href^="/admin/products/"]:not([href$="/new"]):not([href$="/import"])')
    .first()
    .getAttribute("href")
    .catch(() => null);
  await c.close();
}

const STORE = ["/", "/categories", category, "/products", "/products?sale=1", "/products?q=a", product, "/cart"].filter(Boolean);
const ADMIN = [
  "/admin",
  "/admin/products",
  "/admin/products/new",
  adminProduct,
  "/admin/products/import",
  "/admin/categories",
  "/admin/offers",
  "/admin/banners",
  "/admin/orders",
  "/admin/customers",
  "/admin/reps",
  "/admin/qr",
  "/admin/codes",
  "/admin/trade",
  "/admin/reports",
  "/admin/settings",
].filter(Boolean);
const REP = ["/rep", "/rep/orders", "/rep/customers", "/rep/account"];

console.log(`Checking ${BASE} on ${DEVICES.length} devices${adminState ? " + admin" : ""}${repState ? " + rep" : ""}`);
for (const dev of DEVICES) {
  for (const lang of ["ar", "en"]) {
    const ctx = await b.newContext({ ...dev, locale: lang === "ar" ? "ar-SA" : "en-US" });
    await ctx.addCookies([{ name: "lang", value: lang, url: BASE }]);
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("dy-splash", "1");
      } catch {}
    });
    for (const path of STORE) await checkPage(ctx, dev, path, { lang });
    if (lang === "ar") {
      await checkPage(ctx, dev, "/this-page-does-not-exist", { lang, expect: 404 });
      for (const path of ["/admin-login", "/rep-login", "/catalog", "/trade"]) await checkPage(ctx, dev, path, { lang, area: "page" });
    }
    await ctx.close();
  }
}
if (adminState)
  for (const dev of ADMIN_DEVICES) {
    const ctx = await b.newContext({ ...dev, storageState: adminState });
    for (const path of ADMIN) await checkPage(ctx, dev, path, { area: "admin" });
    await ctx.close();
  }
if (repState)
  for (const dev of ADMIN_DEVICES) {
    const ctx = await b.newContext({ ...dev, storageState: repState });
    for (const path of REP) await checkPage(ctx, dev, path, { area: "rep" });
    await ctx.close();
  }
await b.close();

const bad = results.filter((r) => !r.ok);
console.log(`\n\n${results.length} page checks · ${results.length - bad.length} passed · ${bad.length} failed`);
for (const r of bad) console.log(`✗ [${r.device} · ${r.lang}] ${r.path}\n    ${r.problems.join("\n    ")}`);
if (process.env.CHECK_REPORT)
  fs.writeFileSync(process.env.CHECK_REPORT, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2));
process.exit(bad.length ? 1 : 0);
