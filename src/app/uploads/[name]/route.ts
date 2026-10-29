// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { externalStorage, publicUrl } from "@/lib/storage";
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};
export async function GET(_: Request, props: { params: Promise<{ name: string }> }) {
  const params = await props.params;
  const name = params.name;
  if (!/^[\w-]{8,64}\.(jpg|png|webp|gif|pdf)$/.test(name)) return new Response("Not found", { status: 404 });
  const head = (type: string, size: number) => ({
    "Content-Type": type,
    "Content-Length": String(size),
    "Cache-Control": "public, max-age=31536000, immutable",
    // Let the hosting CDN keep a copy, so each image is read from the database once instead of on every visit
    "CDN-Cache-Control": "public, max-age=31536000, immutable",
    "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  const f = await db.upload.findUnique({ where: { name } });
  if (f) return new Response(new Uint8Array(f.data), { headers: head(f.type, f.size) });
  try {
    const buf = await readFile(path.join(process.cwd(), "public/uploads", name));
    return new Response(new Uint8Array(buf), { headers: head(TYPES[path.extname(name)], buf.length) });
  } catch {}
  // Moved to external storage: any old link still in use is sent to the new address
  if (externalStorage())
    return new Response(null, {
      status: 308,
      headers: {
        Location: publicUrl(name),
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  return new Response("Not found", { status: 404 });
}
