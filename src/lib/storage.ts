// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getCloudflareContext } from "@opennextjs/cloudflare";

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};
export const TYPES: Record<string, string> = Object.fromEntries(Object.entries(EXT).map(([t, e]) => [e, t]));
export const bucket = () => getCloudflareContext().env.BUCKET;
// Optional public address of the R2 bucket (e.g. https://img.dyllusa.com). Without it files are served at /uploads/<name>.
const publicBase = () => (process.env.STORAGE_PUBLIC_URL || "").replace(/\/+$/, "");
export const fileUrl = (name: string) => (publicBase() ? `${publicBase()}/${name}` : `/uploads/${name}`);
export const hasPublicBase = () => !!publicBase();

export async function putObject(name: string, body: ArrayBuffer | Uint8Array, type: string) {
  await bucket().put(name, body, {
    httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return fileUrl(name);
}
export async function saveUpload(file: File) {
  if (!EXT[file?.type] || file.size > (file.type === "application/pdf" ? 4.4e6 : 15e6))
    throw new Error("ملف غير مسموح (صور JPG/PNG/WEBP/GIF حتى 15MB، أو PDF حتى 4MB)");
  const name = `${crypto.randomUUID()}${EXT[file.type]}`;
  return putObject(name, await file.arrayBuffer(), file.type);
}
