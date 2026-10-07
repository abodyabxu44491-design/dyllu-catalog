import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BottomNav from "@/components/BottomNav";
// إطار المتجر: الهيدر والتذييل وشريط الجوال السفلي لكل صفحات العميل
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main id="main" className="min-h-[60vh]">{children}</main><SiteFooter /><BottomNav /></>);
}
