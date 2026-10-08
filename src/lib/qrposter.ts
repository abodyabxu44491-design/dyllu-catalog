// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { drawQr, loadImg } from "./qrdraw";
export type PosterFormat = "a5" | "square" | "card";
export const FORMATS: { id: PosterFormat; ar: string; size: string; w: number; h: number }[] = [
  { id: "a5", ar: "ملصق A5", size: "14.8 × 21 سم", w: 1748, h: 2480 },
  { id: "square", ar: "ملصق مربع", size: "12.7 × 12.7 سم", w: 1500, h: 1500 },
  { id: "card", ar: "بطاقة صغيرة", size: "8.9 × 5.1 سم", w: 1050, h: 600 },
];
export type PosterText = { url: string; store?: string; headline: string; sub: string };
const C = { lime: "#D0DF00", accent: "#FF6900", ink: "#2B2D2F", steel: "#63666A", soft: "#F4F5F5" };
const AR = () => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue("--font-ard").trim());
const FONT = (px: number, w = "bold") => `${w} ${px}px ${AR() ? AR() + ", " : ""}Arial, Tahoma, sans-serif`;
let assets: Promise<{ badge: HTMLImageElement; mark: HTMLImageElement; markWhite: HTMLImageElement }> | null = null;
const load = () =>
  (assets ??= Promise.all([
    loadImg("/brand/logo-badge.png"),
    loadImg("/brand/logo-wordmark.png"),
    loadImg("/brand/logo-wordmark-white.png"),
  ]).then(([badge, mark, markWhite]) => ({ badge, mark, markWhite })));
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function img(ctx: CanvasRenderingContext2D, im: HTMLImageElement, cx: number, y: number, w: number) {
  const h = (im.naturalHeight / im.naturalWidth) * w;
  ctx.drawImage(im, cx - w / 2, y, w, h);
  return h;
}
function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  px: number,
  color: string,
  opt: { w?: string; align?: CanvasTextAlign; max?: number; dir?: CanvasDirection } = {},
) {
  ctx.font = FONT(px, opt.w);
  ctx.fillStyle = color;
  ctx.textAlign = opt.align ?? "center";
  ctx.direction = opt.dir ?? "rtl";
  ctx.textBaseline = "alphabetic";
  let size = px;
  while (opt.max && ctx.measureText(s).width > opt.max && size > 12) {
    size -= 2;
    ctx.font = FONT(size, opt.w);
  }
  ctx.fillText(s, x, y);
}
function corners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, len: number, t: number) {
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = t;
  ctx.lineCap = "round";
  for (const [px, py, dx, dy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(px, py + dy * len);
    ctx.lineTo(px, py);
    ctx.lineTo(px + dx * len, py);
    ctx.stroke();
  }
}
function stripe(ctx: CanvasRenderingContext2D, W: number, H: number, h: number, tagPx: number) {
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, H - h - h * 0.18, W, h * 0.18);
  ctx.fillStyle = C.lime;
  ctx.fillRect(0, H - h, W, h);
  text(ctx, "DYLLU, Discover your Power", W - h * 0.9, H - h * 0.32, tagPx, C.steel, { align: "right", dir: "ltr" });
}
export async function renderPoster(canvas: HTMLCanvasElement, f: PosterFormat, t: PosterText) {
  await Promise.all(["bold", "800", "900"].map((w) => document.fonts.load(FONT(40, w), "عربي").catch(() => null)));
  const { badge, mark, markWhite } = await load(),
    spec = FORMATS.find((x) => x.id === f)!,
    W = spec.w,
    H = spec.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const url = t.url.replace(/^https?:\/\//, "");
  if (f === "a5") {
    box(ctx, 0, 0, W, H, 0, "#fff");
    ctx.fillStyle = C.lime;
    ctx.fillRect(0, 0, W, 520);
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.beginPath();
    ctx.arc(W - 120, 60, 330, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(140, 520, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.lime;
    ctx.fillRect(0, 520, W, 2);
    img(ctx, markWhite, W / 2, 170, 660);
    text(ctx, t.headline, W / 2, 705, 100, C.ink, { max: W - 220 });
    text(ctx, t.sub, W / 2, 815, 58, C.steel, { w: "normal", max: W - 260 });
    box(ctx, 254, 900, 1240, 1240, 90, C.soft);
    corners(ctx, 214, 860, 1320, 1320, 150, 18);
    drawQr(ctx, t.url, 324, 970, 1100, { logo: badge, quiet: 1.4 });
    const label = t.store || "كتالوج DYLLU";
    ctx.font = FONT(64);
    const lw = Math.min(W - 300, ctx.measureText(label).width + 160);
    box(ctx, W / 2 - lw / 2, 2200, lw, 120, 60, C.ink);
    text(ctx, label, W / 2, 2282, 64, C.lime, { max: lw - 100 });
    text(ctx, url, W / 2, 2388, 40, C.steel, { w: "normal", dir: "ltr", max: W - 200 });
    stripe(ctx, W, H, 64, 34);
  } else if (f === "square") {
    box(ctx, 0, 0, W, H, 0, C.lime);
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.arc(W, 0, 420, 0, Math.PI * 2);
    ctx.fill();
    box(ctx, 110, 110, W - 220, H - 220, 90, "#fff");
    img(ctx, mark, W / 2, 180, 420);
    drawQr(ctx, t.url, 330, 360, 840, { logo: badge, quiet: 1.2 });
    corners(ctx, 310, 340, 880, 880, 110, 14);
    text(ctx, t.headline, W / 2, 1300, 70, C.ink, { max: W - 320 });
    if (t.store) text(ctx, t.store, W / 2, 1360, 40, C.steel, { w: "normal", max: W - 360 });
  } else {
    box(ctx, 0, 0, W, H, 0, "#fff");
    box(ctx, 40, 40, 470, 470, 40, C.soft);
    drawQr(ctx, t.url, 60, 60, 430, { logo: badge, quiet: 1 });
    const cx = W - 60;
    ctx.drawImage(mark, cx - 300, 56, 300, (mark.naturalHeight / mark.naturalWidth) * 300);
    text(ctx, t.headline, cx, 250, 44, C.ink, { align: "right", max: 470 });
    text(ctx, t.sub, cx, 310, 28, C.steel, { w: "normal", align: "right", max: 470 });
    if (t.store) {
      ctx.font = FONT(30);
      const lw = Math.min(470, ctx.measureText(t.store).width + 60);
      box(ctx, cx - lw, 360, lw, 60, 30, C.ink);
      text(ctx, t.store, cx - lw / 2, 401, 30, C.lime, { max: lw - 40 });
    }
    text(ctx, url, cx, 480, 20, C.steel, { w: "normal", align: "right", dir: "ltr", max: 470 });
    stripe(ctx, W, H, 34, 18);
  }
  return canvas;
}
