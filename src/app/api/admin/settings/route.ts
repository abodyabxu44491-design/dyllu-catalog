import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { isPhone, normalizePhone } from "@/lib/phone";
import { englishFor } from "@/lib/translate";
const PHONES = ["whatsapp.number", "contact.phone"], NOT_PAIRS = ["price.hiddenLabel", "currency"];
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const b = Object.fromEntries(Object.entries((await req.json()) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]));
  // الأرقام تُحفظ بصيغة دولية موحّدة مهما كُتبت (05... أو +966... أو أرقام عربية)
  for (const k of PHONES) if (b[k] && isPhone(b[k])) b[k] = normalizePhone(b[k]);
  // كل نص عربي (.ar) نسخته الإنجليزية (.en) تُولَّد تلقائيًا، ولا يُعاد ترجمة ما لم يتغير
  for (const k of Object.keys(b)) if (k.endsWith(".en") && !NOT_PAIRS.some((x) => k.startsWith(x))) delete b[k];
  const arKeys = Object.keys(b).filter((k) => k.endsWith(".ar") && !NOT_PAIRS.some((x) => k.startsWith(x)));
  const prev = Object.fromEntries((await db.setting.findMany({ where: { key: { in: arKeys.flatMap((k) => [k, `${k.slice(0, -3)}.en`]) } } })).map((x) => [x.key, x.value]));
  const en = await englishFor(arKeys.map((k) => ({ ar: b[k], prevAr: prev[k], prevEn: prev[`${k.slice(0, -3)}.en`] })));
  arKeys.forEach((k, i) => { b[`${k.slice(0, -3)}.en`] = en[i]; });
  await db.$transaction(Object.entries(b).map(([key, value]) => db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  return NextResponse.json({ ok: true, settings: b });
}
