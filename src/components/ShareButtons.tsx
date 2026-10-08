// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
import { toast } from "@/store/toast";
export default function ShareButtons({ title, askUrl, callUrl }: { title: string; askUrl?: string; callUrl?: string }) {
  const L = useLang();
  async function share() {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t(L, "copied"));
    } catch {
      prompt(t(L, "copyLink"), url);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {askUrl && (
        <a href={askUrl} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-ghost">
          <Icon n="whatsapp" s={18} className="text-[#1FA855]" />
          {t(L, "askWhatsapp")}
        </a>
      )}
      {callUrl && (
        <a href={callUrl} className="btn btn-md btn-ghost">
          <Icon n="phone" s={18} />
          {L === "en" ? "Call" : "اتصال"}
        </a>
      )}
      <button onClick={share} className="btn btn-md btn-ghost">
        <Icon n="share" s={18} />
        {t(L, "share")}
      </button>
    </div>
  );
}
