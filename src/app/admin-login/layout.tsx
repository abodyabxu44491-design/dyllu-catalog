// صفحة دخول الإدارة تنتمي لتطبيق لوحة التحكم المثبّت
export const metadata = { title: "دخول لوحة التحكم", robots: { index: false }, manifest: "/admin-manifest.webmanifest", appleWebApp: { capable: true, title: "DYLLU Admin" } };
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) { return children; }
