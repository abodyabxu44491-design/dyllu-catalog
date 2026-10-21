// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
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
  async function remove() {
    if (
      !(await ask({
        title: `حذف الطلب ${number} نهائيًا؟`,
        body: "لا يمكن التراجع. يُحذف الطلب ومنتجاته من السجل، ويبقى العميل والمنتجات كما هي.",
        ok: "حذف نهائي",
        danger: true,
      }))
    )
      return;
    setBusy(true);
    const x = await fetch(`/api/admin/orders?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!x.ok) return toast((await x.json().catch(() => ({}))).error ?? "تعذر الحذف", { tone: "err" });
    toast(`حُذف الطلب ${number}`);
    r.refresh();
  }
  return archived ? (
    <>
      <button disabled={busy} onClick={() => archive(false)} className="btn btn-sm h-10 btn-ghost">
        <Icon n="upload" s={16} />
        استرجاع
      </button>
      <button disabled={busy} onClick={remove} className="btn btn-sm h-10 text-accent hover:bg-accent/5">
        <Icon n="trash" s={16} />
        حذف نهائي
      </button>
    </>
  ) : (
    <button disabled={busy} onClick={() => archive(true)} className="btn btn-sm h-10 btn-ghost">
      <Icon n="download" s={16} />
      أرشفة
    </button>
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
