// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Service worker: shows notifications sent from the admin panel, even when the app is closed,
// and opens the right page when one is tapped. It does not cache pages (the site always loads fresh).
// It also retries a page or data request that Cloudflare answered with a temporary server error
// (for example 503 / error 1102 when the free plan's CPU allowance is briefly used up), so visitors
// see the page after a short wait instead of an error screen.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      try {
        if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      } catch {}
      await self.clients.claim();
    })(),
  ),
);

const WAITS = [600, 1500, 3000, 5000]; // pauses before each new attempt (ms)
const TEMPORARY = new Set([500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);
// Only requests that change nothing are repeated, plus sign-in (repeating it only signs in again)
const SAFE_POST = /^\/api\/(admin|rep)\/login$/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.method !== "GET" && !(req.method === "POST" && SAFE_POST.test(url.pathname))) return;
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;
  if (req.headers.has("range")) return;
  // Static files and images never run server code
  if (/^\/(_next\/static|uploads|brand|fonts)\//.test(url.pathname) || url.pathname === "/sw.js") return;
  e.respondWith(withRetry(e, req));
});

async function withRetry(e, req) {
  const nav = req.mode === "navigate";
  const copies = req.method === "GET" ? null : WAITS.map(() => req.clone());
  let last = null;
  for (let i = 0; i <= WAITS.length; i++) {
    try {
      let res = null;
      if (i === 0 && nav && e.preloadResponse) res = await e.preloadResponse.catch(() => null);
      if (!res) res = await fetch(copies ? (i < copies.length ? copies[i] : req) : req);
      if (!TEMPORARY.has(res.status)) return res;
      last = res;
    } catch (err) {
      last = null; // network failure: try again too
    }
    if (i < WAITS.length) await sleep(WAITS[i]);
  }
  if (nav) return busyPage(req.url);
  return last || Response.error();
}

// Shown only if the server is still busy after every attempt; it keeps retrying by itself
function busyPage(url) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>DYLLU</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;background:#f4f5f2;color:#111}main{text-align:center;padding:24px;max-width:340px}
.s{width:42px;height:42px;margin:0 auto 18px;border-radius:50%;border:4px solid #d9e8a8;border-top-color:#111;animation:r 0.9s linear infinite}@keyframes r{to{transform:rotate(360deg)}}
h1{font-size:19px;margin:0 0 8px}p{margin:0 0 18px;color:#555;font-size:14px;line-height:1.7}button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:11px 26px;background:#c6f432;color:#111}</style></head>
<body><main><div class="s"></div><h1>لحظات ويفتح…</h1><p>الضغط على الموقع عالي الحين، نعيد المحاولة تلقائيًا.<br><span dir="ltr">Just a moment, retrying automatically…</span></p><button onclick="location.reload()">أعد المحاولة</button></main>
<script>setTimeout(function(){location.replace(${JSON.stringify(url)})},4000)</script></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "4" } });
}

self.addEventListener("push", (e) => {
  let m = {};
  try {
    m = e.data ? e.data.json() : {};
  } catch {
    m = { title: "DYLLU", body: e.data ? e.data.text() : "" };
  }
  const title = m.title || "DYLLU";
  e.waitUntil(
    self.registration.showNotification(title, {
      body: m.body || "",
      icon: "/brand/icon-192.png",
      badge: "/brand/badge-96.png",
      image: m.image || undefined,
      dir: "auto",
      lang: "ar",
      tag: m.tag || undefined,
      renotify: !!m.tag,
      data: { url: m.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          await w.focus();
          if ("navigate" in w) return w.navigate(target);
          return;
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});

// The browser rotated the subscription: register the new one so the device keeps receiving notifications
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    (async () => {
      const r = await fetch("/api/push");
      const { key } = await r.json();
      if (!key) return;
      const pad = "=".repeat((4 - (key.length % 4)) % 4);
      const raw = Uint8Array.from(atob((key + pad).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: raw });
      const j = sub.toJSON();
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
      });
    })(),
  );
});
