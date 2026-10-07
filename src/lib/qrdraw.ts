import QRCode from "qrcode";
// رسم QR أنيق: وحدات بحواف ناعمة، مربعات زوايا مدوّرة قليلًا، وشعار في المنتصف (تصحيح أخطاء H يتحمّل تغطية حتى ~30%).
// المقاسات (D و F) اختُبرت بقارئين مختلفين (OpenCV و jsQR) على أحجام 300–1200px: التدوير الزائد يفشل المسح.
// الألوان داكنة على فاتح دائمًا لضمان المسح بكل الكاميرات.
export type QrStyle = { dark?: string; light?: string; logo?: HTMLImageElement | null; quiet?: number };
const INK = "#2B2D2F", D = { size: 0.96, r: 0.22 }, F = [0.5, 0.35, 0.3];
function matrix(text: string) {
  const q = QRCode.create(text, { errorCorrectionLevel: "H" }), n = q.modules.size, d = q.modules.data;
  return { n, on: (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && !!d[r * n + c] };
}
const inFinder = (r: number, c: number, n: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
const inLogo = (r: number, c: number, n: number) => { const a = Math.floor(n * 0.36), b = n - a; return r >= a && r < b && c >= a && c < b; };
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
// يرسم الرمز داخل مربع (x, y, size) على canvas
export function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, st: QrStyle = {}) {
  const { n, on } = matrix(text), quiet = st.quiet ?? 2, cell = size / (n + quiet * 2), ox = x + quiet * cell, oy = y + quiet * cell, dark = st.dark ?? INK;
  ctx.save(); ctx.fillStyle = st.light ?? "#fff"; rr(ctx, x, y, size, size, cell * 2.2);
  ctx.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (on(r, c) && !inFinder(r, c, n) && !(st.logo && inLogo(r, c, n))) rr(ctx, ox + c * cell + cell * (1 - D.size) / 2, oy + r * cell + cell * (1 - D.size) / 2, cell * D.size, cell * D.size, cell * D.r);
  for (const [fr, fc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const fx = ox + fc * cell, fy = oy + fr * cell;
    ctx.fillStyle = dark; rr(ctx, fx, fy, cell * 7, cell * 7, cell * F[0]);
    ctx.fillStyle = st.light ?? "#fff"; rr(ctx, fx + cell, fy + cell, cell * 5, cell * 5, cell * F[1]);
    ctx.fillStyle = dark; rr(ctx, fx + cell * 2, fy + cell * 2, cell * 3, cell * 3, cell * F[2]);
  }
  if (st.logo) {
    const a = Math.floor(n * 0.36), w = (n - 2 * a) * cell, lx = ox + a * cell, ly = oy + a * cell;
    ctx.fillStyle = st.light ?? "#fff"; rr(ctx, lx, ly, w, w, cell * 1.6);
    const pad = w * 0.1, iw = st.logo.naturalWidth, ih = st.logo.naturalHeight, k = Math.min((w - pad * 2) / iw, (w - pad * 2) / ih);
    ctx.drawImage(st.logo, lx + (w - iw * k) / 2, ly + (w - ih * k) / 2, iw * k, ih * k);
  }
  ctx.restore();
}
// نسخة SVG للمصمم (بدون الشعار الداخلي حتى يضعه المصمم بنفسه إن رغب)
export function qrSvg(text: string, size = 1024, dark = INK) {
  const { n, on } = matrix(text), quiet = 2, cell = size / (n + quiet * 2), o = quiet * cell, f = (v: number) => +v.toFixed(2);
  const parts: string[] = [`<rect width="${size}" height="${size}" rx="${f(cell * 2.2)}" fill="#fff"/>`];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (on(r, c) && !inFinder(r, c, n)) parts.push(`<rect x="${f(o + c * cell + cell * (1 - D.size) / 2)}" y="${f(o + r * cell + cell * (1 - D.size) / 2)}" width="${f(cell * D.size)}" height="${f(cell * D.size)}" rx="${f(cell * D.r)}"/>`);
  for (const [fr, fc] of [[0, 0], [0, n - 7], [n - 7, 0]]) { const x = o + fc * cell, y = o + fr * cell; parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(cell * 7)}" height="${f(cell * 7)}" rx="${f(cell * F[0])}"/><rect x="${f(x + cell)}" y="${f(y + cell)}" width="${f(cell * 5)}" height="${f(cell * 5)}" rx="${f(cell * F[1])}" fill="#fff"/><rect x="${f(x + cell * 2)}" y="${f(y + cell * 2)}" width="${f(cell * 3)}" height="${f(cell * 3)}" rx="${f(cell * F[2])}"/>`); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="${dark}">${parts.join("")}</svg>`;
}
export const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
