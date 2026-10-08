// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import Switch from "./Switch";
const T: [string, string][] = [
  ["isActive", "ظاهر"],
  ["inStock", "متوفر"],
  ["isFeatured", "مميز"],
  ["showPrice", "السعر"],
  ["allowCart", "السلة"],
];
export default function ProductToggles({
  id,
  init,
  layout = "chips",
}: {
  id: number;
  init: Record<string, boolean>;
  layout?: "chips" | "switches";
}) {
  const [v, setV] = useState(init);
  async function tog(k: string, n: boolean) {
    setV((o) => ({ ...o, [k]: n }));
    const r = await post("/api/admin/products", { id, [k]: n }, "PATCH");
    if (!r.ok) {
      setV((o) => ({ ...o, [k]: !n }));
      toast("تعذر الحفظ", { tone: "err" });
    }
  }
  if (layout === "switches")
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {T.map(([k, l]) => (
          <label key={k} className="inline-flex items-center gap-2 text-xs font-bold text-steel">
            <Switch size="sm" on={v[k]} onChange={(n) => tog(k, n)} />
            {l}
          </label>
        ))}
      </div>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {T.map(([k, l]) => (
        <button
          key={k}
          onClick={() => tog(k, !v[k])}
          aria-pressed={v[k]}
          className={`text-[11px] rounded-lg px-2 py-1 font-bold transition ${v[k] ? "bg-lime text-ink" : "bg-soft text-steel line-through decoration-steel/40"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
