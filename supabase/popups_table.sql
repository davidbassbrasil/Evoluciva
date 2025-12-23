-- =============================================
-- TABELA DE POPUPS
-- =============================================
-- Esta tabela guarda conteúdos que aparecem como popup na página principal

CREATE TABLE IF NOT EXISTS public.popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image','text')),
  title TEXT,
  content TEXT,
  image TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popups_active ON public.popups(active);
CREATE INDEX IF NOT EXISTS idx_popups_created_at ON public.popups(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_popups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popups_timestamp
BEFORE UPDATE ON public.popups
FOR EACH ROW
EXECUTE FUNCTION update_popups_updated_at();
