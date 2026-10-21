// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
export default function LangToggle({ className = "" }: { className?: string }) {
  const L = useLang();
  return (
    <button
      className={`btn btn-sm btn-ghost h-10 xs:h-11 rounded-xl px-2 xs:px-3 ${className}`}
      aria-label={L === "en" ? "التبديل إلى العربية" : "Switch to English"}
      onClick={() => {
        document.cookie = `lang=${L === "en" ? "ar" : "en"}; path=/; max-age=31536000; samesite=lax`;
        // Full reload: direction, fonts and every text change at once, with no soft-refresh race against link prefetches
        window.location.reload();
      }}
    >
      <Icon n="globe" s={18} className="text-steel max-xs:hidden" />
      <span>{L === "en" ? "عربي" : "EN"}</span>
    </button>
  );
}
