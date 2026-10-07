import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { getWholesale } from "@/lib/wholesale";
import { ipOf, limited } from "@/lib/ratelimit";
import { buildWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/siteUrl";
export async function POST(req: Request) {
  if (limited(`ord:${ipOf(req)}`, 10, 60_000)) return NextResponse.json({ error: "محاولات كثيرة" }, { status: 429 });
  try {
    const order = await createOrder(await req.json(), await getWholesale());
    const s = await getSettings(), base = siteUrl();
    const msg = buildWhatsAppMessage(order, s["currency.ar"], s["price.hiddenLabel.ar"], base ? `${base}/order/${order.token}` : undefined);
    // الطلب يُرسل إلى واتساب المندوب المختار، وإن لم يوجد مندوب فالرقم العام من الإعدادات
    return NextResponse.json({ number: order.number, token: order.token, whatsappUrl: whatsappUrl(order.rep?.phone ?? s["whatsapp.number"], msg) });
  } catch (e) { return NextResponse.json({ error: e instanceof ZodError ? e.issues[0]?.message ?? "تحقق من البيانات" : (e as Error).message }, { status: 400 }); }
}
