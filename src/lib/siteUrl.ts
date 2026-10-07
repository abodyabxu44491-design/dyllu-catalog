import { headers } from "next/headers";
// رابط الموقع الفعلي من الطلب نفسه (الدومين الذي فُتح عليه الموقع، مثل dyllu.onrender.com أو دومينك الخاص)،
// فتتطابق روابط QR والفواتير والمشاركة مع رابط الكتالوج دائمًا. NEXT_PUBLIC_SITE_URL احتياطي فقط (خارج طلب HTTP)
export function siteUrl() {
  try {
    const h = headers(), host = (h.get("x-forwarded-host") ?? h.get("host"))?.split(",")[0].trim();
    if (host) {
      const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host);
      const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (local ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch { /* خارج طلب HTTP */ }
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
