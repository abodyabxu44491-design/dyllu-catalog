// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
export default function PrintButton() {
  const en = useLang() === "en";
  return (
    <button onClick={() => window.print()} className="btn btn-lg btn-ghost w-full sm:w-auto sm:flex-1 no-print">
      <Icon n="print" s={20} />
      {en ? "Save PDF / Print" : "حفظ PDF / طباعة"}
    </button>
  );
}
