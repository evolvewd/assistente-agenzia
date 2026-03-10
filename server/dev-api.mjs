/**
 * API locale per sviluppo: legge .env e .env.local, stessa logica delle serverless Vercel.
 * Esegui con: npm run dev (avvia anche Vite con proxy su /api).
 * Se PROTECTION_PASSWORD è impostata, è richiesta la login come in produzione.
 */
import 'dotenv/config';
import { config as loadEnvLocal } from 'dotenv';
import http from 'http';
import { createHmac, timingSafeEqual } from 'crypto';

loadEnvLocal({ path: '.env.local', override: true });

const PORT = 5172;
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';
const COOKIE_NAME = 'filo_session';
const COOKIE_MAX_AGE_SEC = 24 * 60 * 60;

function getProtectionPassword() {
  return process.env.PROTECTION_PASSWORD?.trim() || null;
}

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.length % 4 ? b64 + '='.repeat(4 - (b64.length % 4)) : b64;
    return Buffer.from(padded, 'base64');
  } catch {
    return null;
  }
}

function createSessionCookie() {
  const secret = getProtectionPassword();
  if (!secret) return null;
  const exp = Date.now() + COOKIE_MAX_AGE_SEC * 1000;
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify({ exp }), 'utf8'));
  const sig = createHmac('sha256', secret).update(payloadB64).digest();
  return payloadB64 + '.' + base64urlEncode(sig);
}

function verifySessionCookie(cookieValue) {
  const secret = getProtectionPassword();
  if (!secret) return true;
  if (!cookieValue || !cookieValue.includes('.')) return false;
  const [payloadB64, sigB64] = cookieValue.split('.');
  const sig = base64urlDecode(sigB64);
  const expected = createHmac('sha256', secret).update(payloadB64).digest();
  if (!sig || sig.length !== expected.length) return false;
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

function getSessionCookie(req) {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const m = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE_NAME + '='));
  return m ? m.slice(COOKIE_NAME.length + 1).trim() : undefined;
}

function requireAuth(req, res) {
  if (!getProtectionPassword()) return true;
  if (verifySessionCookie(getSessionCookie(req))) return true;
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }));
  return false;
}
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (key) console.log('[dev-api] ANTHROPIC_API_KEY trovata (lunghezza:', key.length, ')');
  else console.warn('[dev-api] ANTHROPIC_API_KEY mancante in .env / .env.local');
  return key;
}

function getHeaders() {
  const key = getApiKey();
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

async function callAnthropic(body) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('[dev-api] Anthropic error', res.status, text);
    throw new Error(text || `Anthropic ${res.status}`);
  }
  const data = JSON.parse(text);
  const out = (data.content ?? [])
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('');
  return { text: out };
}

const PROMPT_ALERTS = (today) => `Sei un assistente specializzato in disagi dei trasporti italiani. 
Oggi è ${today}.

Basandoti sulla tua conoscenza aggiornata delle fonti ufficiali italiane (MIT scioperi, Trenitalia, Italo, ENAC, compagnie marittime), fornisci i disagi dei trasporti italiani OGGI E NEI PROSSIMI 7 GIORNI.

OBBLIGATORIO: rispondi con un JSON che contenga SEMPRE entrambi gli array:
- "oggi": disagi confermati per oggi (se non ce ne sono, array vuoto []).
- "prossimi7giorni": disagi previsti nei prossimi 7 giorni (scioperi, lavori, eventi con data). Anche se oggi è tutto ok, compila comunque prossimi7giorni con ciò che è previsto nei giorni successivi.

Rispondi SOLO con un JSON valido, nessun testo prima o dopo.

Per ogni disagio, se la notizia proviene da una pagina web ufficiale, inserisci "fonte" (nome della fonte) e "fonte_url" (URL completo della pagina/articolo) così l'utente può cliccare e leggere l'articolo intero.

Formato:
{
  "oggi": [
    {
      "id": "unique_id",
      "tipo": "sciopero|cancellazione|ritardo|lavori",
      "mezzo": "treni|aerei|navi|bus",
      "operatore": "nome compagnia o ente",
      "titolo": "titolo breve (max 60 caratteri)",
      "descrizione": "descrizione con orari/dettagli (2-3 frasi)",
      "severita": "alta|media|bassa",
      "orario": "es. 09:00-17:00 o Tutto il giorno",
      "fonte": "nome fonte (es. MIT Scioperi, Trenitalia)",
      "fonte_url": "https://url-completo-della-pagina-o-articolo"
    }
  ],
  "prossimi7giorni": [
    {
      "id": "unique_id",
      "data": "gg/mm/aaaa",
      "tipo": "sciopero|lavori|evento",
      "mezzo": "treni|aerei|navi|bus",
      "operatore": "nome",
      "titolo": "titolo breve",
      "descrizione": "descrizione",
      "severita": "alta|media|bassa",
      "fonte": "nome fonte",
      "fonte_url": "https://url-completo-se-disponibile"
    }
  ]
}

Non inventare date o eventi non verificabili. Includi 2-4 elementi realistici per categoria in base alle tue conoscenze.`;

const PROMPT_ANALYSIS = (today) => `Sei un assistente per l'agenzia FiloSofia Viaggi (Giada Moramarco). Oggi è ${today}.

Basandoti SOLO sulla tua conoscenza (non fare ricerche web), scrivi un briefing mattutino CONCISO (3-4 paragrafi) sullo stato dei trasporti italiani oggi, pensato per Giada e per FiloSofia Viaggi. 
Usa HTML semplice con <p>, <strong>, e classi CSS: class="ok" per verde, class="warn" per giallo, class="danger" per rosso.
Includi: 1) Situazione generale, 2) Eventuali scioperi o disagi noti, 3) Consigli pratici per i clienti, 4) Un consiglio su cosa comunicare ai clienti.
Tono: professionale ma diretto. Massimo 150 parole totali.
Rispondi SOLO con l'HTML, nessun testo extra.`;

const PROMPT_CHECK_DATE = (dateFormatted, mezzo, note) => `Sei un assistente per un'agenzia di viaggi italiana.
Devo verificare se ci sono disagi per un viaggio in Italia il ${dateFormatted}.
Mezzo: ${mezzo === 'tutti' ? 'qualsiasi mezzo di trasporto' : mezzo}
${note ? 'Note: ' + note : ''}

Basandoti SOLO sulla tua conoscenza (non fare ricerche web) su scioperi programmati, lavori e disagi dei trasporti italiani, fornisci una risposta CONCISA (max 80 parole) in italiano che risponda a:
1. Rischi specifici per quella data
2. Consiglio pratico per l'agenzia
3. Raccomandazione (✅ Tutto ok / ⚠️ Attenzione / 🔴 Alto rischio)

Formato: testo semplice con HTML basic (<strong>, <span>). Sii diretto e utile.`;

const PROMPT_CHECK_ALL = (dateList) => `Sei un assistente per un'agenzia di viaggi italiana.
Verifica le seguenti date di viaggio per possibili disagi:
${dateList}

Basandoti SOLO sulla tua conoscenza (non fare ricerche web). Per ciascuna data indica brevemente il rischio (✅ ok / ⚠️ attenzione / 🔴 alto rischio) con una riga di spiegazione.
Formato: lista semplice HTML con <li> per ogni data. Rispondi solo con l'HTML della lista.`;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const routes = {
  '/api/alerts': async (body, req, res) => {
    if (!requireAuth(req, res)) return;
    const { today } = body;
    if (!today || typeof today !== 'string') return send(res, 400, { error: 'Missing or invalid "today"' });
    const { text } = await callAnthropic({
      max_tokens: 2500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: PROMPT_ALERTS(today) }],
    });
    const clean = text.replace(/```json|```/g, '').trim();
    let data;
    try {
      data = JSON.parse(clean);
    } catch {
      data = { oggi: [], prossimi7giorni: [] };
    }
    send(res, 200, data);
  },
  '/api/analysis': async (body, req, res) => {
    if (!requireAuth(req, res)) return;
    const { today } = body;
    if (!today || typeof today !== 'string') return send(res, 400, { error: 'Missing or invalid "today"' });
    const { text } = await callAnthropic({
      max_tokens: 1000,
      messages: [{ role: 'user', content: PROMPT_ANALYSIS(today) }],
    });
    const html = text.replace(/```html|```/g, '').trim();
    send(res, 200, { html });
  },
  '/api/check-date': async (body, req, res) => {
    if (!requireAuth(req, res)) return;
    const { dateFormatted, mezzo, note } = body;
    if (!dateFormatted || typeof dateFormatted !== 'string') return send(res, 400, { error: 'Missing or invalid "dateFormatted"' });
    const { text } = await callAnthropic({
      max_tokens: 1000,
      messages: [{ role: 'user', content: PROMPT_CHECK_DATE(dateFormatted, mezzo || 'tutti', note || '') }],
    });
    send(res, 200, { text });
  },
  '/api/check-all-saved': async (body, req, res) => {
    if (!requireAuth(req, res)) return;
    const { dateList } = body;
    if (!dateList || typeof dateList !== 'string') return send(res, 400, { error: 'Missing or invalid "dateList"' });
    const { text } = await callAnthropic({
      max_tokens: 1000,
      messages: [{ role: 'user', content: PROMPT_CHECK_ALL(dateList) }],
    });
    send(res, 200, { html: text });
  },
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const path = req.url?.split('?')[0];
  console.log('[dev-api]', req.method, path);

  if (path === '/api/auth') {
    if (req.method === 'GET') {
      const secret = getProtectionPassword();
      if (!secret) {
        send(res, 200, { ok: true, protected: false });
        return;
      }
      if (verifySessionCookie(getSessionCookie(req))) {
        send(res, 200, { ok: true, protected: true });
        return;
      }
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }));
      return;
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const secret = getProtectionPassword();
      if (!secret) {
        send(res, 200, { ok: true });
        return;
      }
      if (body.password !== secret) {
        send(res, 401, { error: 'Password non corretta', code: 'AUTH_FAILED' });
        return;
      }
      const value = createSessionCookie();
      const opts = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=' + COOKIE_MAX_AGE_SEC;
      res.setHeader('Set-Cookie', COOKIE_NAME + '=' + value + '; ' + opts);
      send(res, 200, { ok: true });
      return;
    }
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  const handler = routes[path];
  if (req.method !== 'POST' || !handler) {
    send(res, 404, { error: 'Not found' });
    return;
  }
  if (!getApiKey()) {
    send(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }
  try {
    const body = await parseBody(req);
    await handler(body, req, res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[dev-api]', path, msg);
    send(res, 500, { error: msg });
  }
});

server.listen(PORT, () => {
  console.log('[dev-api] API in ascolto su http://127.0.0.1:' + PORT);
  console.log('[dev-api] Chiave da .env / .env.local');
  console.log('[dev-api] Apri il browser su http://localhost:5173 (non 5174 o altre porte)');
});
