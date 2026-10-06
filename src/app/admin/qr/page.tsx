import QRCode from "qrcode";
export const dynamic = "force-dynamic";
// ?src=riyadh يضيف مصدرًا للـ QR فيظهر في الطلبات. الرابط الأساسي ثابت ولا يتغير بتغير المنتجات.
export default async function QR({ searchParams }: { searchParams: { src?: string } }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", src = searchParams.src;
  const url = src ? `${base}/?src=${encodeURIComponent(src)}` : base;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 320 });
  return (<div className="space-y-3">
    <form className="flex gap-2"><input name="src" defaultValue={src} dir="ltr" placeholder="اسم المحل (اختياري) مثل riyadh" className="border rounded-lg p-2 flex-1 bg-white" /><button className="bg-lime font-bold rounded-lg px-4">توليد</button></form>
    <div className="bg-white p-4 inline-block" dangerouslySetInnerHTML={{ __html: svg }} />
    <div dir="ltr" className="text-sm break-all">{url}</div>
    <a download={`dyllu-qr-${src ?? "main"}.svg`} href={"data:image/svg+xml;utf8," + encodeURIComponent(svg)} className="underline">تحميل SVG</a></div>);
}
