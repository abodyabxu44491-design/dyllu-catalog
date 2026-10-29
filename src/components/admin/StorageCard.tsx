// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { toast } from "@/store/toast";
import { Card } from "./ui";
const mb = (b: number) => (b / 1048576).toLocaleString("en-US", { maximumFractionDigits: 1 });
export default function StorageCard({ configured, count, bytes }: { configured: boolean; count: number; bytes: number }) {
  const r = useRouter(),
    [left, setLeft] = useState(count),
    [busy, setBusy] = useState(false);
  async function move() {
    setBusy(true);
    try {
      let remaining = left;
      while (remaining > 0) {
        const res = await fetch("/api/admin/uploads", { method: "POST" });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || "تعذر نقل الصور");
        remaining = d.remaining;
        setLeft(remaining);
        if (!d.moved) break;
      }
      toast("تم نقل كل الصور إلى التخزين الخارجي", { tone: "ok" });
      r.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "err" });
    }
    setBusy(false);
  }
  const done = count - left;
  return (
    <Card title="تخزين الصور" desc="الصور داخل قاعدة البيانات تستهلك حدودها المجانية. نقلها لتخزين خارجي يخفف الحمل عليها كثيرًا.">
      {!configured ? (
        <div className="text-sm leading-7 space-y-2">
          <p className="flex gap-2">
            <Icon n="info" s={18} className="text-steel shrink-0 mt-1" />
            <span>
              الصور الحالية مخزّنة في قاعدة البيانات
              {count > 0 && (
                <>
                  {" "}
                  (<b>{count}</b> ملف، <b>{mb(bytes)} MB</b>)
                </>
              )}
              . لنقلها أضف مفاتيح التخزين الخارجي (مثل Cloudflare R2) في إعدادات الاستضافة: <code dir="ltr">S3_BUCKET</code>،{" "}
              <code dir="ltr">S3_ENDPOINT</code>، <code dir="ltr">S3_KEY</code>، <code dir="ltr">S3_SECRET</code>،{" "}
              <code dir="ltr">S3_PUBLIC_URL</code>، ثم أعد النشر.
            </span>
          </p>
        </div>
      ) : left === 0 ? (
        <p className="text-sm font-bold flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-lime">
            <Icon n="check" s={16} />
          </span>
          كل الصور في التخزين الخارجي، والصور الجديدة تُرفع له مباشرة.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <p>
            التخزين الخارجي مضبوط. باقي في قاعدة البيانات <b>{left}</b> ملف ({mb(bytes)} MB). النقل آمن: كل ملف يُحذف من قاعدة البيانات بعد
            التأكد من حفظه وتحديث روابطه.
          </p>
          {busy && (
            <div
              className="h-2 rounded-full bg-soft overflow-hidden"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={count}
            >
              <div className="h-full bg-lime transition-all" style={{ width: `${count ? (done / count) * 100 : 100}%` }} />
            </div>
          )}
          <button type="button" onClick={move} disabled={busy} className="btn btn-md btn-dark">
            <Icon n="upload" s={18} />
            {busy ? `جارٍ النقل… ${done} من ${count}` : "نقل الصور الآن"}
          </button>
        </div>
      )}
    </Card>
  );
}
