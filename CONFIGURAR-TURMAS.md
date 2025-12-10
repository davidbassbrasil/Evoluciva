# Configuração da Tabela Turmas

Este documento explica como configurar a tabela `turmas` no Supabase.

## Passo 1: Criar a Tabela no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá para o seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/turmas-schema.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

## Passo 2: Verificar a Criação

Execute a seguinte query para verificar se a tabela foi criada:

```sql
SELECT * FROM turmas LIMIT 10;
```

Você também pode verificar as políticas RLS:

```sql
SELECT * FROM pg_policies WHERE tablename = 'turmas';
```

## O que foi criado?

### Tabela `turmas`
A tabela possui os seguintes campos:

**Informações Básicas:**
- `id` - UUID (chave primária)
- `name` - Nome da turma
- `course_id` - Referência ao curso (FK para courses)

**Controle de Datas:**
- `sale_start_date` - Data de início das vendas
- `sale_end_date` - Data de fim das vendas
- `access_end_date` - Data em que o aluno perde acesso

**Vagas:**
- `presential_slots` - Número de vagas presenciais (0 = ilimitado)
- `online_slots` - Número de vagas online (0 = ilimitado)

**Preços:**
- `price` - Preço de venda (aparece na página principal)
- `original_price` - Preço original (para mostrar desconto)

**Status:**
- `status` - 'active' (vende), 'coming_soon' (em breve), 'inactive' (desativada)

**Formas de Pagamento:**
- `allow_credit_card` - Permite cartão de crédito à vista
- `allow_installments` - Permite parcelamento
- `max_installments` - Número máximo de parcelas
- `allow_debit_card` - Permite cartão de débito
- `allow_pix` - Permite PIX
- `allow_boleto` - Permite boleto bancário

**Descontos por Forma de Pagamento (%):**
- `discount_cash` - Desconto para cartão à vista
- `discount_pix` - Desconto para PIX
- `discount_debit` - Desconto para débito

**Cupom Promocional:**
- `coupon_code` - Código do cupom (único)
- `coupon_discount` - Desconto em % (100% = matrícula gratuita)

**Metadados:**
- `created_at` - Data de criação
- `updated_at` - Data de atualização (atualiza automaticamente)

### Políticas RLS

As políticas criadas permitem:
- **SELECT**: Qualquer um pode ler (para exibir turmas na página pública)
- **INSERT/UPDATE/DELETE**: Permissivo para desenvolvimento (posteriormente restringir apenas para admins)

### Índices

Criados índices para melhorar performance em:
- `course_id` - Para buscar turmas de um curso
- `status` - Para filtrar turmas ativas
- `sale_start_date, sale_end_date` - Para filtrar por período de vendas
- `coupon_code` - Para validar cupons rapidamente

## Funcionalidades Implementadas

### No Admin (/admin/turmas)

✅ **CRUD Completo de Turmas:**
- Criar nova turma com todos os campos
- Editar turma existente
- Excluir turma
- Listar todas as turmas com informações do curso

✅ **Formulário Organizado em Seções:**
1. Informações Básicas (nome, curso)
2. Datas de Controle (vendas e acesso)
3. Vagas e Status
4. Preços (original e venda)
5. Formas de Pagamento (5 opções com switches)
6. Descontos por Forma de Pagamento
7. Cupom Promocional

✅ **Validações:**
- Nome e curso são obrigatórios
- Números são convertidos corretamente
- Cupom em MAIÚSCULAS automaticamente

✅ **Exibição na Lista:**
- Imagem do curso (via JOIN)
- Nome da turma com badge de status
- Título do curso
- Datas de vendas
- Vagas presenciais e online
- Cupom (se houver)
- Preços (original riscado + preço de venda em destaque)

### Badges de Status

- 🟢 **Ativa** (verde) - Turma aberta para vendas
- 🟠 **Em Breve** (laranja) - Turma visível mas vendas bloqueadas
- ⚫ **Inativa** (cinza) - Turma desativada/oculta

## Próximos Passos (Integração)

### 1. Exibir Turmas na Página Principal

Atualizar `src/components/landing/CoursesSection.tsx` para:
- Buscar turmas ativas ao invés de cursos diretamente
- Filtrar por `status = 'active'` e datas de vendas válidas
- Exibir preço da turma (não do curso)
- Mostrar badge "Em Breve" para status `coming_soon`

### 2. Sistema de Cupons no Checkout

Adicionar em `src/pages/Checkout.tsx`:
- Campo para inserir código do cupom
- Validação do cupom contra a tabela turmas
- Aplicar desconto percentual
- Se 100% de desconto + usuário logado = matrícula gratuita (pular pagamento)

### 3. Controle de Vagas

Implementar:
- Decrementar `presential_slots` ou `online_slots` ao confirmar compra
- Verificar disponibilidade antes de permitir checkout
- Exibir "Vagas Esgotadas" quando slots chegarem a 0
- Bloquear novas matrículas quando não houver vagas

### 4. Validação de Datas de Venda

No checkout, verificar:
- Data atual >= `sale_start_date` (se definida)
- Data atual <= `sale_end_date` (se definida)
- Bloquear compra se fora do período de vendas
- Exibir mensagens: "Vendas não iniciadas" ou "Vendas encerradas"

### 5. Controle de Acesso do Aluno

Em `src/pages/aluno/Dashboard.tsx` e player:
- Verificar `access_end_date` ao carregar cursos comprados
- Ocultar curso se data atual > `access_end_date`
- Exibir mensagem "Acesso expirado em DD/MM/AAAA"
- Bloquear player de vídeo após expiração

### 6. Formas de Pagamento no Checkout

Atualizar checkout para:
- Consultar turma selecionada
- Mostrar apenas as formas de pagamento habilitadas
- Se `allow_installments = false`, ocultar opção de parcelamento
- Exibir `max_installments` como limite de parcelas
- Aplicar descontos automáticos por forma de pagamento:
  - `discount_cash` para cartão à vista
  - `discount_pix` para PIX
  - `discount_debit` para débito

## Estrutura de Dados Esperada

### Exemplo de Turma Completa

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Turma Janeiro 2024",
  "course_id": "123e4567-e89b-12d3-a456-426614174000",
  "sale_start_date": "2024-01-01",
  "sale_end_date": "2024-01-31",
  "access_end_date": "2024-12-31",
  "presential_slots": 30,
  "online_slots": 100,
  "status": "active",
  "price": 497.00,
  "original_price": 997.00,
  "allow_credit_card": true,
  "allow_installments": true,
  "max_installments": 12,
  "allow_debit_card": true,
  "allow_pix": true,
  "allow_boleto": true,
  "discount_cash": 5.00,
  "discount_pix": 10.00,
  "discount_debit": 5.00,
  "coupon_code": "PROMO50",
  "coupon_discount": 50.00,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Considerações de Segurança

### Para Produção (Ajustar Políticas RLS):

```sql
-- Apenas admins podem modificar turmas
DROP POLICY IF EXISTS "turmas_insert_all" ON turmas;
CREATE POLICY "turmas_insert_admin" ON turmas 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Similar para UPDATE e DELETE
DROP POLICY IF EXISTS "turmas_update_all" ON turmas;
CREATE POLICY "turmas_update_admin" ON turmas 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "turmas_delete_all" ON turmas;
CREATE POLICY "turmas_delete_admin" ON turmas 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## Testando a Implementação

1. Execute o SQL para criar a tabela
2. Acesse `/admin/turmas`
3. Clique em "Nova Turma"
4. Preencha o formulário completo
5. Salve e verifique se aparece na lista
6. Teste editar e excluir

## Troubleshooting

### "relation turmas does not exist"
- Você esqueceu de executar o SQL no Supabase
- Execute `supabase/turmas-schema.sql` no SQL Editor

### "permission denied for table turmas"
- As políticas RLS estão bloqueando
- Verifique se executou as políticas permissivas do schema
- Para debug, desabilite RLS temporariamente: `ALTER TABLE turmas DISABLE ROW LEVEL SECURITY;`

### Turmas não aparecem na lista
- Verifique se a política SELECT está ativa
- Teste query manual: `SELECT * FROM turmas;`
- Verifique console do navegador para erros

### Erro ao salvar turma
- Verifique se o `course_id` existe na tabela courses
- Confirme que todos os campos numéricos estão corretos
- Veja erros detalhados no toast de erro

---

**Status**: ✅ Implementação completa do CRUD de turmas no admin
**Próximo**: Integração com página principal e checkout
