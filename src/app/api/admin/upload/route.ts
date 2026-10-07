import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { saveUpload } from "@/lib/storage";
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { const f = (await req.formData()).get("file"); return NextResponse.json({ url: await saveUpload(f as File) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
