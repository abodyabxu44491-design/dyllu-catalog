import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { currentRep } from "@/lib/repAuth";
import { brand } from "@/config/brand";
import { STATUS_AR, STATUS_CLS, money } from "@/lib/admin/labels";
import { Badge, Card, Stat } from "@/components/admin/ui";
import CopyLink from "@/components/CopyLink";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
// الرئيسية: أرقام المندوب + رابطه الخاص (أي طلب من الرابط يذهب له) + آخر الطلبات
export default async function RepHome() {
  const rep = (await currentRep())!, now = new Date(), month = new Date(now.getFullYear(), now.getMonth(), 1), mine = { repId: rep.id };
  const [fresh, m, all, customers, recent] = await Promise.all([
    db.order.count({ where: { ...mine, status: "NEW" } }),
    db.order.aggregate({ where: { ...mine, createdAt: { gte: month }, status: { not: "CANCELLED" } }, _count: true, _sum: { total: true } }),
    db.order.aggregate({ where: { ...mine, status: { not: "CANCELLED" } }, _count: true, _sum: { total: true } }),
    db.order.groupBy({ by: ["customerId"], where: mine }).then((r) => r.length),
    db.order.findMany({ where: mine, include: { customer: { select: { name: true, phone: true } } }, orderBy: { id: "desc" }, take: 5 })]);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "", link = `${base}/?rep=${rep.id}`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: brand.ink, light: "#0000" } });
  const share = `https://wa.me/?text=${encodeURIComponent(`تصفّح كتالوج DYLLU واطلب مباشرة، وطلبك يوصلني:\n${link}`)}`;
  return (<div className="space-y-5 md:space-y-6">
    <div><p className="text-sm text-steel">أهلًا</p><h1 className="text-2xl md:text-3xl">{rep.name}</h1><small className="text-steel inline-flex items-center gap-1 mt-1"><Icon n="pin" s={14} />{rep.location}</small></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="طلبات جديدة" value={fresh} icon="orders" tone="accent" href="/rep/orders?st=NEW" sub="بانتظار تواصلك" />
      <Stat label="هذا الشهر" value={m._count} icon="chart" sub={`${money(m._sum.total)} ريال`} />
      <Stat label="كل طلباتي" value={all._count} icon="bag" tone="ink" sub={`${money(all._sum.total)} ريال`} href="/rep/orders" />
      <Stat label="عملائي" value={customers} icon="users" tone="soft" href="/rep/customers" />
    </div>
    <section className="relative overflow-hidden rounded-3xl bg-ink text-white p-5 md:p-7 grid md:grid-cols-[1fr_auto] gap-5 items-center">
      <span aria-hidden className="absolute -top-16 -end-16 w-56 h-56 bg-lime/10 rotate-45 rounded-[2rem]" />
      <div className="relative space-y-3 min-w-0">
        <b className="flex items-center gap-2 text-lime font-display text-lg"><Icon n="share" s={20} />رابطك الخاص</b>
        <p className="text-white/70 text-sm leading-6">شاركه مع عملائك: يتصفحون الكتالوج، وعند إرسال الطلب تكون أنت المندوب المختار تلقائيًا ويصلك الطلب على واتساب.</p>
        <code dir="ltr" className="block text-xs bg-white/10 rounded-xl px-3 py-2.5 truncate">{link}</code>
        <div className="flex flex-wrap gap-2">
          <a href={share} target="_blank" rel="noopener noreferrer" className="btn btn-md bg-[#1FA855] text-white"><Icon n="whatsapp" s={18} />مشاركة واتساب</a>
          <CopyLink url={link} label="نسخ الرابط" done="تم نسخ رابطك" className="btn btn-md btn-lime" />
        </div>
      </div>
      <div className="relative bg-white rounded-2xl p-3 w-36 md:w-44 justify-self-center"><span className="block [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: qr }} /><small className="block text-center text-[11px] text-steel mt-1.5">امسح لفتح رابطك</small></div>
    </section>
    <Card title="آخر الطلبات" action={<Link href="/rep/orders" className="text-sm font-bold text-steel hover:text-ink">عرض الكل</Link>} pad={false}>
      {recent.length ? <div className="divide-y divide-line">{recent.map((o) => (<Link key={o.id} href={`/rep/orders?q=${o.number}`} className="flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-soft/60">
        <span className="min-w-0 flex-1"><b className="text-sm" dir="ltr">{o.number}</b> <span className="text-sm">· {o.customer.name}</span><small className="block text-xs text-steel">{o.createdAt.toLocaleDateString("ar-SA", { dateStyle: "medium" })}</small></span>
        <b className="text-sm">{o.total == null ? "—" : `${money(o.total)} ر.س`}</b><Badge cls={STATUS_CLS[o.status]}>{STATUS_AR[o.status]}</Badge></Link>))}</div>
        : <p className="text-sm text-steel text-center py-10 px-4">لا توجد طلبات بعد. شارك رابطك مع عملائك لتبدأ.</p>}
    </Card>
  </div>);
}
