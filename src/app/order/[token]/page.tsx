import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/lang";
import { buildWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import PrintButton from "@/components/PrintButton";
export const dynamic = "force-dynamic";
// الرابط يعتمد token عشوائي (لا يمكن تخمينه) وليس رقم الطلب. رسالة واتساب للشركة تبقى بالعربية.
export default async function OrderPage({ params }: { params: { token: string } }) {
  const [s, o] = await Promise.all([getSettings(), db.order.findUnique({ where: { token: params.token }, include: { items: true, customer: true, rep: true } })]);
  if (!o) notFound();
  const en = getLang() === "en", cur = en ? s["currency.en"] ?? "SAR" : s["currency.ar"], hidden = en ? "Contact us" : s["price.hiddenLabel.ar"];
  const wa = whatsappUrl(o.rep?.phone ?? s["whatsapp.number"], buildWhatsAppMessage(o, s["currency.ar"], s["price.hiddenLabel.ar"]));
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center border-b-4 border-lime pb-2">{s["logo.url"] ? <img src={s["logo.url"]} alt="DYLLU" className="h-9" /> : <b className="text-2xl tracking-widest">DYLLU</b>}<span className="text-sm">{o.createdAt.toLocaleDateString(en ? "en-GB" : "ar-SA")}</span></div>
      <h1 className="font-extrabold">{en ? "Order" : "طلب رقم"} {o.number}</h1>
      {o.rep && <div className="text-sm text-steel">{en ? "Representative" : "المندوب"}: <b className="text-ink">{o.rep.name}</b> · {o.rep.location}</div>}
      <div className="text-sm">{o.customer.name} · {o.customer.phone}{o.customer.company ? ` · ${o.customer.company}` : ""}</div>
      <table className="w-full text-sm">
        <thead><tr className="border-b text-steel text-start"><td>{en ? "Product" : "المنتج"}</td><td>{en ? "Qty" : "الكمية"}</td><td>{en ? "Total" : "الإجمالي"}</td></tr></thead>
        <tbody>{o.items.map((x) => <tr key={x.id} className="border-b"><td className="py-2" dir="ltr">{x.nameSnapshot}</td><td>{x.quantity}</td><td>{x.unitPrice == null ? hidden : `${Number(x.unitPrice) * x.quantity} ${cur}`}</td></tr>)}</tbody>
      </table>
      <div className="font-extrabold text-lg">{en ? "Total" : "الإجمالي"}: {Number(o.total)} {cur}{o.hasUnpriced && <span className="text-sm text-accent"> {en ? "(+ unpriced items)" : "(+ منتجات بسعر غير محدد)"}</span>}</div>
      <div className="flex gap-2 print:hidden"><a href={wa} className="bg-lime text-ink font-extrabold rounded-xl p-3 flex-1 text-center">{en ? "Send order via WhatsApp" : "أرسل الطلب عبر واتساب"}</a><PrintButton /></div>
      <p className="text-xs text-steel print:hidden">{en ? "The order is not sent to the company until you press the WhatsApp button and send the message." : "لم يُرسل الطلب للشركة حتى تضغط زر واتساب وترسل الرسالة."}</p>
    </main>
  );
}
