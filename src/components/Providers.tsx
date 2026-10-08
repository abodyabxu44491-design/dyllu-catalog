// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Link from "next/link";
import Icon from "./Icon";
import { LangContext } from "@/lib/useLang";
import { useToast } from "@/store/toast";
import { answer, useConfirm } from "@/store/confirm";
import Modal from "./Modal";
import type { Lang } from "@/lib/lang";
function Toaster() {
  const { items, drop } = useToast();
  return (
    <div
      aria-live="polite"
      className="fixed z-[80] inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 flex flex-col items-center gap-2 px-4 pointer-events-none"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`animate-rise pointer-events-auto flex items-center gap-3 rounded-2xl ps-4 pe-2 py-2 shadow-lift max-w-md w-full sm:w-auto ${t.tone === "err" ? "bg-accent text-white" : "bg-ink text-white"}`}
        >
          <span
            className={`grid place-items-center w-6 h-6 rounded-full shrink-0 ${t.tone === "err" ? "bg-white/20" : "bg-lime text-ink"}`}
          >
            <Icon n={t.tone === "err" ? "alert" : "check"} s={14} stroke={2.6} />
          </span>
          <span className="flex-1 text-sm font-bold py-1.5">{t.text}</span>
          {t.action && (
            <Link href={t.action.href} onClick={() => drop(t.id)} className="btn btn-sm btn-lime">
              {t.action.label}
            </Link>
          )}
          <button aria-label="close" onClick={() => drop(t.id)} className="btn-icon w-8 h-8 text-white/70 hover:text-white">
            <Icon n="close" s={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
function ConfirmHost() {
  const q = useConfirm((s) => s.q);
  return (
    <Modal open={!!q} onClose={() => answer(false)} icon={q?.danger ? "trash" : "info"} title={q?.title} sub={q?.body}>
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
        <button onClick={() => answer(false)} className="btn btn-lg btn-ghost sm:flex-1">
          {q?.cancel ?? "إلغاء"}
        </button>
        <button
          autoFocus
          onClick={() => answer(true)}
          className={`btn btn-lg sm:flex-1 ${q?.danger ? "bg-accent text-white hover:bg-accent/90" : "btn-lime"}`}
        >
          {q?.ok ?? "تأكيد"}
        </button>
      </div>
    </Modal>
  );
}
export default function Providers({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <LangContext.Provider value={lang}>
      {children}
      <Toaster />
      <ConfirmHost />
    </LangContext.Provider>
  );
}
