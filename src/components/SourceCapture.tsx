"use client";
import { useEffect } from "react";
// مصدر رمز QR (?src=code) ورابط المندوب (?rep=ID): يُحفظ لإرفاقه بالطلب، ويُسجَّل المسح مرة لكل جلسة، ثم يُزال من شريط العنوان كي لا يُنسخ مع الروابط
export default function SourceCapture() {
  useEffect(() => {
    const u = new URL(location.href), s = u.searchParams.get("src"), rep = u.searchParams.get("rep");
    // رابط المندوب الخاص (?rep=ID): يُحفظ ليظهر مندوبه أولًا عند إتمام الطلب
    if (rep && /^\d{1,9}$/.test(rep)) { try { localStorage.setItem("dyllu-rep", rep); } catch { /* لا شيء */ } u.searchParams.delete("rep"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); }
    if (!s) return;
    try { localStorage.setItem("dyllu-src", s); } catch { /* لا شيء */ }
    try { if (sessionStorage.getItem("dyllu-scan") !== s) { sessionStorage.setItem("dyllu-scan", s); fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src: s }), keepalive: true }).catch(() => {}); } } catch { /* لا شيء */ }
    u.searchParams.delete("src"); history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  }, []);
  return null;
}
