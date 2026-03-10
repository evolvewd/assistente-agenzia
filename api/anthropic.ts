const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey()?.trim());
}

export function getHeaders(): HeadersInit {
  const key = getApiKey();
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

export async function callAnthropic(body: Record<string, unknown>): Promise<{ text: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Anthropic API error: ${res.status}`);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => (b as { text: string }).text)
    .join('');
  return { text };
}
