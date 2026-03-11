'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Plane, 
  Train, 
  Ship, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  Search,
  Info,
  Printer,
  WifiOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

type DisruptionData = {
  category: 'flights' | 'trains' | 'maritime' | 'strikes' | 'general';
  title: string;
  content: string;
  sources: { title: string; uri: string }[];
  lastUpdated: string;
};

export default function TravelDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DisruptionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');

  const fetchDisruptions = async (query?: string, useSearch = true) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("API_KEY_MISSING");
      }

      const basePrompt = `Sei un assistente specializzato per un'agenzia viaggi italiana. 
      Analizza la situazione attuale (oggi ${format(new Date(), 'dd MMMM yyyy', { locale: it })}) riguardo a:
      1. Problemi con i voli (cancellazioni, ritardi significativi, problemi aeroportuali).
      2. Problemi con i treni (scioperi ferroviari, guasti alla linea, ritardi).
      3. Problemi con navi e traghetti (maltempo, cancellazioni).
      4. Scioperi generali o di settore previsti per oggi e i prossimi giorni in Italia ed Europa.`;

      const prompt = query 
        ? `${basePrompt}\n\nIn particolare, rispondi a questa richiesta specifica dell'utente: "${query}"`
        : `${basePrompt}\n\nFornisci un riassunto dettagliato ma conciso per ogni categoria. Usa un tono professionale e utile per un agente di viaggio.`;

      const config: any = {};
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: config,
      });

      const text = response.text || "Nessuna informazione disponibile.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter(c => c.web && c.web.uri)
        .map(c => ({ title: c.web!.title || 'Fonte', uri: c.web!.uri as string }));

      const categories: DisruptionData[] = [
        {
          category: 'general',
          title: query ? `Risultato Ricerca: ${query}` : 'Bollettino Viaggi Odierno',
          content: text,
          sources: sources,
          lastUpdated: new Date().toISOString()
        }
      ];

      setData(categories);
    } catch (err: any) {
      console.error('Error fetching disruptions:', err);
      if (err.message === "API_KEY_MISSING") {
        setError("Chiave API mancante. Verifica le impostazioni su Vercel (NEXT_PUBLIC_GEMINI_API_KEY).");
      } else if (err.message?.includes('429') || err.status === 429) {
        setError("QUOTA_EXCEEDED");
      } else {
        setError("Errore nel recupero delle informazioni. Riprova tra poco.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchDisruptions();
      hasFetched.current = true;
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-4xl font-serif italic text-stone-900">FiloSofia Viaggi</h1>
          <p className="text-stone-500 mt-1 flex items-center gap-2 text-sm">
            <Info size={14} />
            di Giada Moramarco &bull; Via Massa 3, Chieri
          </p>
          <p className="text-stone-400 mt-1 flex items-center gap-2 text-xs" suppressHydrationWarning>
            <Calendar size={14} />
            {format(new Date(), 'EEEE dd MMMM yyyy', { locale: it })}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 transition-colors"
            title="Stampa Bollettino"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Stampa</span>
          </button>
          <div className="relative">
            <input 
              type="text"
              placeholder="Cerca rotta o sciopero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDisruptions(searchQuery)}
              className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          </div>
          <button 
            onClick={() => fetchDisruptions(searchQuery)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "..." : "Vai"}
          </button>
        </div>
      </header>

      {error && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${error === 'QUOTA_EXCEEDED' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex-1 text-sm">
            {error === 'QUOTA_EXCEEDED' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>
                  <strong>Quota superata:</strong> Il servizio di ricerca in tempo reale è temporaneamente limitato da Google.
                </span>
                <button 
                  onClick={() => fetchDisruptions(searchQuery, false)}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <WifiOff size={14} />
                  Prova senza ricerca live
                </button>
              </div>
            ) : error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {loading && data.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-stone-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            data.map((item, idx) => (
              <section key={idx} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-stone-100 rounded-lg">
                      <Info className="text-stone-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-medium tracking-tight">{item.title}</h2>
                  </div>
                  
                  <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:italic">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>

                  {item.sources.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-stone-100">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3">Fonti e Approfondimenti</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.sources.map((source, sIdx) => (
                          <a 
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 bg-stone-50 border border-stone-200 rounded-full text-stone-600 hover:bg-stone-100 transition-colors"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 flex justify-between items-center text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                  <span>Stato: Operativo</span>
                  <span>Ultimo Aggiornamento: {format(new Date(item.lastUpdated), 'HH:mm:ss')}</span>
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-6 print:hidden">
          <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-serif italic mb-4">Guida Rapida</h3>
            <ul className="space-y-4 text-sm text-stone-300">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                <p>Il sistema monitora in tempo reale le principali fonti di informazione su trasporti e scioperi.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] flex-shrink-0">2</div>
                <p>Usa la barra di ricerca per query specifiche (es. &quot;Sciopero Trenitalia 15 Marzo&quot; o &quot;Ritardi Malpensa&quot;).</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] flex-shrink-0">3</div>
                <p>Clicca sulle fonti in fondo ai report per accedere ai siti ufficiali e dettagli tecnici.</p>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">Link Utili Agenzia</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: 'Viaggiare Sicuri', url: 'https://www.viaggiaresicuri.it' },
                { name: 'Trenitalia Info', url: 'https://www.trenitalia.com/it/informazioni/infomobilita.html' },
                { name: 'Italo Avvisi', url: 'https://www.italotreno.it/it/programma-italo-piu/avvisi' },
                { name: 'ENAC - Diritti Passeggero', url: 'https://www.enac.gov.it/passeggeri/diritti-dei-passeggeri' },
                { name: 'Commissione Sciopero', url: 'https://www.cgsse.it' }
              ].map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-lg group transition-colors"
                >
                  <span className="text-sm text-stone-600 group-hover:text-stone-900">{link.name}</span>
                  <RefreshCw size={12} className="text-stone-300 group-hover:text-stone-500 rotate-45" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="pt-12 pb-6 text-center text-stone-400 text-[10px] font-mono uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} FiloSofia Viaggi &bull; Giada Moramarco &bull; Chieri (TO)
      </footer>
    </div>
  );
}
