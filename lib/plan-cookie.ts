// Edge-friendly plan cookie utilities using Web Crypto (HMAC-SHA256 base64url)
// Cookie name must be __Host-plan (Secure, HttpOnly, Path=/)

export const PLAN_COOKIE_NAME = "__Host-plan";

export type PlanPayload = {
  plan: "free" | "pro" | "admin";
  uid: string;
  exp: number; // unix seconds
};

function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  // btoa is available in Edge/Browser/Node 18
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecodeToUint8Array(b64url: string): Uint8Array {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256Base64Url(messageB64Url: string, secret: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(messageB64Url);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return base64urlEncode(sig);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function signPlanCookie(payload: PlanPayload, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const b64 = base64urlEncode(new TextEncoder().encode(json));
  const sig = await hmacSha256Base64Url(b64, secret);
  return `${b64}.${sig}`;
}

export async function verifyPlanCookie(raw: string | undefined, secret: string): Promise<PlanPayload | null> {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expect = await hmacSha256Base64Url(b64, secret);
  if (!timingSafeEqualStr(sig, expect)) return null;
  try {
    const payloadJson = new TextDecoder().decode(base64urlDecodeToUint8Array(b64));
    const payload = JSON.parse(payloadJson) as PlanPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}


