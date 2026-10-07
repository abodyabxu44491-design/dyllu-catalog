import QRCode from "qrcode";
import { db } from "@/lib/db";
import { brand } from "@/config/brand";
import { Card, PageHead } from "@/components/admin/ui";
import PrintButton from "@/components/PrintButton";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
// ?src=riyadh يضيف مصدرًا للـ QR فيظهر في الطلبات. الرابط الأساسي ثابت ولا يتغير بتغير المنتجات.
export default async function QR({ searchParams }: { searchParams: { src?: string } }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", src = searchParams.src?.trim().replace(/[^\w؀-ۿ-]/g, "-").slice(0, 40) || undefined;
  const url = src ? `${base}/?src=${encodeURIComponent(src)}` : base, opt = { margin: 1, color: { dark: brand.ink, light: "#ffffff" }, errorCorrectionLevel: "M" as const };
  const [svg, png, used] = await Promise.all([QRCode.toString(url, { ...opt, type: "svg", width: 320 }), QRCode.toDataURL(url, { ...opt, width: 1200 }), db.order.groupBy({ by: ["source"], where: { source: { not: null } }, _count: true, orderBy: { _count: { source: "desc" } }, take: 8 })]);
  const name = `dyllu-qr-${src ?? "main"}`;
  return (<div className="max-w-5xl">
    <PageHead title="رموز QR" desc="اطبع الرمز وضعه في المحل أو على الكتالوج الورقي. أضف اسم المحل لتعرف من أين جاء كل طلب (يظهر في الطلبات ولوحة المعلومات)." />
    <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
      <div className="space-y-4 no-print">
        <Card title="توليد رمز"><form className="flex flex-col sm:flex-row gap-2"><input name="src" defaultValue={src} dir="ltr" placeholder="اسم المحل (اختياري) مثل riyadh" className="field flex-1" /><button className="btn btn-lg btn-lime"><Icon n="qr" s={18} />توليد</button></form>
          {used.length > 0 && <div className="mt-4"><small className="block text-xs text-steel font-bold mb-2">مصادر مستخدمة سابقًا</small><div className="flex flex-wrap gap-2">{used.map((u) => <a key={u.source} href={`/admin/qr?src=${encodeURIComponent(u.source!)}`} className="chip chip-off h-8 text-xs" dir="ltr">{u.source} <small className="opacity-60">{u._count}</small></a>)}</div></div>}</Card>
        <Card title="الرابط"><code dir="ltr" className="block text-sm break-all bg-soft rounded-xl p-3">{url}</code>
          <div className="flex flex-wrap gap-2 mt-3"><a download={`${name}.png`} href={png} className="btn btn-md btn-dark"><Icon n="download" s={18} />تحميل PNG (للطباعة)</a><a download={`${name}.svg`} href={"data:image/svg+xml;utf8," + encodeURIComponent(svg)} className="btn btn-md btn-ghost"><Icon n="download" s={18} />تحميل SVG (للمصمم)</a><div className="w-full sm:w-auto"><PrintButton /></div></div></Card>
      </div>
      {/* بطاقة جاهزة للطباعة بهوية DYLLU */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-card border border-line text-center">
        <div className="dy-stripe" /><div className="p-6 space-y-4">
          <img src="/brand/logo-wordmark.png" alt="DYLLU" className="h-12 w-auto mx-auto" />
          <div className="mx-auto w-64 [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
          <div><b className="block font-display text-xl">امسح لتصفح الكتالوج</b><small className="text-steel" dir="ltr">Scan to browse our catalog</small></div></div>
        <div className="bg-lime py-2 shadow-[0_-3px_0_theme(colors.accent)]"><b className="text-steel text-xs" dir="ltr">DYLLU, Discover your Power</b></div>
      </div>
    </div>
  </div>);
}
