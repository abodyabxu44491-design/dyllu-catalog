import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function hashPassword(pw: string) { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(pw, s, 64).toString("hex")}`; }
export function checkPassword(pw: string, stored: string) {
  const [s, h] = stored.split(":"); const a = Buffer.from(h, "hex"), b = scryptSync(pw, s, 64); return a.length === b.length && timingSafeEqual(a, b);
}
