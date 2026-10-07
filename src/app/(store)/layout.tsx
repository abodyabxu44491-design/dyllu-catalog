import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/lang";
import { isPhone, waHref } from "@/lib/phone";
// إطار المتجر: الهيدر والتذييل وشريط الجوال السفلي وزر واتساب العائم لكل صفحات العميل
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings(), wa = s["whatsapp.number"], en = getLang() === "en";
  return (<><SiteHeader /><main id="main" className="min-h-[60vh]">{children}</main><SiteFooter /><BottomNav />
    {s["whatsapp.float"] === "1" && isPhone(wa) && <WhatsAppFloat href={waHref(wa, en ? "Hello DYLLU, I have a question" : "السلام عليكم، عندي استفسار")} />}</>);
}
