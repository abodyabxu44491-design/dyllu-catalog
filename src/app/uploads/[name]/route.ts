// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import { TYPES, bucket } from "@/lib/storage";
const CACHE = "public, max-age=31536000, immutable";
// Files live in R2; rows still in the old Upload table are served until they are moved
export async function GET(_: Request, props: { params: Promise<{ name: string }> }) {
  const { name } = await props.params;
  if (!/^[\w-]{4,64}\.(jpg|png|webp|gif|pdf)$/.test(name)) return new Response("Not found", { status: 404 });
  const headers = (type: string, size?: number) => ({
    "Content-Type": type,
    ...(size != null && { "Content-Length": String(size) }),
    "Cache-Control": CACHE,
    "CDN-Cache-Control": CACHE,
    "X-Content-Type-Options": "nosniff",
  });
  const obj = await bucket().get(name);
  if (obj)
    return new Response(obj.body, {
      headers: headers(obj.httpMetadata?.contentType || TYPES[name.slice(name.lastIndexOf("."))], obj.size),
    });
  const f = await db.upload.findUnique({ where: { name } });
  if (f) return new Response(new Uint8Array(f.data), { headers: headers(f.type, f.size) });
  return new Response("Not found", { status: 404 });
}
