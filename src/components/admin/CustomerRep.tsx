// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
export default function CustomerRep({ id, repId, reps }: { id: number; repId: number | null; reps: { id: number; name: string }[] }) {
  const r = useRouter(),
    [v, setV] = useState(repId ? String(repId) : "");
  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-steel">
      المندوب
      <select
        className="field h-9 w-auto min-w-[130px] text-sm"
        value={v}
        onChange={async (e) => {
          const next = e.target.value,
            prev = v;
          setV(next);
          const x = await post("/api/admin/customers", { id, repId: next ? Number(next) : null }, "PATCH");
          if (!x.ok) {
            setV(prev);
            return toast(x.data.error ?? "تعذر الحفظ", { tone: "err" });
          }
          toast(next ? "تم تغيير المندوب المسؤول" : "أُزيل المندوب المسؤول");
          r.refresh();
        }}
      >
        <option value="">بدون مندوب</option>
        {reps.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </label>
  );
}
