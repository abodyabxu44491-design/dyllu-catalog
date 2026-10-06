"use client";
import { useState } from "react";
import { post } from "@/lib/client";
import { STATUS_AR } from "@/lib/admin/labels";
export default function StatusSelect({ id, status }: { id: number; status: string }) {
  const [ok, setOk] = useState(false);
  return <span className="inline-flex items-center gap-2"><select defaultValue={status} className="border rounded-xl p-1.5 bg-white font-bold" onChange={async (e) => { const r = await post("/api/admin/orders", { id, status: e.target.value }, "PUT"); setOk(r.ok); setTimeout(() => setOk(false), 1500); }}>{Object.entries(STATUS_AR).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{ok && <small>✓</small>}</span>;
}
