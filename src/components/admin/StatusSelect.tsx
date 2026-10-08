// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { STATUS_AR, STATUS_CLS } from "@/lib/admin/labels";
export default function StatusSelect({ id, status, api = "/api/admin/orders" }: { id: number; status: string; api?: string }) {
  const r = useRouter(),
    [v, setV] = useState(status),
    [busy, setBusy] = useState(false);
  async function change(n: string) {
    const old = v;
    setV(n);
    setBusy(true);
    const x = await post(api, { id, status: n }, "PUT");
    setBusy(false);
    if (x.ok) {
      toast(`الحالة: ${STATUS_AR[n]}`);
      r.refresh();
    } else {
      setV(old);
      toast("تعذر تغيير الحالة", { tone: "err" });
    }
  }
  return (
    <select
      aria-label="حالة الطلب"
      value={v}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      className={`field h-10 w-auto text-sm font-extrabold border-0 rounded-xl ${STATUS_CLS[v]}`}
    >
      {Object.entries(STATUS_AR).map(([k, l]) => (
        <option key={k} value={k} className="bg-white text-ink">
          {l}
        </option>
      ))}
    </select>
  );
}
