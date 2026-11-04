// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Service worker: shows notifications sent from the admin panel, even when the app is closed,
// and opens the right page when one is tapped. It does not cache pages (the site always loads fresh).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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
