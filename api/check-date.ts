import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, callAnthropic } from './anthropic';

const PROMPT = (dateFormatted: string, mezzo: string, note: string) => `Sei un assistente per un'agenzia di viaggi italiana.
Devo verificare se ci sono disagi per un viaggio in Italia il ${dateFormatted}.
Mezzo: ${mezzo === 'tutti' ? 'qualsiasi mezzo di trasporto' : mezzo}
${note ? 'Note: ' + note : ''}

Basandoti sulle tue conoscenze di scioperi programmati, lavori e disagi dei trasporti italiani, fornisci una risposta CONCISA (max 80 parole) in italiano che risponda a:
1. Rischi specifici per quella data
2. Consiglio pratico per l'agenzia
3. Raccomandazione (✅ Tutto ok / ⚠️ Attenzione / 🔴 Alto rischio)

Formato: testo semplice con HTML basic (<strong>, <span>). Sii diretto e utile.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!hasApiKey()) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }
  try {
    const { dateFormatted, mezzo, note } = req.body as {
      dateFormatted?: string;
      mezzo?: string;
      note?: string;
    };
    if (!dateFormatted || typeof dateFormatted !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "dateFormatted"' });
    }
    const { text } = await callAnthropic({
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [
        {
          role: 'user',
          content: PROMPT(
            dateFormatted,
            typeof mezzo === 'string' ? mezzo : 'tutti',
            typeof note === 'string' ? note : ''
          ),
        },
      ],
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
