"use client";
import { useState } from "react";
import { post } from "@/lib/client";
const T: [string, string][] = [["isActive", "ظاهر"], ["inStock", "متوفر"], ["isFeatured", "مميز"], ["showPrice", "السعر ظاهر"], ["allowCart", "سلة"]];
// تبديل سريع من القائمة بدون فتح صفحة التعديل
export default function ProductToggles({ id, init }: { id: number; init: Record<string, boolean> }) {
  const [v, setV] = useState(init);
  async function tog(k: string) { const n = !v[k]; setV({ ...v, [k]: n }); const r = await post("/api/admin/products", { id, [k]: n }, "PATCH"); if (!r.ok) setV({ ...v, [k]: !n }); }
  return <div className="flex flex-wrap gap-1">{T.map(([k, l]) => <button key={k} onClick={() => tog(k)} className={`text-xs rounded-lg px-2 py-1 font-bold ${v[k] ? "bg-lime text-ink" : "bg-ink/10 text-steel"}`}>{l}</button>)}</div>;
}
