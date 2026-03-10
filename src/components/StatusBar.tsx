type StatusType = 'idle' | 'loading' | 'error';

interface StatusBarProps {
  status: StatusType;
  message: string;
  refreshCooldown: number;
  loading: boolean;
}

export function StatusBar({ status, message, refreshCooldown, loading }: StatusBarProps) {
  const dotClass =
    status === 'loading'
      ? 'status-dot loading'
      : status === 'error'
        ? 'status-dot error'
        : 'status-dot';

  const notice =
    loading
      ? 'Aggiornamento in corso. Non premere Aggiorna.'
      : refreshCooldown > 0
        ? `Potrai aggiornare di nuovo tra ${refreshCooldown} secondi (limite API).`
        : null;

  return (
    <div className="status-bar">
      <div className={dotClass} aria-hidden />
      <span id="status-text">{message}</span>
      {notice && (
        <span className="status-notice" role="status">
          {notice}
        </span>
      )}
    </div>
  );
}
