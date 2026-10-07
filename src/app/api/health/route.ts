import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
// فحص صحة الموقع (يستخدمه Render): يتأكد أن قاعدة البيانات تعمل
export async function GET() {
  try { await db.$queryRaw`SELECT 1`; return Response.json({ ok: true }); }
  catch { return Response.json({ ok: false, error: "database" }, { status: 503 }); }
}
