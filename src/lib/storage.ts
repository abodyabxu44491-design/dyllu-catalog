// طبقة التخزين: S3/R2 إن ضُبطت متغيراته، وإلا قاعدة البيانات (جدول Upload) وتُعرض من /uploads/<name>.
// لا نحفظ في public/uploads: Next.js في الإنتاج لا يعرض ملفات أُضيفت بعد البناء، وقرص Render يُمسح مع كل نشر.
import { db } from "./db";
const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "application/pdf": ".pdf" };
// ضغط الصور قبل الحفظ: تصحيح اتجاه صور الجوال، تصغير لحد أقصى 1600px، وتحويل إلى WebP (يحافظ على الشفافية).
// صورة جوال 5MB تصبح عادة 100–250KB، فتفتح الصفحات بسرعة حتى على شبكة ضعيفة. GIF يبقى كما هو (قد يكون متحركًا).
async function optimize(buf: Buffer, type: string): Promise<{ buf: Buffer; type: string; ext: string }> {
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return { buf, type, ext: EXT[type] };
  const sharp = (await import("sharp")).default;
  try {
    const out = await sharp(buf, { failOn: "error" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    return { buf: out, type: "image/webp", ext: ".webp" };
  } catch { throw new Error("تعذر قراءة الصورة، قد تكون تالفة. جرّب صورة أخرى"); }
}
export async function saveUpload(file: File) {
  if (!EXT[file?.type] || file.size > (file.type === "application/pdf" ? 8e6 : 15e6)) throw new Error("ملف غير مسموح (صور JPG/PNG/WEBP/GIF حتى 15MB، أو PDF حتى 8MB)");
  // الامتداد يُحدد من نوع الملف المسموح، لا من اسمه، حتى لا يُحفظ ملف .html أو .svg
  const o = await optimize(Buffer.from(await file.arrayBuffer()), file.type);
  const name = `${crypto.randomUUID()}${o.ext}`;
  if (process.env.S3_BUCKET) { // تخزين سحابي (S3/R2): عيّن متغيرات S3_* في .env
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const c = new S3Client({ region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! } });
    await c.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: name, Body: o.buf, ContentType: o.type, CacheControl: "public, max-age=31536000, immutable" }));
    return `${process.env.S3_PUBLIC_URL}/${name}`;
  }
  await db.upload.create({ data: { name, type: o.type, size: o.buf.length, data: o.buf } });
  return `/uploads/${name}`;
}
