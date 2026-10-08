// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
export default function LangToggle({ className = "" }: { className?: string }) {
  const r = useRouter(),
    L = useLang();
  return (
    <button
      className={`btn btn-sm btn-ghost h-11 rounded-xl px-3 ${className}`}
      aria-label={L === "en" ? "التبديل إلى العربية" : "Switch to English"}
      onClick={() => {
        document.cookie = `lang=${L === "en" ? "ar" : "en"}; path=/; max-age=31536000; samesite=lax`;
        r.refresh();
      }}
    >
      <Icon n="globe" s={18} className="text-steel" />
      <span>{L === "en" ? "عربي" : "EN"}</span>
    </button>
  );
}
