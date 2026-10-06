// أدوات المتصفح للوحة التحكم: ترجع دائمًا نتيجة منظّمة حتى لو فشل الاتصال أو رجع السيرفر ردًا غير JSON
const read = async (r: Response) => { try { return await r.json(); } catch { return {}; } };
export async function uploadFile(f: File): Promise<string> {
  const fd = new FormData(); fd.append("file", f);
  let r: Response; try { r = await fetch("/api/admin/upload", { method: "POST", body: fd }); } catch { throw new Error("تعذر الاتصال بالخادم"); }
  const d = await read(r); if (!r.ok || !d.url) throw new Error(d.error || "فشل رفع الملف");
  return d.url;
}
export async function post(url: string, body: unknown, method = "POST") {
  try { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { ok: r.ok, data: await read(r) }; }
  catch { return { ok: false, data: { error: "تعذر الاتصال بالخادم" } }; }
}
