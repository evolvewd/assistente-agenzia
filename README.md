# FiloSofia Viaggi — Cruscotto Disagi

Cruscotto per **FiloSofia Viaggi** (Giada Moramarco): monitoraggio disagi trasporti (treni, aerei, navi, bus) con analisi AI (Anthropic Claude).

## Stack

- **React 18** + **TypeScript**
- **Vite** (build e dev server)
- **API**: route serverless Vercel (`/api/*`) — chiave API e password sul server (Vercel Secrets / `.env.local`)
- **Deploy**: Vercel

## Variabili d'ambiente

### ANTHROPIC_API_KEY (obbligatoria per le API)

- **Su Vercel**: **Project Settings → Environment Variables** (o **Secrets**) → aggiungi `ANTHROPIC_API_KEY` con valore `sk-ant-...`.
- **In locale**: in **`.env.local`** (vedi `.env.example`):
  ```bash
  ANTHROPIC_API_KEY=sk-ant-api03-...
  ```

### PROTECTION_PASSWORD (opzionale — protezione accesso)

Se impostata, l’app richiede la password prima di mostrare dati e usare le API.

- **Su Vercel**: **Project Settings → Environment Variables** → **Add** → nome `PROTECTION_PASSWORD`, valore la password scelta → **Save** (consigliato come **Secret**). Dopo il deploy, aprendo il **sito** nel browser verrà chiesta la password; il **git push** non c’entra con questa password.
- **In locale**: in `.env.local` aggiungi `PROTECTION_PASSWORD=tua_password`. Se non la imposti, in locale l’app è accessibile senza login.

## Setup

```bash
npm install
cp .env.example .env.local   # poi modifica .env.local e inserisci la chiave
npx vercel dev               # sviluppo con API (frontend + serverless)
```

Apri l’URL indicato da `vercel dev` (es. [http://localhost:3000](http://localhost:3000)).

Solo frontend (senza API): `npm run dev` → [http://localhost:5173](http://localhost:5173) — le chiamate AI non funzioneranno.

## Build e deploy su Vercel

```bash
npm run build
```

Collega il repo a Vercel; imposta in **Settings → Environment Variables** (o **Secrets**):

- `ANTHROPIC_API_KEY` — chiave API Anthropic
- `PROTECTION_PASSWORD` — password di accesso al cruscotto (consigliato come **Secret**)

Le rewrites in `vercel.json` gestiscono il routing SPA.

## Costi API (Anthropic)

La **web search** consuma molti token (risultati iniettati nel contesto) e fa lievitare i costi. In questo progetto la ricerca web è usata **solo** nel caricamento iniziale (disagi oggi + prossimi 7 giorni); analisi del giorno, “Verifica data” e “Verifica tutte” usano solo la conoscenza del modello, per contenere i costi. Evitare refresh continui e uso ripetuto dei pulsanti “Verifica con AI”.

## Struttura

- `api/` — route serverless (alerts, analysis, check-date, check-all-saved) che usano `ANTHROPIC_API_KEY`
- `src/lib/api.ts` — client che chiama `/api/*`
- `src/lib/dateUtils.ts` — date in formato italiano (gg/mm/aaaa)
- `src/components/` — Header, StatusBar, SummaryCards, FilterBar, AiBox, AlertList, DateChecker, SavedWatches, ApiConfigBanner
- `index-legacy.html` — versione monolitica originale (reference)
