// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { redirect } from "next/navigation";
import RepNav from "@/components/rep/RepNav";
import { currentRep } from "@/lib/repAuth";
import { db } from "@/lib/db";
export const metadata = {
  title: "حساب المندوب",
  robots: { index: false },
  manifest: "/rep-manifest.webmanifest",
  appleWebApp: { capable: true, title: "DYLLU Rep" },
};
export const dynamic = "force-dynamic";
export default async function RepLayout({ children }: { children: React.ReactNode }) {
  const rep = await currentRep();
  if (!rep) redirect("/rep-login");
  const newOrders = await db.order.count({ where: { repId: rep.id, status: "NEW" } });
  return (
    <div dir="rtl" lang="ar" className="admin min-h-screen bg-soft">
      <RepNav name={rep.name} photo={rep.photo} newOrders={newOrders} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 md:py-8 pb-28 md:pb-10">{children}</main>
    </div>
  );
}
