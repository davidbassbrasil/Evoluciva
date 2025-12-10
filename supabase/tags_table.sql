-- =============================================
-- TABELA DE TAGS
-- =============================================
-- Esta tabela armazena as tags para categorização de cursos

-- 1. Criar a tabela de tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para ADMIN

-- Admin pode ver todas as tags
CREATE POLICY "Admins podem visualizar tags"
ON public.tags
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode inserir tags
CREATE POLICY "Admins podem inserir tags"
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar tags
CREATE POLICY "Admins podem atualizar tags"
ON public.tags
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode deletar tags
CREATE POLICY "Admins podem deletar tags"
ON public.tags
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Política pública para visualização (usuários não autenticados podem ver tags no site)
CREATE POLICY "Qualquer um pode visualizar tags"
ON public.tags
FOR SELECT
TO anon
USING (true);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tags_timestamp
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION update_tags_updated_at();

-- =============================================
-- DADOS INICIAIS (OPCIONAL)
-- =============================================
-- Inserir algumas tags exemplo se desejar:

INSERT INTO public.tags (name, color) VALUES
  ('Concursos', '#3B82F6'),
  ('Direito', '#8B5CF6'),
  ('Matemática', '#EF4444'),
  ('Português', '#10B981'),
  ('Informática', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- COMO USAR
-- =============================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Pronto! O admin pode gerenciar tags via interface
