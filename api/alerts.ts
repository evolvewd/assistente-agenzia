import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, callAnthropic } from './anthropic';

const PROMPT = (today: string) => `Sei un assistente specializzato in disagi dei trasporti italiani. 
Oggi è ${today}.

Basandoti sulla tua conoscenza aggiornata delle fonti ufficiali italiane (MIT scioperi, Trenitalia, Italo, ENAC, compagnie marittime), fornisci i disagi dei trasporti italiani OGGI E NEI PROSSIMI 7 GIORNI.

IMPORTANTE: Rispondi SOLO con un JSON valido, nessun testo prima o dopo.

Formato richiesto:
{
  "oggi": [
    {
      "id": "unique_id",
      "tipo": "sciopero|cancellazione|ritardo|lavori",
      "mezzo": "treni|aerei|navi|bus",
      "operatore": "nome compagnia o ente",
      "titolo": "titolo breve descrittivo (max 60 caratteri)",
      "descrizione": "descrizione completa con orari e dettagli (2-3 frasi)",
      "severita": "alta|media|bassa",
      "orario": "es. 09:00-17:00 o Tutto il giorno",
      "fonte": "nome fonte ufficiale"
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
      "severita": "alta|media|bassa"
    }
  ]
}

Se non hai informazioni certe su disagi specifici per oggi, indica comunque la situazione generale (es. nessuno sciopero confermato = bassa severità). Non inventare date o eventi specifici non verificabili. Includi almeno 2-4 elementi realistici per categoria basati sulle tue conoscenze generali del settore.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!hasApiKey()) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }
  try {
    const { today } = req.body as { today?: string };
    if (!today || typeof today !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "today"' });
    }
    const { text } = await callAnthropic({
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: PROMPT(today) }],
    });
    const clean = text.replace(/```json|```/g, '').trim();
    let data: { oggi: unknown[]; prossimi7giorni: unknown[] };
    try {
      data = JSON.parse(clean);
    } catch {
      data = { oggi: [], prossimi7giorni: [] };
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
