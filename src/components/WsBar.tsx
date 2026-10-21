// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
export default function WsBar({ name }: { name: string }) {
  const L = useLang();
  return (
    <div className="bg-ink text-lime text-sm font-bold">
      <div className="wrap flex justify-between items-center gap-3 h-10">
        <span className="inline-flex items-center gap-2 min-w-0">
          <Icon n="key" s={16} />
          <span className="truncate">
            {t(L, "wholesaleAcc")}: {name}
          </span>
        </span>
        <button
          className="btn btn-sm h-7 border border-lime/60 text-lime hover:bg-lime hover:text-ink"
          onClick={async () => {
            await fetch("/api/ws", { method: "DELETE" });
            window.location.reload();
          }}
        >
          {t(L, "logout")}
        </button>
      </div>
    </div>
  );
}
