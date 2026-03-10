type StatusType = 'idle' | 'loading' | 'error';

interface StatusBarProps {
  status: StatusType;
  message: string;
}

export function StatusBar({ status, message }: StatusBarProps) {
  const dotClass =
    status === 'loading'
      ? 'status-dot loading'
      : status === 'error'
        ? 'status-dot error'
        : 'status-dot';

  return (
    <div className="status-bar">
      <div className={dotClass} aria-hidden />
      <span id="status-text">{message}</span>
    </div>
  );
}
