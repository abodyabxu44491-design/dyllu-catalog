// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import Switch from "./Switch";
// Pauses or resumes new orders from the store; the server enforces it too
export default function OrdersSwitch({ open, message }: { open: boolean; message: string }) {
  const r = useRouter(),
    [msg, setMsg] = useState(message),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false);
  async function save(next: boolean, text = msg) {
    if (
      !next &&
      !(await ask({
        title: "إيقاف استقبال الطلبات؟",
        body: "العملاء يتصفحون عادي، لكن ما يقدرون يرسلون طلبات جديدة حتى تعيد التشغيل.",
        ok: "إيقاف",
        danger: true,
      }))
    )
      return;
    setBusy(true);
    const x = await post(
      "/api/admin/settings",
      { "orders.enabled": next ? "1" : "0", "orders.pausedMsg.ar": text.trim() || message },
      "PUT",
    );
    setBusy(false);
    if (!x.ok) return toast("تعذر الحفظ", { tone: "err" });
    toast(next ? "عاد استقبال الطلبات" : "تم إيقاف استقبال الطلبات مؤقتًا");
    setEditing(false);
    r.refresh();
  }
  return (
    <section
      className={`rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${open ? "bg-white border border-line" : "bg-accent text-white"}`}
    >
      <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${open ? "bg-lime text-ink" : "bg-white/20"}`}>
        <Icon n={open ? "check" : "clock"} s={22} />
      </span>
      <div className="flex-1 min-w-0">
        <b className="block">{open ? "🟢 استقبال الطلبات مفعّل" : "🔴 استقبال الطلبات متوقف مؤقتًا"}</b>
        {editing ? (
          <textarea
            autoFocus
            className="field mt-2 text-ink"
            rows={2}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            aria-label="رسالة الإيقاف للعملاء"
          />
        ) : (
          <small className={`block mt-0.5 leading-6 ${open ? "text-steel" : "text-white/90"}`}>
            {open ? "أوقفه مؤقتًا أثناء تحديث الأسعار أو المخزون." : `يظهر للعملاء: ${msg}`}
          </small>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <button disabled={busy} onClick={() => save(open)} className={`btn btn-sm h-9 ${open ? "btn-lime" : "bg-white text-accent"}`}>
            حفظ الرسالة
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`text-xs font-bold underline underline-offset-4 ${open ? "text-steel" : "text-white"}`}
          >
            تعديل الرسالة
          </button>
        )}
        <Switch on={open} onChange={(v) => !busy && save(v)} ariaLabel="استقبال الطلبات" />
      </div>
    </section>
  );
}
