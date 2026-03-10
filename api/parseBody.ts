import type { VercelRequest } from '@vercel/node';

/**
 * Restituisce il body della request (già parsato da Vercel o letto dallo stream).
 */
export async function getBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer | string) => {
      data += typeof chunk === 'string' ? chunk : chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
