// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/adminAuth";
export const metadata = {
  title: "دخول لوحة التحكم",
  robots: { index: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: { capable: true, title: "DYLLU Admin" },
};
export const dynamic = "force-dynamic";
export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  if (await currentAdmin().catch(() => null)) redirect("/admin");
  return children;
}
