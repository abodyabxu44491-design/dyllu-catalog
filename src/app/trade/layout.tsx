// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { Viewport } from "next";
import { brand } from "@/config/brand";
export const metadata = {
  title: { absolute: "DYLLU Trade" },
  description: "أسعار الجملة لأصحاب المحلات المعتمدين",
  robots: { index: false, follow: false },
  manifest: "/trade-manifest.webmanifest",
  appleWebApp: { capable: true, title: "DYLLU Trade", statusBarStyle: "black-translucent" as const },
};
export const viewport: Viewport = { themeColor: brand.ink };
export default function TradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="admin min-h-screen bg-soft">
      {children}
    </div>
  );
}
