-- ============================================
-- SCHEMA SUPABASE - CURSOS
-- ============================================
-- Este arquivo contém a estrutura completa das tabelas
-- relacionadas a cursos, aulas e configurações
-- ============================================

-- 1. TABELA: courses
-- Armazena informações dos cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  whats_included TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image TEXT,
  instructor TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '0h',
  lessons INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(active);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses(featured);
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON public.courses(display_order);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- Comentários
COMMENT ON TABLE public.courses IS 'Cursos disponíveis na plataforma';
COMMENT ON COLUMN public.courses.title IS 'Título do curso';
COMMENT ON COLUMN public.courses.description IS 'Descrição curta (para cards)';
COMMENT ON COLUMN public.courses.full_description IS 'Descrição completa (página individual)';
COMMENT ON COLUMN public.courses.whats_included IS 'Lista do que está incluso no curso';
COMMENT ON COLUMN public.courses.active IS 'Se o curso está ativo/visível na página principal';
COMMENT ON COLUMN public.courses.display_order IS 'Ordem de exibição (menor = primeiro)';
COMMENT ON COLUMN public.courses.slug IS 'URL amigável gerada a partir do título';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABELA: lessons
-- Armazena aulas de cada curso
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT NOT NULL,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons(course_id, order_index);

-- Comentários
COMMENT ON TABLE public.lessons IS 'Aulas de cada curso';
COMMENT ON COLUMN public.lessons.course_id IS 'Referência ao curso';
COMMENT ON COLUMN public.lessons.order_index IS 'Ordem da aula no curso';
COMMENT ON COLUMN public.lessons.is_free IS 'Se a aula é gratuita (preview)';

-- Trigger para updated_at
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - COURSES
-- ============================================

-- Permitir leitura pública de cursos ativos
CREATE POLICY "Permitir leitura pública de cursos ativos"
  ON public.courses
  FOR SELECT
  USING (active = true);

-- Permitir leitura de todos os cursos para usuários autenticados (admin)
CREATE POLICY "Permitir leitura de todos os cursos para autenticados"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir inserção para usuários autenticados (admin)
CREATE POLICY "Permitir inserção de cursos para autenticados"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir atualização para usuários autenticados (admin)
CREATE POLICY "Permitir atualização de cursos para autenticados"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para usuários autenticados (admin)
CREATE POLICY "Permitir exclusão de cursos para autenticados"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- POLICIES - LESSONS
-- ============================================

-- Permitir leitura pública de aulas (para verificar estrutura do curso)
CREATE POLICY "Permitir leitura pública de aulas"
  ON public.lessons
  FOR SELECT
  USING (true);

-- Permitir inserção para usuários autenticados (admin)
CREATE POLICY "Permitir inserção de aulas para autenticados"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir atualização para usuários autenticados (admin)
CREATE POLICY "Permitir atualização de aulas para autenticados"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para usuários autenticados (admin)
CREATE POLICY "Permitir exclusão de aulas para autenticados"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 4. STORAGE BUCKET (para imagens)
-- ============================================
-- Execute no console do Supabase Storage:
-- 
-- 1. Criar bucket 'images' (se não existir)
-- 2. Tornar o bucket público
-- 3. Configurar políticas de acesso:

-- Policy para permitir upload de imagens (autenticados)
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'Permitir upload para autenticados',
--   'images',
--   'bucket_id = ''images'' AND auth.role() = ''authenticated'''
-- );

-- Policy para permitir leitura pública
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'Permitir leitura pública',
--   'images',
--   'bucket_id = ''images'''
-- );

-- ============================================
-- 5. DADOS DE EXEMPLO (OPCIONAL - para testes)
-- ============================================
-- Descomentar para inserir dados de exemplo

/*
INSERT INTO public.courses (
  title,
  description,
  full_description,
  whats_included,
  price,
  original_price,
  image,
  instructor,
  duration,
  lessons,
  category,
  featured,
  active,
  display_order,
  slug
) VALUES
(
  'Português Completo para Concursos',
  'Domine a língua portuguesa com técnicas avançadas de interpretação e gramática',
  'Curso completo de Português voltado para concursos públicos. Aborda gramática, interpretação de texto, redação e questões comentadas das principais bancas (CESPE, FCC, FGV). Material atualizado e com foco em aprovação.',
  '• 60 horas de videoaulas em Full HD
• Material em PDF para download
• 500+ exercícios comentados
• Simulados com correção automática
• Certificado de conclusão
• Acesso por 12 meses
• Suporte por WhatsApp',
  297.00,
  497.00,
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop',
  'Prof. Maria Santos',
  '60 horas',
  45,
  'Português',
  true,
  true,
  1,
  'portugues-completo-para-concursos'
),
(
  'Raciocínio Lógico Descomplicado',
  'Aprenda lógica de forma simples e direta, do básico ao avançado',
  'O curso mais didático de Raciocínio Lógico do mercado. Aprenda proposições, tabela verdade, lógica de argumentação, diagramas lógicos, sequências e muito mais. Metodologia exclusiva que transforma conteúdo complexo em aprendizado fácil.',
  '• 40 horas de videoaulas práticas
• Resolução de 300+ questões
• Macetes e técnicas exclusivas
• Material teórico completo
• Lista de exercícios por nível
• Certificado digital
• Fórum de dúvidas',
  247.00,
  397.00,
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=500&fit=crop',
  'Prof. Carlos Lima',
  '40 horas',
  35,
  'Raciocínio Lógico',
  true,
  true,
  2,
  'raciocinio-logico-descomplicado'
);
*/

-- ============================================
-- 6. FUNÇÕES ÚTEIS
-- ============================================

-- Função para gerar slug automaticamente
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(text_input),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para gerar slug automaticamente ao inserir/atualizar
CREATE OR REPLACE FUNCTION set_course_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_course_slug_trigger
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION set_course_slug();

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('courses', 'lessons');
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('courses', 'lessons');
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('courses', 'lessons');
