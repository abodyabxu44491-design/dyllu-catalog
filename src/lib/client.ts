// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
const read = async (r: Response) => {
  try {
    return await r.json();
  } catch {
    return {};
  }
};
async function shrink(f: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.5e6 || typeof createImageBitmap !== "function") return f;
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" } as ImageBitmapOptions),
      k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.9));
    return blob && blob.size < f.size ? new File([blob], f.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }) : f;
  } catch {
    return f;
  }
}
export async function uploadFile(file: File): Promise<string> {
  const f = await shrink(file);
  if (f.size > 4.4e6)
    throw new Error(f.type === "application/pdf" ? "ملف PDF كبير، الحد الأقصى 4MB. اضغطه ثم ارفعه" : "الصورة كبيرة جدًا، جرّب صورة أخرى");
  const fd = new FormData();
  fd.append("file", f);
  let r: Response;
  try {
    r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  } catch {
    throw new Error("تعذر الاتصال بالخادم");
  }
  const d = await read(r);
  if (!r.ok || !d.url) throw new Error(d.error || "فشل رفع الملف");
  return d.url;
}
export async function post(url: string, body: unknown, method = "POST") {
  try {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, data: await read(r) };
  } catch {
    return { ok: false, data: { error: "تعذر الاتصال بالخادم" } };
  }
}
