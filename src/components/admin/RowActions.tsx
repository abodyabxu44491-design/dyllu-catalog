// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
export default function RowActions({ id, slug, live = true }: { id: number; slug: string; live?: boolean }) {
  const r = useRouter();
  async function dup() {
    const x = await post("/api/admin/products", { action: "duplicate", id });
    if (x.ok && x.data.id) {
      toast("تم إنشاء نسخة مخفية");
      r.push(`/admin/products/${x.data.id}`);
    } else toast(x.data.error || "تعذر النسخ", { tone: "err" });
  }
  const b = "btn-icon w-9 h-9 text-steel hover:text-ink hover:bg-soft";
  return (
    <div className="flex items-center gap-0.5">
      <Link href={`/admin/products/${id}`} className="btn btn-sm btn-ghost">
        <Icon n="edit" s={16} />
        تعديل
      </Link>
      {live ? (
        <a href={`/products/${slug}`} target="_blank" title="عرض في المتجر" aria-label="عرض في المتجر" className={b}>
          <Icon n="external" s={17} />
        </a>
      ) : (
        <span
          role="img"
          title="المنتج مخفي عن المتجر"
          aria-label="المنتج مخفي عن المتجر"
          className="btn-icon w-9 h-9 text-steel/40 cursor-not-allowed"
        >
          <Icon n="eyeOff" s={17} />
        </span>
      )}
      <button onClick={dup} title="نسخ المنتج" aria-label="نسخ المنتج" className={b}>
        <Icon n="dup" s={17} />
      </button>
    </div>
  );
}
