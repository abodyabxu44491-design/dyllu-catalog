// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "./db";
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};
async function optimize(buf: Buffer, type: string): Promise<{ buf: Buffer; type: string; ext: string }> {
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return { buf, type, ext: EXT[type] };
  const sharp = (await import("sharp")).default;
  try {
    const out = await sharp(buf, { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    return { buf: out, type: "image/webp", ext: ".webp" };
  } catch {
    throw new Error("تعذر قراءة الصورة، قد تكون تالفة. جرّب صورة أخرى");
  }
}
export const externalStorage = () => !!(process.env.S3_BUCKET && process.env.S3_PUBLIC_URL);
export const publicUrl = (name: string) => `${process.env.S3_PUBLIC_URL!.replace(/\/+$/, "")}/${name}`;
// S3-compatible storage (Cloudflare R2, AWS S3, MinIO). Path-style addressing and on-demand checksums keep R2 compatible.
export async function putObject(name: string, body: Buffer | Uint8Array, type: string) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const c = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
  });
  await c.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: name,
      Body: body,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrl(name);
}
export async function saveUpload(file: File) {
  if (!EXT[file?.type] || file.size > (file.type === "application/pdf" ? 4.4e6 : 15e6))
    throw new Error("ملف غير مسموح (صور JPG/PNG/WEBP/GIF حتى 15MB، أو PDF حتى 4MB)");
  const o = await optimize(Buffer.from(await file.arrayBuffer()), file.type);
  const name = `${crypto.randomUUID()}${o.ext}`;
  if (externalStorage()) return putObject(name, o.buf, o.type);
  await db.upload.create({ data: { name, type: o.type, size: o.buf.length, data: o.buf } });
  return `/uploads/${name}`;
}
