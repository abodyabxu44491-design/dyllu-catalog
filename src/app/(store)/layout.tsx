// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BottomNav from "@/components/BottomNav";
import NotifyPrompt from "@/components/NotifyPrompt";
import { getLang } from "@/lib/lang";
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const en = (await getLang()) === "en";
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
      <NotifyPrompt en={en} />
    </>
  );
}
