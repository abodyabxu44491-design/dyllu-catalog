// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
const enc = new TextEncoder();
export const sessionSecret = () =>
  process.env.ADMIN_SESSION_SECRET?.trim() || (process.env.DATABASE_URL ? `dyllu-session:${process.env.DATABASE_URL}` : "");
async function hmac(data: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(sessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data))))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function signToken(kind: string, id: number, days = 30) {
  const p = `${kind}.${id}.${Date.now() + days * 864e5}`;
  return `${p}.${await hmac(p)}`;
}
export async function verifyToken(kind: string, t?: string) {
  if (!t || !sessionSecret()) return null;
  const [k, id, exp, sig] = t.split(".");
  return k === kind && Number(exp) > Date.now() && sig === (await hmac(`${k}.${id}.${exp}`)) ? Number(id) : null;
}
export const SESSION_COOKIE = "dyllu_admin";
export async function signSession(userId: number, ver: number) {
  const p = `${userId}.${ver}.${Date.now() + 7 * 864e5}`;
  return `${p}.${await hmac(p)}`;
}
export async function verifySession(t?: string) {
  if (!t || !sessionSecret()) return null;
  const [id, ver, exp, sig] = t.split(".");
  return Number(exp) > Date.now() && sig === (await hmac(`${id}.${ver}.${exp}`)) ? { id: Number(id), ver: Number(ver) } : null;
}

export const REP_COOKIE = "dyllu_rep";
export async function signRepSession(repId: number, ver: number) {
  const p = `r.${repId}.${ver}.${Date.now() + 30 * 864e5}`;
  return `${p}.${await hmac(p)}`;
}
export async function verifyRepSession(t?: string) {
  if (!t || !sessionSecret()) return null;
  const [k, id, ver, exp, sig] = t.split(".");
  return k === "r" && Number(exp) > Date.now() && sig === (await hmac(`${k}.${id}.${ver}.${exp}`))
    ? { id: Number(id), ver: Number(ver) }
    : null;
}

export const TRADE_COOKIE = "dyllu_trade";
// Private link key for a shop in the DYLLU Trade app: opening the link is the login.
// It never expires on its own; disabling the shop or issuing a new link (sessionVersion + 1) kills it.
export async function tradeKey(codeId: number, ver: number) {
  return `${codeId}.${ver}.${(await hmac(`tl.${codeId}.${ver}`)).slice(0, 32)}`;
}
export async function verifyTradeKey(k?: string | null) {
  if (!k || !sessionSecret()) return null;
  const [id, ver, sig] = k.split(".");
  if (!/^\d+$/.test(id ?? "") || !/^\d+$/.test(ver ?? "") || !sig) return null;
  return sig === (await hmac(`tl.${id}.${ver}`)).slice(0, 32) ? { id: Number(id), ver: Number(ver) } : null;
}
