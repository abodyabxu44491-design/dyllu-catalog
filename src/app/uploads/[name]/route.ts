// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};
export async function GET(_: Request, { params }: { params: { name: string } }) {
  const name = params.name;
  if (!/^[\w-]{8,64}\.(jpg|png|webp|gif|pdf)$/.test(name)) return new Response("Not found", { status: 404 });
  const head = (type: string, size: number) => ({
    "Content-Type": type,
    "Content-Length": String(size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  const f = await db.upload.findUnique({ where: { name } });
  if (f) return new Response(new Uint8Array(f.data), { headers: head(f.type, f.size) });
  try {
    const buf = await readFile(path.join(process.cwd(), "public/uploads", name));
    return new Response(new Uint8Array(buf), { headers: head(TYPES[path.extname(name)], buf.length) });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
