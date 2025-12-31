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
    let d: Date;
    if (typeof value === 'string') {
      // If value is a date-only string (YYYY-MM-DD), treat it as local BR midnight
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        d = new Date(`${value}T00:00:00-03:00`);
      } else if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(value)) {
        // naive datetime without timezone -> assume it's BR local
        d = new Date(`${value}-03:00`);
      } else {
        d = new Date(value);
      }
    } else {
      d = value as Date;
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (e) {
    return null;
  }
}

export function todayKeyBR(): string {
  return dateKeyBR(new Date()) || new Date().toISOString().slice(0,10);
}

/**
 * Converte Date para início do dia no timezone BR
 * Útil para filtros de data (ex: "início de hoje")
 */
export function brStartOfDay(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).split('-');
  
  // Cria data no timezone BR (usa offset -03:00)
  return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00-03:00`);
}

/**
 * Converte Date para fim do dia no timezone BR
 * Útil para filtros de data (ex: "fim de hoje")
 */
export function brEndOfDay(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).split('-');
  
  // Cria data no timezone BR (usa offset -03:00)
  return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59.999-03:00`);
}

/**
 * Retorna data/hora atual no timezone do Brasil
 * Use isso ao salvar novos registros com timestamp atual
 */
export function nowInBrazil(): Date {
  return new Date();
}

/**
 * Formata com "às" entre data e hora
 * Ex: "29/12/2025 às 18:00"
 */
export function formatBRWithAt(value?: string | Date | null): string {
  const formatted = formatBRDateTime(value);
  if (formatted === '-') return '-';
  
  // Separa data e hora e adiciona "às"
  const parts = formatted.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} às ${parts[1]}`;
  }
  return formatted;
}

/**
 * Converte string de data local BR para UTC (para salvar no banco)
 * Ex: "2025-12-29T18:00:00" (BR) -> salva como UTC no banco
 */
export function localBRToUTC(localDateStr: string): Date {
  // Adiciona offset do Brasil se não tiver timezone
  if (!localDateStr.includes('Z') && !localDateStr.includes('+') && !localDateStr.includes('-', 10)) {
    return new Date(`${localDateStr}-03:00`);
  }
  return new Date(localDateStr);
}

/**
 * Início do mês no timezone BR
 */
export function brStartOfMonth(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit'
  }).format(date).split('-');
  
  return new Date(`${parts[0]}-${parts[1]}-01T00:00:00-03:00`);
}

/**
 * Fim do mês no timezone BR
 */
export function brEndOfMonth(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit'
  }).format(date).split('-');
  
  // Último dia do mês
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const lastDay = new Date(year, month, 0).getDate();
  
  return new Date(`${parts[0]}-${parts[1]}-${pad(lastDay)}T23:59:59.999-03:00`);
}

/**
 * Início do ano no timezone BR
 */
export function brStartOfYear(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric'
  }).format(date).split('-');
  
  return new Date(`${parts[0]}-01-01T00:00:00-03:00`);
}