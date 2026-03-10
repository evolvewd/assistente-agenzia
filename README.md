# ViaggioAlert — Cruscotto Disagi

Dashboard per agenzie di viaggio: monitoraggio disagi trasporti (treni, aerei, navi, bus) con analisi AI (Anthropic Claude).

## Stack

- **React 18** + **TypeScript**
- **Vite** (build e dev server)
- **API**: route serverless Vercel (`/api/*`) — la chiave API resta sul server (Vercel Secrets / `.env.local`)
- **Deploy**: Vercel

## Chiave API (Anthropic)

La chiave **non** è più inserita a mano nell’app: viene letta lato server.

- **Su Vercel**: in **Project Settings → Environment Variables** (o **Secrets**) aggiungi `ANTHROPIC_API_KEY` con valore `sk-ant-...`.
- **In locale**: crea un file **`.env.local`** nella root del progetto (vedi `.env.example`) e inserisci:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-api03-...
  ```
  Poi avvia l’app con **`npx vercel dev`** (non solo `npm run dev`), così le route `/api/*` e `.env.local` vengono usate.

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

Collega il repo a Vercel; imposta `ANTHROPIC_API_KEY` in **Settings → Environment Variables**. Le rewrites in `vercel.json` gestiscono il routing SPA.

## Struttura

- `api/` — route serverless (alerts, analysis, check-date, check-all-saved) che usano `ANTHROPIC_API_KEY`
- `src/lib/api.ts` — client che chiama `/api/*`
- `src/lib/dateUtils.ts` — date in formato italiano (gg/mm/aaaa)
- `src/components/` — Header, StatusBar, SummaryCards, FilterBar, AiBox, AlertList, DateChecker, SavedWatches, ApiConfigBanner
- `index-legacy.html` — versione monolitica originale (reference)
