import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, callAnthropic } from './anthropic';

const PROMPT = (dateList: string) => `Sei un assistente per un'agenzia di viaggi italiana.
Verifica le seguenti date di viaggio per possibili disagi:
${dateList}

Per ciascuna data, indica brevemente il rischio (✅ ok / ⚠️ attenzione / 🔴 alto rischio) con una riga di spiegazione.
Formato: lista semplice HTML con <li> per ogni data. Rispondi solo con l'HTML della lista.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!hasApiKey()) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }
  try {
    const { dateList } = req.body as { dateList?: string };
    if (!dateList || typeof dateList !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "dateList"' });
    }
    const { text } = await callAnthropic({
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: PROMPT(dateList) }],
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ html: text });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
