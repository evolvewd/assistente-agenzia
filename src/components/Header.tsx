import { formatDateIT } from '../lib/dateUtils';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
  refreshCooldown: number;
}

export function Header({ onRefresh, loading, refreshCooldown }: HeaderProps) {
  const dateStr = formatDateIT(new Date());
  const disabled = loading || refreshCooldown > 0;
  const buttonLabel =
    loading
      ? 'Caricamento...'
      : refreshCooldown > 0
        ? `Attendi ${refreshCooldown} s`
        : 'Aggiorna';

  return (
    <header>
      <div className="logo">
        <h1>FiloSofia <span>Viaggi</span></h1>
        <span className="logo-sub">Cruscotto Disagi · Giada Moramarco</span>
      </div>
      <div className="header-right">
        <div className="date-badge">{dateStr}</div>
        <button
          type="button"
          className={`refresh-btn ${loading ? 'loading' : ''} ${refreshCooldown > 0 ? 'cooldown' : ''}`}
          onClick={onRefresh}
          disabled={disabled}
          title={refreshCooldown > 0 ? `Potrai aggiornare tra ${refreshCooldown} secondi` : undefined}
        >
          <span>↻</span> {buttonLabel}
        </button>
      </div>
    </header>
  );
}
