export const DAY_LABELS: Record<string, string> = {
  Mon: 'Seg.',
  Tue: 'Ter.',
  Wed: 'Qua.',
  Thu: 'Qui.',
  Fri: 'Sex.',
  Sat: 'Sáb.',
  Sun: 'Dom.',
};

export function formatSessions(sessions?: { day: string; start: string; end?: string }[]) {
  if (!sessions || sessions.length === 0) return null;
  return sessions
    .map((s) => `${DAY_LABELS[s.day] || s.day} ${s.start}${s.end ? '–' + s.end : ''}`)
    .join(', ');
}

export function validateSessions(sessions?: { day: string; start: string; end?: string }[]) {
  const allowedDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  if (!sessions) return true;
  for (const s of sessions) {
    if (!allowedDays.includes(s.day)) {
      throw new Error('Dia inválido em horários');
    }
    if (!/^\d{2}:\d{2}$/.test(s.start)) {
      throw new Error('Horário de início inválido. Use HH:MM');
    }
    if (s.end && !/^\d{2}:\d{2}$/.test(s.end)) {
      throw new Error('Horário de fim inválido. Use HH:MM');
    }
    if (s.end && s.start >= s.end) {
      throw new Error('Horário de início deve ser anterior ao fim');
    }
  }
  return true;
}
