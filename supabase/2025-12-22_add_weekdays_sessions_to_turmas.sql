-- Migration: adicionar colunas weekdays (text[]) e sessions (jsonb) em turmas
ALTER TABLE IF EXISTS turmas
  ADD COLUMN IF NOT EXISTS weekdays TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;

-- Comentários
COMMENT ON COLUMN turmas.weekdays IS 'Dias da semana da turma em abreviação: Mon, Tue, Wed, Thu, Fri, Sat, Sun (text[])';
COMMENT ON COLUMN turmas.sessions IS 'Lista de sessões (JSONB) [{day, start, end}]';
