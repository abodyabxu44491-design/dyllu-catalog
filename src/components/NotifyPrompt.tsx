// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Invites visitors who installed the app (or use a browser that supports it) to turn on offer notifications.
"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { enablePush, pushSupport, standalone, syncPush } from "@/lib/pushClient";
import { toast } from "@/store/toast";
const KEY = "dy-push-ask";
export default function NotifyPrompt({ en = false }: { en?: boolean }) {
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (pushSupport() !== "yes") return;
    if (Notification.permission === "granted") {
      syncPush("store");
      return;
    }
    if (Notification.permission === "denied") return;
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < 14 * 864e5) return;
    // In the installed app ask soon; in a normal browser tab only after the visitor has looked around
    const t = setTimeout(() => setShow(true), standalone() ? 2500 : 20000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const later = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setShow(false);
  };
  async function on() {
    setBusy(true);
    const r = await enablePush("store");
    setBusy(false);
    localStorage.setItem(KEY, String(Date.now()));
    setShow(false);
    if (r === "on") toast(en ? "Notifications are on" : "تم تفعيل الإشعارات، ستصلك العروض أول بأول");
    else if (r === "denied") toast(en ? "Notifications are blocked in your settings" : "الإشعارات مقفلة من إعدادات الجهاز", { tone: "err" });
    else toast(en ? "Could not turn on notifications" : "تعذر تفعيل الإشعارات، حاول لاحقًا", { tone: "err" });
  }
  return (
    <div
      role="dialog"
      aria-label={en ? "Notifications" : "الإشعارات"}
      className="fixed z-40 inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-5 md:inset-x-auto md:end-5 md:w-[380px] rounded-2xl bg-ink text-white shadow-2xl p-4 flex gap-3 items-start animate-[rise_.35s_ease-out]"
    >
      <span className="w-11 h-11 rounded-xl bg-lime text-ink grid place-items-center shrink-0">
        <Icon n="bell" s={22} />
      </span>
      <div className="flex-1 min-w-0">
        <b className="block">{en ? "Get our offers first" : "خلك أول من يعرف بالعروض"}</b>
        <p className="text-sm text-white/75 leading-6">
          {en ? "Turn on notifications for new offers and products." : "فعّل الإشعارات ليصلك كل عرض ومنتج جديد مباشرة على جوالك."}
        </p>
        <div className="flex gap-2 mt-3">
          <button onClick={on} disabled={busy} className="btn btn-md btn-lime flex-1">
            {busy ? "..." : en ? "Turn on" : "تفعيل"}
          </button>
          <button onClick={later} className="btn btn-md flex-1 bg-white/10 text-white hover:bg-white/20">
            {en ? "Later" : "لاحقًا"}
          </button>
        </div>
      </div>
    </div>
  );
}
