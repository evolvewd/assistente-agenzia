import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, callAnthropic } from './anthropic';
import { getBody } from './parseBody';
import { requireAuth } from '../lib/cookieAuth';

const PROMPT = (today: string) => `Sei un assistente specializzato in disagi dei trasporti italiani. 
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
      max_tokens: 2500,
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
