// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Browser side of notifications: ask permission, subscribe through the service worker, keep the server in sync.
"use client";
export type Audience = "store" | "admin" | "rep" | "trade";
const raw = (k: string) => {
  const s = atob(k.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((k.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};
export const standalone = () =>
  typeof window !== "undefined" &&
  (matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
// On iPhone, notifications work only inside the app added to the Home Screen (iOS 16.4+)
export function pushSupport(): "yes" | "install" | "no" {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return isIosSafe() ? "install" : "no";
  if (!("PushManager" in window)) return isIosSafe() ? "install" : "no";
  return "yes";
}
const isIosSafe = () => typeof navigator !== "undefined" && isIos() && !standalone();
async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js"));
}
async function save(sub: PushSubscription, audience: Audience) {
  const j = sub.toJSON();
  const r = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, audience, lang: document.documentElement.lang === "en" ? "en" : "ar" }),
  });
  if (!r.ok) throw new Error("save");
}
export async function enablePush(audience: Audience): Promise<"on" | "denied" | "unavailable" | "error"> {
  try {
    if (pushSupport() !== "yes") return "unavailable";
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return "denied";
    const { key } = await (await fetch("/api/push")).json();
    if (!key) return "unavailable";
    const reg = await registration();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub && sub.options.applicationServerKey) {
      const cur = new Uint8Array(sub.options.applicationServerKey);
      const want = raw(key);
      if (cur.length !== want.length || cur.some((b, i) => b !== want[i])) await sub.unsubscribe().then(() => (sub = null));
    }
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: raw(key) });
    await save(sub, audience);
    localStorage.setItem("dy-push-sync", String(Date.now()));
    return "on";
  } catch {
    return "error";
  }
}
export async function currentEndpoint() {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return (await reg?.pushManager.getSubscription())?.endpoint ?? null;
  } catch {
    return null;
  }
}
// Once a day, re-send an existing subscription (the server forgets devices that stopped answering)
export async function syncPush(audience: Audience) {
  try {
    if (pushSupport() !== "yes" || Notification.permission !== "granted") return;
    if (Date.now() - Number(localStorage.getItem("dy-push-sync") || 0) < 864e5) return;
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await save(sub, audience);
    else await enablePush(audience);
    localStorage.setItem("dy-push-sync", String(Date.now()));
  } catch {}
}
