import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAlerts, fetchAnalysis, verifyAuth } from './lib/api';
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
import { LoginScreen } from './components/LoginScreen';

const SAVED_STORAGE_KEY = 'viaggioalert_saved';
const REFRESH_COOLDOWN_SECONDS = 60;

/** Evita doppio caricamento in React Strict Mode (useEffect eseguito due volte in dev). */
let initialLoadStarted = false;

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
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('Pronto');
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<FilterTipo>('tutti');
  const [sectionMezzo, setSectionMezzo] = useState<Mezzo | null>(null);
  const [savedWatches, setSavedWatches] = useState<SavedWatch[]>(loadSavedWatches);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setStatus('loading');
    setStatusMessage('Aggiornamento in corso... Non premere Aggiorna.');
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
      setRefreshCooldown(REFRESH_COOLDOWN_SECONDS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'AUTH_REQUIRED') {
        setAuthenticated(false);
        initialLoadStarted = false;
        return;
      }
      setStatus('error');
      const isConfig = msg === 'API_KEY_NOT_CONFIGURED';
      setApiKeyConfigured(isConfig ? false : null);
      setStatusMessage(isConfig ? 'Chiave API non configurata' : 'Errore nel caricamento. Riprova.');
      setAiContent(null);
      setRefreshCooldown(30);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    verifyAuth().then((status) => {
      if (cancelled) return;
      setAuthChecked(true);
      setAuthenticated(status.protected ? status.ok : true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authChecked || !authenticated) return;
    if (initialLoadStarted) return;
    initialLoadStarted = true;
    loadAll();
  }, [authChecked, authenticated, loadAll]);

  useEffect(() => {
    const handler = () => {
      setAuthenticated(false);
      initialLoadStarted = false;
    };
    window.addEventListener('auth-required', handler);
    return () => window.removeEventListener('auth-required', handler);
  }, []);

  useEffect(() => {
    if (refreshCooldown <= 0) return;
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setRefreshCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [refreshCooldown]);

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
      {!authChecked && (
        <div className="login-screen" aria-live="polite">
          <div className="login-card">
            <p className="login-sub">Verifica accesso...</p>
          </div>
        </div>
      )}
      {authChecked && !authenticated && (
        <LoginScreen onSuccess={() => setAuthenticated(true)} />
      )}
      {authChecked && authenticated && (
    <>
      {apiKeyConfigured === false && <ApiConfigBanner />}
      <div className="container">
        <Header
          onRefresh={loadAll}
          loading={loading}
          refreshCooldown={refreshCooldown}
        />
        <StatusBar
          status={status}
          message={statusMessage}
          refreshCooldown={refreshCooldown}
          loading={loading}
        />
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
      )}
    </>
  );
}
