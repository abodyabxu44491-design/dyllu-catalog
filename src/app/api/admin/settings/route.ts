import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { isPhone, normalizePhone } from "@/lib/phone";
import { translate } from "@/lib/translate";
const PHONES = ["whatsapp.number", "contact.phone"], NOT_PAIRS = ["price.hiddenLabel", "currency"];
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const b = Object.fromEntries(Object.entries((await req.json()) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]));
  // الأرقام تُحفظ بصيغة دولية موحّدة مهما كُتبت (05... أو +966... أو أرقام عربية)
  for (const k of PHONES) if (b[k] && isPhone(b[k])) b[k] = normalizePhone(b[k]);
  // نصوص لها نسخة إنجليزية فارغة تُترجم تلقائيًا من العربية
  const missing = Object.fromEntries(Object.keys(b).filter((k) => k.endsWith(".ar") && !NOT_PAIRS.some((x) => k.startsWith(x)) && `${k.slice(0, -3)}.en` in b && !b[`${k.slice(0, -3)}.en`].trim() && b[k].trim()).map((k) => [`${k.slice(0, -3)}.en`, b[k]]));
  Object.assign(b, await translate(missing, "en"));
  await db.$transaction(Object.entries(b).map(([key, value]) => db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  return NextResponse.json({ ok: true, settings: b });
}
