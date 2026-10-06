// طبقة التخزين: الآن محلي (public/uploads). للإنتاج استبدل هذه الدالة فقط بـ S3/R2 وأعد الرابط.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export async function saveUpload(file: File) {
  if (!/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.type) || file.size > 8e6) throw new Error("ملف غير مسموح (صور JPG/PNG/WEBP/GIF أو PDF فقط، حتى 8MB)");
  const name = `${crypto.randomUUID()}${path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "")}`, dir = path.join(process.cwd(), "public/uploads");
  if (process.env.S3_BUCKET) { // تخزين سحابي (S3/R2): عيّن متغيرات S3_* في .env
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const c = new S3Client({ region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! } });
    await c.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: name, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    return `${process.env.S3_PUBLIC_URL}/${name}`;
  }
  await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
