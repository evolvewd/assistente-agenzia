/**
 * Client API: chiama le route serverless che usano ANTHROPIC_API_KEY da env (Vercel Secrets / .env.local).
 */

const API_BASE = '';

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
