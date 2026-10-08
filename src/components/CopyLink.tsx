// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Icon from "./Icon";
import { toast } from "@/store/toast";
export default function CopyLink({
  url,
  label,
  done,
  share = false,
  className = "btn btn-md btn-ghost",
}: {
  url: string;
  label: string;
  done: string;
  share?: boolean;
  className?: string;
}) {
  async function go() {
    if (share && navigator.share) {
      try {
        await navigator.share({ url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(done);
    } catch {
      prompt(label, url);
    }
  }
  return (
    <button type="button" onClick={go} className={className}>
      <Icon n={share ? "share" : "copyLink"} s={18} />
      {label}
    </button>
  );
}
