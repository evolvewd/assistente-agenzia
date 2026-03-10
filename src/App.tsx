import { useCallback, useEffect, useState } from 'react';
import { fetchAlerts, fetchAnalysis } from './lib/api';
import { formatDateIT } from './lib/dateUtils';
import type { AlertData, FilterTipo, Mezzo, SavedWatch } from './types/alerts';
import { ApiConfigBanner } from './components/ApiConfigBanner';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { SummaryCards } from './components/SummaryCards';
import { FilterBar } from './components/FilterBar';
import { AiBox } from './components/AiBox';
import { AlertListToday, AlertListUpcoming } from './components/AlertList';
import { DateChecker } from './components/DateChecker';
import { SavedWatches } from './components/SavedWatches';

const SAVED_STORAGE_KEY = 'viaggioalert_saved';

function loadSavedWatches(): SavedWatch[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedWatches(watches: SavedWatch[]) {
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(watches));
}

export default function App() {
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('Pronto');
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<FilterTipo>('tutti');
  const [sectionMezzo, setSectionMezzo] = useState<Mezzo | null>(null);
  const [savedWatches, setSavedWatches] = useState<SavedWatch[]>(loadSavedWatches);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setStatus('loading');
    setStatusMessage('Recupero informazioni in corso...');
    setAiContent(null);
    const today = formatDateIT(new Date());
    try {
      const [data, analysis] = await Promise.all([
        fetchAlerts(today),
        fetchAnalysis(today),
      ]);
      setAlertData(data);
      setAiContent(analysis);
      setStatus('idle');
      setApiKeyConfigured(true);
      setStatusMessage(`Ultimo aggiornamento: ${new Date().toLocaleTimeString('it-IT')}`);
    } catch (e) {
      setStatus('error');
      const isConfig = e instanceof Error && e.message === 'API_KEY_NOT_CONFIGURED';
      setApiKeyConfigured(isConfig ? false : null);
      setStatusMessage(isConfig ? 'Chiave API non configurata' : 'Errore nel caricamento. Riprova.');
      setAiContent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveWatch = useCallback((watch: Omit<SavedWatch, 'saved'>) => {
    const newWatch: SavedWatch = { ...watch, saved: new Date().toISOString() };
    setSavedWatches((prev) => {
      const exists = prev.some((w) => w.date === watch.date && w.mezzo === watch.mezzo);
      if (exists) return prev;
      const next = [...prev, newWatch];
      saveSavedWatches(next);
      return next;
    });
  }, []);

  const handleRemoveWatch = useCallback((index: number) => {
    setSavedWatches((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveSavedWatches(next);
      return next;
    });
  }, []);

  const handleSectionClick = useCallback((mezzo: Mezzo) => {
    setSectionMezzo((prev) => (prev === mezzo ? null : mezzo));
  }, []);

  return (
    <>
      {apiKeyConfigured === false && <ApiConfigBanner />}
      <div className="container">
        <Header onRefresh={loadAll} loading={loading} />
        <StatusBar status={status} message={statusMessage} />
        <SummaryCards
          data={alertData}
          loading={loading}
          activeSection={sectionMezzo}
          onSectionClick={handleSectionClick}
        />
        <FilterBar current={filter} onFilter={setFilter} />
        <div className="main-grid">
          <div>
            <AiBox
              content={aiContent}
              loading={loading && aiContent === null}
              error={status === 'error'}
            />
            <AlertListToday
              data={alertData}
              filter={filter}
              sectionMezzo={sectionMezzo}
            />
            <AlertListUpcoming data={alertData} />
          </div>
          <div className="sidebar">
            <DateChecker onSaveWatch={handleSaveWatch} />
            <SavedWatches watches={savedWatches} onRemove={handleRemoveWatch} />
          </div>
        </div>
      </div>
    </>
  );
}
