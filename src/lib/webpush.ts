// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Web Push (RFC 8291 payload encryption + RFC 8292 VAPID) with the Web Crypto API only,
// so it runs inside the Cloudflare Worker without any extra library.

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type Vapid = { publicKey: string; privateKey: string; subject: string }; // publicKey: base64url raw P-256 point, privateKey: base64url "d"

type Bytes = Uint8Array<ArrayBuffer>;
const enc = new TextEncoder();
export const b64u = {
  encode(b: ArrayBuffer | Uint8Array) {
    const a = b instanceof Uint8Array ? b : new Uint8Array(b);
    let s = "";
    for (const x of a) s += String.fromCharCode(x);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(s: string): Bytes {
    const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
    return Uint8Array.from(t, (c) => c.charCodeAt(0));
  },
};
const concat = (...parts: Uint8Array[]): Bytes => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) out.set(p, o), (o += p.length);
  return out;
};
const subtle = () => crypto.subtle;

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await subtle().importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await subtle().deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

// aes128gcm content coding for one record (RFC 8188 + RFC 8291)
export async function encryptPayload(target: Pick<PushTarget, "p256dh" | "auth">, payload: Bytes) {
  const uaPublic = b64u.decode(target.p256dh),
    authSecret = b64u.decode(target.auth);
  const local = (await subtle().generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPublic = new Uint8Array((await subtle().exportKey("raw", local.publicKey)) as ArrayBuffer);
  const uaKey = await subtle().importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await subtle().deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await subtle().importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv: nonce }, key, concat(payload, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

// One signed VAPID token per push service, reused for every message in a batch
const tokens = new Map<string, { jwt: string; exp: number }>();
let signer: { pub: string; key: CryptoKey } | null = null;
async function signingKey(v: Vapid) {
  if (signer?.pub === v.publicKey) return signer.key;
  const p = b64u.decode(v.publicKey);
  const jwk = { kty: "EC", crv: "P-256", d: v.privateKey, x: b64u.encode(p.slice(1, 33)), y: b64u.encode(p.slice(33, 65)), ext: true };
  const key = await subtle().importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  signer = { pub: v.publicKey, key };
  return key;
}
export async function vapidToken(endpoint: string, v: Vapid) {
  const aud = new URL(endpoint).origin,
    now = Math.floor(Date.now() / 1000),
    hit = tokens.get(aud);
  if (hit && hit.exp - now > 3600) return hit.jwt;
  const exp = now + 12 * 3600;
  const head = b64u.encode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u.encode(enc.encode(JSON.stringify({ aud, exp, sub: v.subject })));
  const sig = await subtle().sign({ name: "ECDSA", hash: "SHA-256" }, await signingKey(v), enc.encode(`${head}.${body}`));
  const jwt = `${head}.${body}.${b64u.encode(sig)}`;
  tokens.set(aud, { jwt, exp });
  return jwt;
}

// Push services that browsers use; anything else is refused so the site never posts to arbitrary hosts
const SERVICES = [/^fcm\.googleapis\.com$/, /\.push\.apple\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
export function isPushEndpoint(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && SERVICES.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
}

export type SendResult = { ok: boolean; gone: boolean; status: number };
export async function sendPush(target: PushTarget, message: unknown, v: Vapid, ttl = 4 * 24 * 3600): Promise<SendResult> {
  const body = await encryptPayload(target, enc.encode(JSON.stringify(message)));
  const r = await fetch(target.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${await vapidToken(target.endpoint, v)}, k=${v.publicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttl),
      Urgency: "normal",
    },
    body,
  }).catch(() => null);
  const status = r?.status ?? 0;
  return { ok: status >= 200 && status < 300, gone: status === 404 || status === 410, status };
}

// A new key pair for VAPID (used once, when the site has none yet)
export async function newVapidKeys() {
  const k = (await subtle().generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])) as CryptoKeyPair;
  const jwk = (await subtle().exportKey("jwk", k.privateKey)) as JsonWebKey;
  const pub = new Uint8Array((await subtle().exportKey("raw", k.publicKey)) as ArrayBuffer);
  return { publicKey: b64u.encode(pub), privateKey: jwk.d! };
}
