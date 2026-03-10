/**
 * Sessione firmata per protezione password.
 * Cookie: filo_session = base64url(payload).base64url(hmac)
 * Se PROTECTION_PASSWORD non è impostata, la protezione è disattivata (utile in locale).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'filo_session';
const COOKIE_MAX_AGE_SEC = 24 * 60 * 60; // 24 ore
const COOKIE_OPTIONS = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=' + COOKIE_MAX_AGE_SEC;

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Buffer | null {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
    return Buffer.from(padded, 'base64');
  } catch {
    return null;
  }
}

function getSecret(): string | undefined {
  return process.env.PROTECTION_PASSWORD?.trim() || undefined;
}

/** Crea il valore del cookie di sessione (payload firmato). */
export function createSessionCookie(): { value: string; maxAge: number } | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + COOKIE_MAX_AGE_SEC * 1000;
  const payload = JSON.stringify({ exp });
  const payloadB64 = base64urlEncode(Buffer.from(payload, 'utf8'));
  const sig = createHmac('sha256', secret).update(payloadB64).digest();
  const sigB64 = base64urlEncode(sig);
  return { value: `${payloadB64}.${sigB64}`, maxAge: COOKIE_MAX_AGE_SEC };
}

/** Verifica il cookie e restituisce true se valido. */
export function verifySessionCookie(cookieValue: string | undefined): boolean {
  const secret = getSecret();
  if (!secret) return true; // protezione disattivata
  if (!cookieValue || !cookieValue.includes('.')) return false;
  const [payloadB64, sigB64] = cookieValue.split('.');
  const sig = base64urlDecode(sigB64);
  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest();
  if (!sig || sig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(sig, expectedSig)) return false;
  const payloadBuf = base64urlDecode(payloadB64);
  if (!payloadBuf) return false;
  try {
    const payload = JSON.parse(payloadBuf.toString('utf8')) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** Legge il cookie dalla request. */
export function getSessionCookieFromRequest(req: VercelRequest): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const match = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE_NAME + '='));
  if (!match) return undefined;
  return match.slice(COOKIE_NAME.length + 1).trim();
}

/**
 * Se la protezione è attiva e il cookie non è valido, invia 401 e restituisce false.
 * Altrimenti restituisce true (procedi).
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!getSecret()) return true;
  const cookie = getSessionCookieFromRequest(req);
  if (verifySessionCookie(cookie)) return true;
  res.setHeader('Content-Type', 'application/json');
  res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  return false;
}

export { COOKIE_NAME, COOKIE_OPTIONS };
