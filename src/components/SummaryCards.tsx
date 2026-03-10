import type { AlertData, Mezzo } from '../types/alerts';

const MEZZI: { key: Mezzo; icon: string; label: string; cardClass: string }[] = [
  { key: 'treni', icon: '🚆', label: 'Treni', cardClass: 'card-treni' },
  { key: 'aerei', icon: '✈️', label: 'Aerei', cardClass: 'card-aerei' },
  { key: 'navi', icon: '🛳️', label: 'Navi', cardClass: 'card-navi' },
  { key: 'bus', icon: '🚌', label: 'Bus', cardClass: 'card-bus' },
];

interface SummaryCardsProps {
  data: AlertData | null;
  loading: boolean;
  activeSection: Mezzo | null;
  onSectionClick: (mezzo: Mezzo) => void;
}

export function SummaryCards({
  data,
  loading,
  activeSection,
  onSectionClick,
}: SummaryCardsProps) {
  const oggi = data?.oggi ?? [];

  return (
    <div className="summary-grid">
      {MEZZI.map(({ key, icon, label, cardClass }) => {
        const items = oggi.filter((a) => a.mezzo === key);
        const high = items.filter((a) => a.severita === 'alta').length;
        const countClass =
          high > 0 ? 'danger' : items.length > 0 ? 'warn' : 'ok';
        const subText = loading
          ? 'Verifica...'
          : high > 0
            ? `${high} critici`
            : items.length > 0
              ? 'Disagi minori'
              : 'Regolare';

        return (
          <button
            type="button"
            key={key}
            className={`summary-card ${cardClass} ${activeSection === key ? 'active' : ''}`}
            onClick={() => onSectionClick(key)}
          >
            <div className="card-icon">{icon}</div>
            <div className="card-label">{label}</div>
            <div className={`card-count ${countClass}`}>
              {loading ? '…' : items.length}
            </div>
            <div className="card-sub">{subText}</div>
          </button>
        );
      })}
    </div>
  );
}
