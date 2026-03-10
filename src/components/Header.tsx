import { formatDateIT } from '../lib/dateUtils';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ onRefresh, loading }: HeaderProps) {
  const dateStr = formatDateIT(new Date());

  return (
    <header>
      <div className="logo">
        <h1>Viaggio<span>Alert</span></h1>
        <span className="logo-sub">Cruscotto Disagi</span>
      </div>
      <div className="header-right">
        <div className="date-badge">{dateStr}</div>
        <button
          type="button"
          className={`refresh-btn ${loading ? 'loading' : ''}`}
          onClick={onRefresh}
          disabled={loading}
        >
          <span>↻</span> Aggiorna
        </button>
      </div>
    </header>
  );
}
