import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, callAnthropic } from './anthropic';
import { getBody } from './parseBody';
import { requireAuth } from '../lib/cookieAuth';

const PROMPT = (today: string) => `Sei un assistente per l'agenzia FiloSofia Viaggi (Giada Moramarco). Oggi è ${today}.

Basandoti SOLO sulla tua conoscenza (non fare ricerche web), scrivi un briefing mattutino CONCISO (3-4 paragrafi) sullo stato dei trasporti italiani oggi, pensato per Giada e per FiloSofia Viaggi. 
Usa HTML semplice con <p>, <strong>, e classi CSS: class="ok" per verde, class="warn" per giallo, class="danger" per rosso.
Includi: 1) Situazione generale, 2) Eventuali scioperi o disagi noti, 3) Consigli pratici per i clienti, 4) Un consiglio su cosa comunicare ai clienti.
Tono: professionale ma diretto. Massimo 150 parole totali.
Rispondi SOLO con l'HTML, nessun testo extra.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;
  if (!hasApiKey()) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }
  try {
    const body = await getBody(req);
    const { today } = body as { today?: string };
    if (!today || typeof today !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "today"' });
    }
    const { text } = await callAnthropic({
      max_tokens: 1000,
      messages: [{ role: 'user', content: PROMPT(today) }],
    });
    const html = text.replace(/```html|```/g, '').trim();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ html });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
