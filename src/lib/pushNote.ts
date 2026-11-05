// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// The part of a "saved" message that tells the admin what happened with the automatic notification
export type PushResult = { total: number; scheduled: boolean } | null | undefined;
export function pushNote(p: PushResult) {
  if (!p) return "";
  if (p.scheduled) return "، وسيصل الإشعار للعملاء وقت بدايته";
  if (!p.total) return "، ولا يوجد بعد أجهزة فعّلت الإشعارات";
  return `، وأُرسل إشعار إلى ${p.total} جهاز`;
}
