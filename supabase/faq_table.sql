-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data (5 FAQs from site)
INSERT INTO faqs (question, answer) VALUES
('Por quanto tempo tenho acesso ao curso?', 'Você terá acesso por 1 ano a partir da data de compra. Durante esse período, pode assistir às aulas quantas vezes quiser, no seu próprio ritmo.'),
('Posso assistir as aulas pelo celular?', 'Sim! Nossa plataforma é 100% responsiva e funciona perfeitamente em celulares, tablets e computadores. Estude onde e quando quiser.'),
('Como funciona a garantia?', 'Oferecemos garantia incondicional de 7 dias. Se não ficar satisfeito por qualquer motivo, devolvemos 100% do seu dinheiro.'),
('Os cursos possuem certificado?', 'Sim, todos os nossos cursos oferecem certificado de conclusão que pode ser usado para comprovar horas complementares.'),
('Posso tirar dúvidas com os professores?', 'Sim! Nossos cursos incluem um sistema de dúvidas onde você pode interagir diretamente com os professores e outros alunos.');

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read FAQs
CREATE POLICY "Anyone can view faqs"
ON faqs FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Only admins can insert FAQs
CREATE POLICY "Only admins can insert faqs"
ON faqs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update FAQs
CREATE POLICY "Only admins can update faqs"
ON faqs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can delete FAQs
CREATE POLICY "Only admins can delete faqs"
ON faqs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
