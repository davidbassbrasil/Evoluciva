// Helpers for timezone-aware formatting (America/Sao_Paulo)
export const TIMEZONE = 'America/Sao_Paulo';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatBRDateTime(value?: string | Date | null): string {
  if (!value) return '-';
  try {
    // If value is a date-only string yyyy-mm-dd, show date only with 00:00
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y} 00:00`;
    }
    const d = typeof value === 'string' ? new Date(value) : value as Date;

    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).formatToParts(d);

    const map: Record<string,string> = {};
    parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });

    const day = map.day || '00';
    const month = map.month || '00';
    const year = map.year || '0000';
    const hour = map.hour || '00';
    const minute = map.minute || '00';

    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (e) {
    return String(value);
  }
}

export function formatBRDate(value?: string | Date | null): string {
  if (!value) return '-';
  try {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = typeof value === 'string' ? new Date(value) : value as Date;
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const map: Record<string,string> = {};
    parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
    return `${map.day || '00'}/${map.month || '00'}/${map.year || '0000'}`;
  } catch (e) {
    return String(value);
  }
}

// Return date key in YYYY-MM-DD for a given value according to TIMEZONE
export function dateKeyBR(value?: string | Date | null): string | null {
  if (!value) return null;
  try {
    const d = typeof value === 'string' ? new Date(value) : value as Date;
    return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (e) {
    return null;
  }
}

export function todayKeyBR(): string {
  return dateKeyBR(new Date()) || new Date().toISOString().slice(0,10);
}