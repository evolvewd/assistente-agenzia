import { useState, FormEvent } from 'react';
import { login } from '../lib/api';

interface LoginScreenProps {
  configError?: string | null;
  onSuccess: () => void;
}

export function LoginScreen({ configError, onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(password);
      if (result.ok) {
        onSuccess();
      } else {
        setError(result.error ?? 'Password non corretta');
      }
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <h1>FiloSofia <span>Viaggi</span></h1>
          <p className="login-sub">Inserisci la password per accedere al cruscotto</p>
          {configError && (
            <p className="login-config-error" role="alert">
              {configError}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="login-password" className="login-label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
          />
          {error && (
            <p id="login-error" className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
