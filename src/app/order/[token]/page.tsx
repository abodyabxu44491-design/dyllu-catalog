import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/lang";
import { buildWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import { isPhone, prettyPhone } from "@/lib/phone";
import { brand } from "@/config/brand";
import PrintButton from "@/components/PrintButton";
import CopyLink from "@/components/CopyLink";
import Icon from "@/components/Icon";
import Linkify from "@/components/Linkify";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
const STATUS: Record<string, [string, string, string]> = { NEW: ["قيد المراجعة", "Under review", "bg-accent/10 text-accent"], CONTACTED: ["تم التواصل", "Contacted", "bg-ink/10 text-ink"], CONFIRMED: ["مؤكد", "Confirmed", "bg-lime text-ink"], COMPLETED: ["مكتمل", "Completed", "bg-ink text-lime"], CANCELLED: ["ملغي", "Cancelled", "bg-soft text-steel"] };
// الفاتورة المبدئية: الرابط يعتمد token عشوائي (لا يمكن تخمينه) وليس رقم الطلب. رسالة واتساب للشركة تبقى بالعربية.
export default async function OrderPage({ params }: { params: { token: string } }) {
  const [s, o] = await Promise.all([getSettings(), db.order.findUnique({ where: { token: params.token }, include: { items: { orderBy: { id: "asc" } }, customer: true, rep: true, store: true } })]);
  if (!o) notFound();
  const en = getLang() === "en", cur = en ? s["currency.en"] || "SAR" : s["currency.ar"], hidden = en ? "On request" : s["price.hiddenLabel.ar"];
  const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}`, base = process.env.NEXT_PUBLIC_SITE_URL, link = base ? `${base}/order/${o.token}` : "";
  const wa = whatsappUrl(o.rep?.phone ?? s["whatsapp.number"], buildWhatsAppMessage(o, s["currency.ar"], s["price.hiddenLabel.ar"], link || undefined));
  const qr = link ? await QRCode.toString(link, { type: "svg", margin: 0, color: { dark: brand.ink, light: "#0000" } }) : "";
  const pcs = o.items.reduce((n, i) => n + i.quantity, 0), st = STATUS[o.status], hasName = o.customer.name && o.customer.name !== "بدون اسم";
  const contact = isPhone(s["contact.phone"]) ? s["contact.phone"] : isPhone(s["whatsapp.number"]) ? s["whatsapp.number"] : "";
  const Row = ({ l, v, ltr }: { l: string; v?: string | null; ltr?: boolean }) => v ? <div className="flex justify-between gap-3 py-1.5 border-b border-line/70 last:border-0"><span className="text-steel">{l}</span><b className="text-end" dir={ltr ? "ltr" : undefined}>{v}</b></div> : null;
  return (
    <main className="min-h-screen bg-soft print:bg-white py-6 md:py-10 px-4 print:p-0">
      <div className="max-w-3xl mx-auto no-print mb-4 flex flex-wrap gap-2 justify-between items-center">
        <Link href="/" className="btn btn-md btn-ghost"><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{en ? "Back to catalog" : "العودة للكتالوج"}</Link>
        {link && <CopyLink url={link} label={en ? "Copy invoice link" : "نسخ رابط الفاتورة"} done={en ? "Link copied" : "تم نسخ الرابط"} />}
      </div>
      <article className="max-w-3xl mx-auto bg-white rounded-3xl print:rounded-none overflow-hidden shadow-card print:shadow-none">
        <div className="dy-stripe" />
        <div className="p-5 md:p-10 space-y-7">
          <header className="flex flex-wrap justify-between items-start gap-5">
            <div className="space-y-3"><img src={s["logo.url"] || "/brand/logo-wordmark.png"} alt="DYLLU" className="h-11 md:h-12 w-auto" />
              {contact && <p className="text-xs text-steel">{en ? "Orders & inquiries" : "للطلبات والاستفسار"}: <b dir="ltr" className="text-ink">{prettyPhone(contact)}</b></p>}</div>
            <div className="text-end space-y-1.5"><h1 className="text-2xl md:text-3xl">{en ? "Proforma invoice" : "فاتورة مبدئية"}</h1>
              <p className="text-sm"><span className="text-steel">{en ? "No." : "رقم"}</span> <b dir="ltr">{o.number}</b></p>
              <p className="text-sm text-steel">{o.createdAt.toLocaleDateString(en ? "en-GB" : "ar-SA", { dateStyle: "long" })}</p>
              <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold ${st[2]}`}>{en ? st[1] : st[0]}</span></div>
          </header>

          <section className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-soft p-4"><b className="flex items-center gap-2 mb-2 font-display"><Icon n="user" s={16} className="text-accent" />{en ? "Bill to" : "بيانات العميل"}</b>
              <Row l={en ? "Name" : "الاسم"} v={hasName ? o.customer.name : undefined} /><Row l={en ? "Mobile" : "الجوال"} v={prettyPhone(o.customer.phone)} ltr /><Row l={en ? "Company" : "الشركة"} v={o.customer.company} /><Row l={en ? "City" : "المدينة"} v={o.customer.city} /></div>
            <div className="rounded-2xl bg-soft p-4"><b className="flex items-center gap-2 mb-2 font-display"><Icon n="orders" s={16} className="text-accent" />{en ? "Order details" : "تفاصيل الطلب"}</b>
              <Row l={en ? "Representative" : "المندوب"} v={o.rep ? `${o.rep.name} · ${o.rep.location}` : undefined} /><Row l={en ? "Type" : "النوع"} v={o.isWholesale ? (en ? "Wholesale" : "جملة") : (en ? "Retail" : "تجزئة")} />
              <Row l={en ? "Via" : "عن طريق"} v={o.store?.name} /><Row l={en ? "Items" : "عدد القطع"} v={String(pcs)} /></div>
          </section>

          {/* جدول (تابلت/كمبيوتر/طباعة) */}
          <table className="hidden sm:table print:table w-full text-sm">
            <thead><tr className="border-b-2 border-ink text-steel text-xs"><th className="w-8 py-2 font-bold text-start">#</th><th className="text-start py-2 font-bold">{en ? "Product" : "المنتج"}</th><th className="py-2 font-bold w-16">{en ? "Qty" : "الكمية"}</th><th className="text-end py-2 font-bold w-28">{en ? "Unit price" : "سعر الوحدة"}</th><th className="text-end py-2 font-bold w-32">{en ? "Total" : "الإجمالي"}</th></tr></thead>
            <tbody>{o.items.map((x, i) => <tr key={x.id} className="border-b border-line align-top"><td className="py-3 text-steel">{i + 1}</td><td className="py-3"><b className="block">{x.nameSnapshot}</b>{x.skuSnapshot && <small className="text-xs text-steel" dir="ltr">{x.skuSnapshot}</small>}</td><td className="py-3 text-center font-bold">{x.quantity}</td><td className="py-3 text-end text-steel">{x.unitPrice == null ? "—" : money(Number(x.unitPrice))}</td><td className="py-3 text-end font-bold">{x.unitPrice == null ? hidden : money(Number(x.unitPrice) * x.quantity)}</td></tr>)}</tbody>
          </table>
          {/* بطاقات (جوال) */}
          <div className="sm:hidden print:hidden divide-y divide-line border-y border-line">{o.items.map((x, i) => (<div key={x.id} className="py-3 flex gap-3">
            <span className="w-7 h-7 rounded-lg bg-soft grid place-items-center text-xs font-bold text-steel shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0"><b className="block text-sm">{x.nameSnapshot}</b>{x.skuSnapshot && <small className="text-xs text-steel" dir="ltr">{x.skuSnapshot}</small>}
              <div className="flex justify-between text-sm mt-1"><span className="text-steel">{x.quantity} × {x.unitPrice == null ? "—" : money(Number(x.unitPrice))}</span><b>{x.unitPrice == null ? hidden : money(Number(x.unitPrice) * x.quantity)}</b></div></div></div>))}</div>

          <section className="flex flex-wrap items-end justify-between gap-5">
            {qr ? <div className="flex items-center gap-3"><span className="w-20 h-20 block [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} /><small className="text-xs text-steel max-w-[9rem] leading-5">{en ? "Scan to open this invoice" : "امسح لفتح هذه الفاتورة"}</small></div> : <span />}
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-steel">{en ? "Subtotal" : "المجموع"}</span><b>{money(Number(o.total))}</b></div>
              <div className="flex justify-between items-end rounded-2xl bg-ink text-white p-4"><span className="font-bold">{en ? "Total" : "الإجمالي"}</span><b className="font-display text-2xl text-lime">{money(Number(o.total))}</b></div>
              {o.hasUnpriced && <p className="text-xs text-steel">{en ? "+ items priced on request" : "+ منتجات يُحدد سعرها عند التواصل"}</p>}</div>
          </section>

          {o.notes && <p className="text-sm leading-7 rounded-2xl border border-line p-4"><b>{en ? "Notes" : "ملاحظات"}:</b> <Linkify text={o.notes} wa={false} /></p>}
          <div className="flex flex-col sm:flex-row gap-2 no-print"><a href={wa} className="btn btn-lg btn-lime sm:flex-1"><Icon n="whatsapp" s={20} />{en ? "Send order via WhatsApp" : "أرسل الطلب عبر واتساب"}</a><PrintButton /></div>
          <p className="text-xs text-steel leading-6 border-t border-line pt-4">{en ? "This is a proforma invoice. The order is confirmed after our team contacts you. Prices may change without notice." : "هذه فاتورة مبدئية، ويُؤكَّد الطلب بعد تواصل فريقنا معك. الأسعار قابلة للتغيير دون إشعار مسبق."}</p>
        </div>
        <div className="bg-lime px-5 md:px-10 py-2 text-end shadow-[0_-3px_0_theme(colors.accent)]"><b className="text-steel text-xs" dir="ltr">DYLLU, Discover your Power</b></div>
      </article>
    </main>
  );
}
