import "./globals.css";
import SourceCapture from "@/components/SourceCapture";
import { getLang } from "@/lib/lang";
export const metadata = { title: "DYLLU" };
// تثبيت الشاشة على الجوال: بدون تكبير تلقائي عند الضغط على الحقول ولا تغيّر في المقياس أثناء التمرير
export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover" as const };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const l = getLang();
  return (<html lang={l} dir={l === "en" ? "ltr" : "rtl"}><body>{children}<SourceCapture /></body></html>);
}
