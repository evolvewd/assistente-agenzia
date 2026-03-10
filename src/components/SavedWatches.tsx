import { useState, useRef, useEffect } from 'react';
import { checkAllSavedWithAi } from '../lib/api';
import { formatDateITShort } from '../lib/dateUtils';
import type { SavedWatch } from '../types/alerts';

const CHECK_ALL_COOLDOWN_SECONDS = 30;

const MEZZI_LABEL: Record<string, string> = {
  tutti: 'Tutti i mezzi',
  treno: 'Treno',
  aereo: 'Aereo',
  nave: 'Nave',
  bus: 'Bus',
};

interface SavedWatchesProps {
  watches: SavedWatch[];
  onRemove: (index: number) => void;
}

export function SavedWatches({ watches, onRemove }: SavedWatchesProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [modalContent, setModalContent] = useState<string | null>(null);
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

  const handleCheckAll = async () => {
    if (watches.length === 0 || loading || cooldown > 0) return;
    setLoading(true);
    setModalContent(null);
    const dateList = watches
      .map((w) => {
        const d = new Date(w.date + 'T12:00:00');
        const dayStr = d.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return `- ${dayStr} (${w.mezzo})${w.note ? ', ' + w.note : ''}`;
      })
      .join('\n');
    try {
      const html = await checkAllSavedWithAi(dateList);
      setModalContent(html);
      setCooldown(CHECK_ALL_COOLDOWN_SECONDS);
    } catch {
      window.alert('Errore nella verifica. Riprova.');
      setCooldown(15);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="alert-tool">
        <div className="tool-header">
          <div className="tool-title">📌 Date salvate da monitorare</div>
        </div>
        <div className="tool-body" style={{ padding: 0 }}>
          <div className="saved-list">
            {watches.length === 0 ? (
              <div className="empty-state" style={{ padding: 16, fontSize: 12 }}>
                Nessuna data salvata.<br />Usa il controllo qui sopra per aggiungerne.
              </div>
            ) : (
              watches.map((w, i) => {
                const d = new Date(w.date + 'T12:00:00');
                const label = formatDateITShort(d);
                return (
                  <div key={`${w.date}-${w.mezzo}-${i}`} className="saved-item">
                    <div className="saved-item-info">
                      <div className="saved-item-date">📅 {label}</div>
                      <div className="saved-item-detail">
                        {MEZZI_LABEL[w.mezzo] ?? w.mezzo}
                        {w.note ? ` · ${w.note}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="saved-item-del"
                      onClick={() => onRemove(i)}
                      aria-label="Rimuovi"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className={`check-btn ${loading ? 'loading' : ''} ${cooldown > 0 ? 'cooldown' : ''}`}
              onClick={handleCheckAll}
              disabled={loading || watches.length === 0 || cooldown > 0}
              title={cooldown > 0 ? `Attendi ${cooldown} s` : undefined}
            >
              {loading
                ? 'Verifica in corso...'
                : cooldown > 0
                  ? `Attendi ${cooldown} s`
                  : 'Verifica tutte con AI'}
            </button>
          </div>
        </div>
      </div>

      {modalContent !== null && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalContent(null);
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div id="modal-title" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, color: 'var(--text2)' }}>
                VERIFICA DATE SALVATE <span className="ai-tag">AI</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalContent(null)}
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>
            <ul style={{ listStyle: 'none', fontSize: 13, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: modalContent }} />
          </div>
        </div>
      )}
    </>
  );
}
