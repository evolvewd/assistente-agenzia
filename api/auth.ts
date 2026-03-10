import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBody } from './parseBody';
import {
  createSessionCookie,
  verifySessionCookie,
  getSessionCookieFromRequest,
  COOKIE_NAME,
  COOKIE_OPTIONS,
} from '../lib/cookieAuth';

function getSecret(): string | undefined {
  return process.env.PROTECTION_PASSWORD?.trim() || undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Verifica sessione: 200 se ok, 401 se non autenticato
    const secret = getSecret();
    if (!secret) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ ok: true, protected: false });
    }
    const cookie = getSessionCookieFromRequest(req);
    if (verifySessionCookie(cookie)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ ok: true, protected: true });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  }

  if (req.method === 'POST') {
    const secret = getSecret();
    if (!secret) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ ok: true });
    }
    const body = await getBody(req);
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    if (password !== secret) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Password non corretta', code: 'AUTH_FAILED' });
    }
    const session = createSessionCookie();
    if (!session) {
      return res.status(200).json({ ok: true });
    }
    const isProd = process.env.VERCEL_ENV === 'production';
    const secure = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${session.value}; ${COOKIE_OPTIONS}${secure}`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
}
