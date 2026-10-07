import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ipOf, limited } from "@/lib/ratelimit";
// عدّاد مسح رمز QR: يُستدعى مرة لكل زيارة (جلسة) من محل، ومحدود لكل جهاز لمنع التضخيم
export async function POST(req: Request) {
  const { src } = await req.json().catch(() => ({ src: "" }));
  const code = String(src ?? "").slice(0, 40);
  if (!code || limited(`scan:${ipOf(req)}:${code}`, 3, 60 * 60_000)) return NextResponse.json({ ok: true });
  await db.store.updateMany({ where: { code, isActive: true }, data: { scans: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
