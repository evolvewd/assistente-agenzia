import { useState, useMemo, useRef, useEffect } from 'react';
import { checkDateWithAi } from '../lib/api';
import {
  formatDateIT,
  formatDateITShort,
  parseDateIT,
  dateITToISO,
} from '../lib/dateUtils';
import type { SavedWatch } from '../types/alerts';

const CHECK_COOLDOWN_SECONDS = 30;

interface DateCheckerProps {
  onSaveWatch: (watch: Omit<SavedWatch, 'saved'>) => void;
}

/** Restituisce oggi in gg/mm/aaaa */
function todayIT(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function DateChecker({ onSaveWatch }: DateCheckerProps) {
  const [dateIT, setDateIT] = useState(todayIT);
  const [mezzo, setMezzo] = useState('tutti');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((s) => {
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
  }, [cooldown]);

  const parsedDate = useMemo(() => parseDateIT(dateIT), [dateIT]);
  const dateFormattedForApi = parsedDate ? formatDateIT(parsedDate) : '';
  const dateISO = useMemo(() => (parsedDate ? dateITToISO(dateIT) : null), [dateIT, parsedDate]);

  const handleCheck = async () => {
    if (!parsedDate || !dateFormattedForApi || loading || cooldown > 0) return;
    setLoading(true);
    setResult(null);
    setError(false);
    try {
      const text = await checkDateWithAi(dateFormattedForApi, mezzo, note);
      setResult(text);
      setCooldown(CHECK_COOLDOWN_SECONDS);
    } catch {
      setError(true);
      setCooldown(15);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!dateISO) return;
    onSaveWatch({ date: dateISO, mezzo, note });
  };

  return (
    <div className="alert-tool">
      <div className="tool-header">
        <div className="tool-title">🔍 Controlla una data di viaggio</div>
      </div>
      <div className="tool-body">
        <div className="field">
          <label htmlFor="check-date">Data partenza (gg/mm/aaaa)</label>
          <input
            id="check-date"
            type="text"
            inputMode="numeric"
            placeholder="gg/mm/aaaa"
            value={dateIT}
            onChange={(e) => setDateIT(e.target.value)}
            aria-describedby="check-date-hint"
          />
          <span id="check-date-hint" className="field-hint" style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'block' }}>
            {parsedDate ? `Data selezionata: ${formatDateITShort(parsedDate)}` : 'Inserisci la data in formato italiano (es. 10/03/2025)'}
          </span>
        </div>
        <div className="field">
          <label htmlFor="check-mezzo">Mezzo di trasporto</label>
          <select
            id="check-mezzo"
            value={mezzo}
            onChange={(e) => setMezzo(e.target.value)}
          >
            <option value="tutti">Tutti i mezzi</option>
            <option value="treno">Treno</option>
            <option value="aereo">Aereo</option>
            <option value="nave">Nave / Traghetto</option>
            <option value="bus">Bus / Autobus</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="check-note">Rotta o cliente (opzionale)</label>
          <input
            id="check-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. Milano–Roma, Sig. Rossi…"
          />
        </div>
        <button
          type="button"
          className={`check-btn ${loading ? 'loading' : ''} ${cooldown > 0 ? 'cooldown' : ''}`}
          onClick={handleCheck}
          disabled={loading || !parsedDate || cooldown > 0}
          title={cooldown > 0 ? `Attendi ${cooldown} s prima di un'altra verifica` : undefined}
        >
          {loading
            ? 'Verifica in corso...'
            : cooldown > 0
              ? `Attendi ${cooldown} s`
              : 'Verifica con AI'}
        </button>
        <div className={`check-result ${result !== null || error ? 'visible' : ''}`}>
          {loading && (
            <>
              <div className="skeleton" />
              <div className="skeleton medium" />
            </>
          )}
          {error && !loading && (
            <span style={{ color: 'var(--red)' }}>Errore. Riprova.</span>
          )}
          {result && !loading && (
            <>
              <div style={{ fontSize: 12, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: result }} />
              <div className="check-result-actions">
                <button
                  type="button"
                  className="btn-small"
                  onClick={handleSave}
                  disabled={!dateISO}
                >
                  📌 Salva
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
