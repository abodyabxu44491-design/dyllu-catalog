import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/lang";
import { buildWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import PrintButton from "@/components/PrintButton";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
// الرابط يعتمد token عشوائي (لا يمكن تخمينه) وليس رقم الطلب. رسالة واتساب للشركة تبقى بالعربية.
export default async function OrderPage({ params }: { params: { token: string } }) {
  const [s, o] = await Promise.all([getSettings(), db.order.findUnique({ where: { token: params.token }, include: { items: true, customer: true, rep: true } })]);
  if (!o) notFound();
  const en = getLang() === "en", cur = en ? s["currency.en"] ?? "SAR" : s["currency.ar"], hidden = en ? "Contact us" : s["price.hiddenLabel.ar"];
  const money = (n: number) => `${n.toLocaleString("en-US")} ${cur}`;
  const wa = whatsappUrl(o.rep?.phone ?? s["whatsapp.number"], buildWhatsAppMessage(o, s["currency.ar"], s["price.hiddenLabel.ar"]));
  const Info = ({ l, v, ltr }: { l: string; v?: string | null; ltr?: boolean }) => v ? <div><small className="block text-xs text-steel">{l}</small><b dir={ltr ? "ltr" : undefined}>{v}</b></div> : null;
  return (
    <main className="min-h-screen bg-soft print:bg-white py-6 md:py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl print:rounded-none overflow-hidden shadow-card print:shadow-none">
        <div className="dy-stripe" />
        <div className="p-5 md:p-8 space-y-6">
          <div className="flex justify-between items-start gap-4">
            <img src={s["logo.url"] || "/brand/logo-wordmark.png"} alt="DYLLU" className="h-10 md:h-12 w-auto" />
            <div className="text-end"><span className="dy-tab text-sm">{en ? "Order" : "طلب"}</span><b className="block font-display text-xl mt-2" dir="ltr">{o.number}</b><small className="text-steel">{o.createdAt.toLocaleDateString(en ? "en-GB" : "ar-SA", { dateStyle: "long" })}</small></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-2xl bg-soft p-4 text-sm">
            <Info l={en ? "Customer" : "العميل"} v={o.customer.name !== "بدون اسم" ? o.customer.name : undefined} />
            <Info l={en ? "Mobile" : "الجوال"} v={o.customer.phone} ltr />
            <Info l={en ? "Company" : "الشركة"} v={o.customer.company} />
            <Info l={en ? "City" : "المدينة"} v={o.customer.city} />
            {o.rep && <Info l={en ? "Representative" : "المندوب"} v={`${o.rep.name} · ${o.rep.location}`} />}
            {o.isWholesale && <Info l={en ? "Type" : "النوع"} v={en ? "Wholesale" : "جملة"} />}
          </div>
          <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0"><table className="w-full text-sm min-w-[440px]">
            <thead><tr className="border-b-2 border-ink text-steel text-xs"><th className="text-start py-2 font-bold">{en ? "Product" : "المنتج"}</th><th className="py-2 font-bold w-14">{en ? "Qty" : "الكمية"}</th><th className="text-end py-2 font-bold">{en ? "Unit" : "السعر"}</th><th className="text-end py-2 font-bold">{en ? "Total" : "الإجمالي"}</th></tr></thead>
            <tbody>{o.items.map((x) => <tr key={x.id} className="border-b border-line"><td className="py-3 font-bold" dir="ltr" style={{ textAlign: "start" }}>{x.nameSnapshot}</td><td className="text-center">{x.quantity}</td><td className="text-end text-steel">{x.unitPrice == null ? "—" : money(Number(x.unitPrice))}</td><td className="text-end font-bold">{x.unitPrice == null ? hidden : money(Number(x.unitPrice) * x.quantity)}</td></tr>)}</tbody>
          </table></div>
          <div className="flex justify-between items-end gap-4 rounded-2xl bg-ink text-white p-4 md:p-5"><span className="font-bold">{en ? "Total" : "الإجمالي"}</span><div className="text-end"><b className="font-display text-2xl md:text-3xl text-lime">{money(Number(o.total))}</b>{o.hasUnpriced && <small className="block text-white/70 text-xs">{en ? "+ unpriced items" : "+ منتجات بسعر غير محدد"}</small>}</div></div>
          {o.notes && <p className="text-sm"><b>{en ? "Notes" : "ملاحظات"}:</b> {o.notes}</p>}
          <div className="flex flex-col sm:flex-row gap-2 no-print"><a href={wa} className="btn btn-lg btn-lime flex-1"><Icon n="whatsapp" s={20} />{en ? "Send order via WhatsApp" : "أرسل الطلب عبر واتساب"}</a><PrintButton /></div>
          <p className="text-xs text-steel no-print flex items-start gap-2"><Icon n="info" s={16} className="mt-0.5" />{en ? "The order is not sent to the company until you press the WhatsApp button and send the message." : "لم يُرسل الطلب للشركة حتى تضغط زر واتساب وترسل الرسالة."}</p>
          <Link href="/" className="no-print inline-flex items-center gap-1 text-sm font-bold text-steel hover:text-ink"><Icon n="home" s={16} />{en ? "Back to catalog" : "العودة للكتالوج"}</Link>
        </div>
        <div className="bg-lime px-5 md:px-8 py-2 text-end shadow-[0_-3px_0_theme(colors.accent)]"><b className="text-steel text-xs" dir="ltr">DYLLU, Discover your Power</b></div>
      </div>
    </main>
  );
}
