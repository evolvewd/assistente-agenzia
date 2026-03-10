/**
 * Client API: chiama le route serverless che usano ANTHROPIC_API_KEY da env (Vercel Secrets / .env.local).
 * Con protezione password, le richieste includono i cookie (credentials: 'include').
 */

const API_BASE = '';

const fetchOpts: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

export type AuthStatus = { ok: boolean; protected: boolean };

/** Verifica se la sessione è valida. GET /api/auth */
export async function verifyAuth(): Promise<AuthStatus> {
  const res = await fetch(`${API_BASE}/api/auth`, { method: 'GET', credentials: 'include' });
  if (res.status === 401) {
    return { ok: false, protected: true };
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; protected?: boolean };
  return { ok: data.ok === true, protected: data.protected === true };
}

/** Login con password. POST /api/auth */
export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    ...fetchOpts,
    body: JSON.stringify({ password }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error || 'Accesso non riuscito' };
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    ...fetchOpts,
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if ((data as { code?: string }).code === 'AUTH_REQUIRED') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-required'));
      }
      throw new Error('AUTH_REQUIRED');
    }
  }
  if (res.status === 503) {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type AlertData = import('../types/alerts').AlertData;

export async function fetchAlerts(today: string): Promise<AlertData> {
  const data = await post<AlertData>('/api/alerts', { today });
  return {
    oggi: data.oggi ?? [],
    prossimi7giorni: data.prossimi7giorni ?? [],
  };
}

export async function fetchAnalysis(today: string): Promise<string> {
  const data = await post<{ html?: string }>('/api/analysis', { today });
  return data.html ?? '';
}

export async function checkDateWithAi(
  dateFormatted: string,
  mezzo: string,
  note: string
): Promise<string> {
  const data = await post<{ text?: string }>('/api/check-date', {
    dateFormatted,
    mezzo,
    note,
  });
  return data.text ?? '';
}

export async function checkAllSavedWithAi(dateList: string): Promise<string> {
  const data = await post<{ html?: string }>('/api/check-all-saved', { dateList });
  return data.html ?? '';
}
