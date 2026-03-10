import type { AlertOggi, AlertProssimi } from '../types/alerts';

const MEZZO_ICON: Record<string, string> = {
  treni: '🚆',
  aerei: '✈️',
  navi: '🛳️',
  bus: '🚌',
};
const TIPO_LABEL: Record<string, string> = {
  sciopero: 'SCIOPERO',
  cancellazione: 'CANCELLAZIONE',
  ritardo: 'RITARDO',
  lavori: 'LAVORI',
  evento: 'EVENTO',
};

function severityClass(severita: string): string {
  return severita === 'alta' ? 'sev-high' : severita === 'media' ? 'sev-med' : 'sev-low';
}

export function AlertItemOggi({ alert }: { alert: AlertOggi }) {
  const sevClass = severityClass(alert.severita);
  const icon = MEZZO_ICON[alert.mezzo] ?? '⚠️';
  const tipoLabel = TIPO_LABEL[alert.tipo] ?? alert.tipo.toUpperCase();

  return (
    <div className="alert-item">
      <div className={`alert-severity ${sevClass}`} aria-hidden />
      <div className="alert-body">
        <div className="alert-title">
          {icon} {alert.operatore} —{' '}
          <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: 'var(--text3)' }}>
            {tipoLabel}
          </span>
        </div>
        <div className="alert-title" style={{ fontWeight: 400, marginBottom: 4 }}>
          {alert.titolo}
        </div>
        <div className="alert-desc">{alert.descrizione}</div>
        {alert.fonte && (
          <div className="alert-fonte">Fonte: {alert.fonte}</div>
        )}
      </div>
      <div className="alert-time">{alert.orario ?? ''}</div>
    </div>
  );
}

export function AlertItemProssimi({ alert }: { alert: AlertProssimi }) {
  const sevClass = severityClass(alert.severita);
  const icon = MEZZO_ICON[alert.mezzo] ?? '⚠️';

  return (
    <div className="alert-item">
      <div className={`alert-severity ${sevClass}`} aria-hidden />
      <div className="alert-body">
        <div className="alert-title">
          {icon} {alert.data} — {alert.operatore}
        </div>
        <div className="alert-title" style={{ fontWeight: 400, marginBottom: 4 }}>
          {alert.titolo}
        </div>
        <div className="alert-desc">{alert.descrizione}</div>
      </div>
    </div>
  );
}
