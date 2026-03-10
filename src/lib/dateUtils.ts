/**
 * Formatta una data in italiano (es. "martedì 10 marzo 2025").
 */
export function formatDateIT(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  return date.toLocaleDateString('it-IT', options);
}

/**
 * Formatta in formato breve italiano (es. "10 mar 2025").
 */
export function formatDateITShort(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Converte una stringa gg/mm/aaaa in Date.
 * Restituisce null se non valida.
 */
export function parseDateIT(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[/.-]/).map((p) => parseInt(p, 10));
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null;
  if (y < 100) return null;
  const month = m - 1;
  if (month < 0 || month > 11) return null;
  const date = new Date(y, month, d);
  if (date.getDate() !== d || date.getMonth() !== month || date.getFullYear() !== y) return null;
  return date;
}

/**
 * Converte una stringa gg/mm/aaaa in ISO (yyyy-mm-dd) per input type="date" e API.
 */
export function dateITToISO(value: string): string | null {
  const date = parseDateIT(value);
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converte ISO (yyyy-mm-dd) in gg/mm/aaaa per visualizzazione italiana.
 */
export function isoToDateIT(iso: string): string {
  const date = new Date(iso + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return '';
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
