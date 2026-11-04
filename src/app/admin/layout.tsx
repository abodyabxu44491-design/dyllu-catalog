// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentAdmin } from "@/lib/adminAuth";
import { sqlFirst } from "@/lib/db";
import { orderingState } from "@/lib/ordering";
export const metadata = {
  title: "لوحة التحكم",
  robots: { index: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: { capable: true, title: "DYLLU Admin" },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin-login");
  const [newOrders, ordering] = await Promise.all([
    sqlFirst<{ n: number }>(`SELECT count(*) n FROM "Order" WHERE "status" = 'NEW'`).then((r) => r?.n ?? 0),
    orderingState(),
  ]);
  return (
    <div dir="rtl" lang="ar" className="admin min-h-screen bg-soft lg:flex">
      <AdminNav newOrders={newOrders} paused={!ordering.open} admin={{ name: admin.name, email: admin.email }} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 lg:pb-10">{children}</div>
      </main>
    </div>
  );
}
