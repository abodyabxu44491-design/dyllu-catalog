import { redirect } from "next/navigation";
import { currentRep } from "@/lib/repAuth";
// من سجّل دخوله كمندوب يُحوَّل مباشرة لحسابه
export const metadata = { title: "دخول المندوب", robots: { index: false }, manifest: "/rep-manifest.webmanifest", appleWebApp: { capable: true, title: "DYLLU Rep" } };
export const dynamic = "force-dynamic";
export default async function L({ children }: { children: React.ReactNode }) {
  if (await currentRep().catch(() => null)) redirect("/rep");
  return children;
}
