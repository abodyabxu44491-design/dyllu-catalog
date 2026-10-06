import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";
export async function POST(req: Request) {
  try { const f = (await req.formData()).get("file"); return NextResponse.json({ url: await saveUpload(f as File) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
