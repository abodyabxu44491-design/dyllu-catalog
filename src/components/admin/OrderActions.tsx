// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
async function removeOrders(ids: number[], label: string) {
  if (
    !(await ask({
      title: ids.length === 1 ? `حذف ${label} نهائيًا؟` : `حذف ${ids.length} طلب نهائيًا؟`,
      body: "لا يمكن التراجع. تُحذف الطلبات ومنتجاتها من السجل، ويبقى العملاء والمنتجات كما هي.",
      ok: "حذف نهائي",
      danger: true,
    }))
  )
    return false;
  const x = await fetch("/api/admin/orders", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const d = await x.json().catch(() => ({}));
  if (!x.ok) {
    toast(d.error ?? "تعذر الحذف", { tone: "err" });
    return false;
  }
  toast(ids.length === 1 ? `حُذف ${label}` : `حُذف ${d.count} طلب`);
  return true;
}
export function DeleteOrder({ id, number, compact = false }: { id: number; number: string; compact?: boolean }) {
  const r = useRouter(),
    [busy, setBusy] = useState(false);
  async function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    if (await removeOrders([id], `الطلب ${number}`)) r.refresh();
    setBusy(false);
  }
  return compact ? (
    <button
      type="button"
      disabled={busy}
      onClick={go}
      title={`حذف الطلب ${number}`}
      aria-label={`حذف الطلب ${number}`}
      className="btn-icon w-9 h-9 text-steel hover:text-accent hover:bg-accent/10"
    >
      <Icon n="trash" s={17} />
    </button>
  ) : (
    <button type="button" disabled={busy} onClick={go} className="btn btn-sm h-10 text-accent hover:bg-accent/5">
      <Icon n="trash" s={16} />
      حذف
    </button>
  );
}
export function OrderActions({ id, number, archived }: { id: number; number: string; archived: boolean }) {
  const r = useRouter(),
    [busy, setBusy] = useState(false);
  async function archive(v: boolean) {
    setBusy(true);
    const x = await post("/api/admin/orders", { id, archive: v }, "PATCH");
    setBusy(false);
    if (!x.ok) return toast("تعذر الحفظ", { tone: "err" });
    toast(v ? `أُرشف الطلب ${number}` : `أُعيد الطلب ${number} للقائمة`);
    r.refresh();
  }
  return (
    <>
      <button disabled={busy} onClick={() => archive(!archived)} className="btn btn-sm h-10 btn-ghost">
        <Icon n={archived ? "upload" : "download"} s={16} />
        {archived ? "استرجاع" : "أرشفة"}
      </button>
      <DeleteOrder id={id} number={number} />
    </>
  );
}
// Selection lives in the server-rendered checkboxes ([data-order-sel]); this bar reads them and acts on the chosen orders
export function OrderBulk({ archived, count }: { archived: boolean; count: number }) {
  const r = useRouter(),
    [sel, setSel] = useState<number[]>([]),
    [busy, setBusy] = useState(false);
  const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>("input[data-order-sel]"));
  useEffect(() => {
    const sync = () =>
      setSel(
        boxes()
          .filter((b) => b.checked)
          .map((b) => Number(b.value)),
      );
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
  }, [count]);
  const setAll = (v: boolean) => {
    for (const b of boxes()) b.checked = v;
    setSel(v ? boxes().map((b) => Number(b.value)) : []);
  };
  const done = () => {
    setAll(false);
    r.refresh();
  };
  async function archive() {
    setBusy(true);
    const x = await post("/api/admin/orders", { ids: sel, archive: !archived }, "PATCH");
    setBusy(false);
    if (!x.ok) return toast("تعذر الحفظ", { tone: "err" });
    toast(archived ? `أُعيد ${x.data.count} طلب للقائمة` : `أُرشف ${x.data.count} طلب`);
    done();
  }
  async function del() {
    setBusy(true);
    const ok = await removeOrders(sel, "الطلب");
    setBusy(false);
    if (ok) done();
  }
  const all = sel.length > 0 && sel.length === count;
  return (
    <>
      <label className="inline-flex items-center gap-2 text-sm font-bold text-steel cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-5 h-5 accent-ink"
          checked={all}
          ref={(el) => {
            if (el) el.indeterminate = sel.length > 0 && !all;
          }}
          onChange={(e) => setAll(e.target.checked)}
        />
        تحديد الكل
      </label>
      {sel.length > 0 && (
        <div
          role="region"
          aria-label="إجراءات الطلبات المحددة"
          className="fixed z-40 inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 mx-auto max-w-md rounded-2xl bg-ink text-white shadow-lift p-2 ps-4 flex items-center gap-2"
        >
          <b className="text-sm flex-1 min-w-0 truncate">
            محدد <span className="text-lime">{sel.length}</span> طلب
          </b>
          <button type="button" disabled={busy} onClick={archive} className="btn btn-sm h-10 bg-white/10 text-white hover:bg-white/20">
            <Icon n={archived ? "upload" : "download"} s={16} />
            {archived ? "استرجاع" : "أرشفة"}
          </button>
          <button type="button" disabled={busy} onClick={del} className="btn btn-sm h-10 bg-accent text-white hover:brightness-95">
            <Icon n="trash" s={16} />
            حذف
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            aria-label="إلغاء التحديد"
            className="btn-icon w-9 h-9 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Icon n="close" s={18} />
          </button>
        </div>
      )}
    </>
  );
}
export function ArchiveDone({ count }: { count: number }) {
  const r = useRouter(),
    [busy, setBusy] = useState(false);
  if (!count) return null;
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (
          !(await ask({
            title: `أرشفة ${count} طلب مكتمل أو ملغي؟`,
            body: "تنتقل للأرشيف وتقدر تبحث فيها أو ترجعها في أي وقت.",
            ok: "أرشفة",
          }))
        )
          return;
        setBusy(true);
        const x = await post("/api/admin/orders", { action: "archiveDone" }, "PATCH");
        setBusy(false);
        if (!x.ok) return toast("تعذر الأرشفة", { tone: "err" });
        toast(`أُرشف ${x.data.count} طلب`);
        r.refresh();
      }}
      className="btn btn-md btn-ghost"
    >
      <Icon n="download" s={18} />
      أرشفة المكتملة ({count})
    </button>
  );
}
