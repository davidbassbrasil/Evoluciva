# 🚀 SETUP COMPLETO DO BANCO DE DADOS - EVOLUCIVA

Este guia mostra a **ordem correta** de execução dos scripts SQL para replicar o sistema do zero.

## 📋 PRÉ-REQUISITOS

1. Projeto criado no Supabase
2. Acesso ao SQL Editor: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new`
3. Configurar Storage Bucket "images" (para banners, professores, etc.)

---

## 🎯 ORDEM DE EXECUÇÃO DOS SCRIPTS

### **FASE 1: ESTRUTURA BÁSICA** (Core do Sistema)

Execute na ordem **EXATA**:

#### 1.1 Perfis de Usuário (OBRIGATÓRIO - PRIMEIRO)
```sql
-- Arquivo: profiles_and_policies.sql
-- Cria tabela profiles com campos básicos e políticas RLS iniciais
-- Roles: student, admin
-- IMPORTANTE: Todas as outras tabelas dependem de profiles
```

#### 1.2 Sistema de Cursos (CORE)
```sql
-- Arquivo: supabase-schema-courses.sql
-- Cria tabela: courses
-- IMPORTANTE: Base para turmas, professores, tags, upsells
-- Inclui: slug, display_order, active, featured
```

#### 1.3 Sistema de Turmas
```sql
-- Arquivo: turmas-schema.sql
-- Cria tabela: turmas
-- Relaciona turmas com cursos (FK: course_id)
-- DEPENDÊNCIA: courses
```

#### 1.4 Sistema de Aulas
```sql
-- Arquivo: lessons-schema.sql
-- Cria tabela: lessons
-- Relaciona aulas com turmas (FK: turma_id)
-- DEPENDÊNCIA: turmas
```

#### 1.5 Progresso do Aluno
```sql
-- Arquivo: lesson-progress-schema.sql
-- Cria tabela: lesson_progress
-- Rastreia progresso: profiles + lessons
-- DEPENDÊNCIAS: profiles, lessons
```

#### 1.6 Sistema de Matrículas
```sql
-- Arquivo: enrollments-schema.sql
-- Cria tabela: enrollments
-- Registra matrículas: profiles + turmas
-- DEPENDÊNCIAS: profiles, turmas
```

---

### **FASE 2: SISTEMA DE PAGAMENTOS**

#### 2.1 Tabela de Pagamentos
```sql
-- Arquivo: payments-table.sql
-- Cria tabela: payments
-- Integração com Asaas (gateway de pagamento)
```

#### 2.2 Políticas de Pagamentos
```sql
-- Arquivo: payments-policies.sql
-- Define políticas RLS para a tabela payments
```

#### 2.3 Integração Pagamentos ↔ Matrículas
```sql
-- Arquivo: enrollments-payments-integration.sql
-- Cria triggers que ativam matrícula automaticamente ao confirmar pagamento
-- CRÍTICO para o fluxo de vendas
```

#### 2.4 Sistema de Estornos/Reembolsos
```sql
-- Arquivo: refunds-table.sql
-- Cria tabela: refunds
-- Sistema de estorno de pagamentos
```

```sql
-- Arquivo: refunds-policies.sql
-- Políticas RLS para refunds
```

---

### **FASE 3: WEBHOOK E LOGS**

#### 3.1 Tabela de Logs de Webhook
```sql
-- Arquivo: webhook-logs-table.sql
-- Cria tabela: webhook_logs
-- Registra todos os webhooks recebidos do Asaas
```

#### 3.2 Políticas de Webhook Logs
```sql
-- Arquivo: webhook-logs-policies.sql
-- RLS para webhook_logs
```

---

### **FASE 4: CONTEÚDO E LANDING PAGE**

#### 4.1 Banners
```sql
-- Arquivo: banners_table.sql
-- Cria tabela: banners (ordem, imagem, link)
-- DEPENDÊNCIA: Storage bucket "images" criado
-- Para carrossel da página inicial
```

#### 4.2 Professores
```sql
-- Arquivo: professors_table.sql
-- Cria tabela: professors (nome, specialty, bio, imagem)
-- DEPENDÊNCIA: Storage bucket "images" criado
-- Seção de professores na landing page
```

#### 4.3 Relacionamento Professores ↔ Cursos
```sql
-- Arquivo: professor-courses-relationship.sql
-- Cria tabela: professor_courses (many-to-many)
-- Adiciona slug aos professores (/professor/slug)
-- DEPENDÊNCIAS: professors, courses
-- IMPORTANTE: Execute DEPOIS de professors_table.sql
```

#### 4.4 Tags
```sql
-- Arquivo: tags_table.sql
-- Cria tabela: tags (nome, cor)
-- Tags para categorizar cursos
-- DEPENDÊNCIA: profiles (RLS usa role)
```

#### 4.5 Relacionamento Tags ↔ Cursos
```sql
-- Arquivo: add-course-id-to-tags.sql
-- Adiciona course_id na tabela tags
-- Relaciona tags com cursos
-- DEPENDÊNCIAS: tags, courses
-- IMPORTANTE: Execute DEPOIS de tags_table.sql
```

#### 4.6 Upsells de Cursos
```sql
-- Arquivo: course-upsells-table.sql
-- Cria tabela: course_upsells (many-to-many)
-- Um curso pode ter outros como upsell
-- DEPENDÊNCIAS: courses, profiles
```

#### 4.7 Depoimentos
```sql
-- Arquivo: testimonials_table.sql
-- Cria tabela: testimonials (nome, curso, texto, avatar, rating)
-- Depoimentos de alunos
-- DEPENDÊNCIA: profiles (RLS usa role)
```

#### 4.8 FAQ
```sql
-- Arquivo: faq_table.sql
-- Cria tabela: faq (pergunta, resposta, ordem)
-- Perguntas frequentes
-- DEPENDÊNCIA: profiles (RLS usa role)
```

---

### **FASE 5: SISTEMA DE PERMISSÕES (RBAC)**

#### 5.1 Permissões e Moderadores
```sql
-- Arquivo: permissions-system.sql
-- Adiciona role 'moderator' ao enum user_role
-- Cria tabela: user_permissions
-- Cria função: has_permission()
-- Sistema completo de permissões por módulo
-- DEPENDÊNCIA: profiles
-- IMPORTANTE: Adiciona novo role ao sistema
```

---

### **FASE 6: AJUSTES E MELHORIAS** (Executar em Ordem)

#### 6.1 Ajustes Críticos de Tipos de Dados
```sql
-- Arquivo: fix-webhook-logs-event-type.sql
-- ⚠️ CRÍTICO: Altera event_type de ENUM para TEXT
-- Evita erros com eventos novos do Asaas
-- DEPENDÊNCIA: webhook_logs
-- Execute SEMPRE após webhook-logs-table.sql
```

```sql
-- Arquivo: fix-asaas-payment-id-nullable.sql
-- Torna asaas_payment_id nullable
-- Permite criar payment antes de enviar ao Asaas
-- DEPENDÊNCIA: payments
```

#### 6.2 Melhorias de ENUM (Opcionais, mas recomendados)
```sql
-- Arquivo: add-cancelled-to-payment-status.sql
-- Adiciona status 'CANCELLED' ao enum payment_status
-- Para pagamentos cancelados pelo usuário
-- DEPENDÊNCIA: payments
```

```sql
-- Arquivo: add-cash-to-payment-type-enum.sql
-- Adiciona 'CASH' ao enum billing_type
-- Para pagamentos em dinheiro (presencial)
-- DEPENDÊNCIA: payments
```

```sql
-- Arquivo: add-credit-card-installment-to-enum.sql
-- Adiciona 'CREDIT_CARD_INSTALLMENT' ao enum billing_type
-- Para parcelamento no cartão
-- DEPENDÊNCIA: payments
```

```sql
-- Arquivo: add-start-date-to-turmas.sql
-- Adiciona campo start_date na tabela turmas
-- Para controlar data de início das aulas
-- DEPENDÊNCIA: turmas
```

#### 6.3 Ajustes de RLS e Políticas (IMPORTANTE)
```sql
-- Arquivo: fix-rls-recursion.sql
-- ⚠️ IMPORTANTE: Cria função is_admin_or_moderator()
-- Evita recursão infinita em políticas RLS
-- DEPENDÊNCIA: profiles
-- Execute ANTES de adicionar políticas complexas
```

```sql
-- Arquivo: moderator-read-policies.sql
-- Políticas de leitura para moderadores
-- Permite moderadores visualizarem dados
-- DEPENDÊNCIAS: profiles, permissions-system.sql
```

```sql
-- Arquivo: fix-admin-payments-policies.sql
-- Ajusta políticas de payments para admin
-- DEPENDÊNCIA: payments, fix-rls-recursion.sql
```

```sql
-- Arquivo: fix-public-tables-policies.sql
-- Políticas para tabelas públicas (banners, faq, testimonials, etc)
-- Permite leitura pública, escrita apenas admin/moderador
-- DEPENDÊNCIAS: banners, faq, testimonials, tags, professors
```

```sql
-- Arquivo: fix-storage-policies.sql
-- Políticas para Supabase Storage
-- Permite admin/moderador fazer upload
-- Permite leitura pública de imagens
-- DEPENDÊNCIA: Storage bucket "images" criado
```

---

## 🎬 ORDEM RESUMIDA (SETUP RÁPIDO)

Para setup limpo do zero, execute **NESTA ORDEM EXATA**:

```sql
-- ==========================================
-- 1. ESTRUTURA BASE (OBRIGATÓRIO, NESTA ORDEM)
-- ==========================================
1. profiles_and_policies.sql              -- PRIMEIRO! Tudo depende dele
2. supabase-schema-courses.sql            -- Depende: profiles
3. turmas-schema.sql                       -- Depende: courses
4. lessons-schema.sql                      -- Depende: turmas
5. lesson-progress-schema.sql              -- Depende: profiles + lessons
6. enrollments-schema.sql                  -- Depende: profiles + turmas

-- ==========================================
-- 2. SISTEMA DE PAGAMENTOS (OBRIGATÓRIO, NESTA ORDEM)
-- ==========================================
7. payments-table.sql                      -- Depende: profiles + enrollments
8. payments-policies.sql                   -- Depende: payments
9. enrollments-payments-integration.sql    -- Depende: enrollments + payments
10. refunds-table.sql                      -- Depende: payments
11. refunds-policies.sql                   -- Depende: refunds

-- ==========================================
-- 3. WEBHOOKS (OBRIGATÓRIO)
-- ==========================================
12. webhook-logs-table.sql                 -- Depende: payments
13. webhook-logs-policies.sql              -- Depende: webhook_logs
14. fix-webhook-logs-event-type.sql        -- ⚠️ CRÍTICO: Execute imediatamente após item 13

-- ==========================================
-- 4. CONTEÚDO E LANDING PAGE (OBRIGATÓRIO, NESTA ORDEM)
-- ==========================================
15. banners_table.sql                      -- Depende: profiles (RLS)
16. testimonials_table.sql                 -- Depende: profiles (RLS)
17. faq_table.sql                          -- Depende: profiles (RLS)
18. professors_table.sql                   -- Depende: profiles (RLS)
19. professor-courses-relationship.sql     -- Depende: professors + courses
20. tags_table.sql                         -- Depende: profiles (RLS)
21. add-course-id-to-tags.sql              -- Depende: tags + courses
22. course-upsells-table.sql               -- Depende: courses

-- ==========================================
-- 5. PERMISSÕES E ROLES (OBRIGATÓRIO)
-- ==========================================
23. permissions-system.sql                 -- Depende: profiles (adiciona 'moderator' role)

-- ==========================================
-- 6. AJUSTES E MELHORIAS (RECOMENDADO)
-- ==========================================
24. fix-asaas-payment-id-nullable.sql      -- Depende: payments
25. add-cancelled-to-payment-status.sql    -- Depende: payments (adiciona status CANCELLED)
26. add-cash-to-payment-type-enum.sql      -- Depende: payments (adiciona billing_type CASH)
27. add-credit-card-installment-to-enum.sql-- Depende: payments (adiciona CREDIT_CARD_INSTALLMENT)
28. add-start-date-to-turmas.sql           -- Depende: turmas (adiciona campo start_date)
29. fix-rls-recursion.sql                  -- ⚠️ IMPORTANTE: Evita recursão RLS
30. moderator-read-policies.sql            -- Depende: profiles + permissions-system.sql
31. fix-admin-payments-policies.sql        -- Depende: payments + fix-rls-recursion.sql
32. fix-public-tables-policies.sql         -- Depende: banners, faq, testimonials, tags, professors
33. fix-storage-policies.sql               -- Necessário criar bucket "images" antes
```

---

## 🔧 FIXES CRÍTICOS (Sempre Execute)

Após rodar os scripts principais, **SEMPRE** execute estes:

```sql
-- 1. Permitir qualquer evento de webhook
ALTER TABLE webhook_logs ALTER COLUMN event_type TYPE TEXT;

-- 2. Permitir múltiplos IPs no webhook log
ALTER TABLE webhook_logs ALTER COLUMN source_ip TYPE TEXT;

-- 3. Criar função para evitar recursão RLS (se ainda não existir)
-- Execute o arquivo: fix-rls-recursion.sql
```

---

## 📝 ARQUIVOS QUE PODEM SER IGNORADOS

Estes arquivos foram fixes intermediários durante o desenvolvimento. Use os listados acima:

- `profiles_quick-fix.sql` → Use `fix-moderator-role-FINAL.sql` ao invés
- `fix-payments-user-update-policy.sql` → Já incluído em `fix-payments-policies-completo.sql`
- `setup-completo.sql` → Pode conter código desatualizado, use a lista acima
- `setup-estornos.sql` → Já incluído em `refunds-table.sql` + `refunds-policies.sql`
- `supabase-schema-courses_fix-policies.sql` → Já incluído em `fix-public-tables-policies.sql`

---

## ✅ CHECKLIST PÓS-SETUP

Após executar todos os scripts:

- [ ] Tabelas criadas: `profiles`, `courses`, `turmas`, `lessons`, `lesson_progress`, `enrollments`, `payments`, `refunds`, `webhook_logs`, `user_permissions`
- [ ] Tabelas de conteúdo: `banners`, `professors`, `tags`, `testimonials`, `faq`
- [ ] Função `has_permission()` criada
- [ ] Função `is_admin_or_moderator()` criada
- [ ] Trigger `activate_enrollment_on_payment` criado
- [ ] RLS habilitado em todas as tabelas
- [ ] Edge Function `asaas-webhook` deployada
- [ ] Webhook configurado no Asaas: `https://[PROJECT_ID].supabase.co/functions/v1/asaas-webhook`

---

## 🚨 TROUBLESHOOTING

### Erro: "duplicate key value violates unique constraint"
- Você tentou criar algo que já existe
- Pode pular esse script ou dropar a tabela antes: `DROP TABLE IF EXISTS [nome] CASCADE;`

### Erro: "type [enum_name] already exists"
- O ENUM já foi criado
- Pode pular ou dropar: `DROP TYPE IF EXISTS [nome] CASCADE;`

### Erro: "relation [table] does not exist"
- Você pulou algum script ou executou fora de ordem
- Volte e execute os scripts anteriores

### Erro: "invalid input syntax for type inet"
- Execute: `ALTER TABLE webhook_logs ALTER COLUMN source_ip TYPE TEXT;`

### Erro: "new row violates check constraint profiles_role_check"
- Execute: `fix-moderator-role-FINAL.sql`

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **Pagamentos**: Ver `INSTALACAO_PAGAMENTOS.md`
- **Estornos**: Ver `SISTEMA_ESTORNOS.md`
- **Asaas**: Ver `CONFIGURACAO_ASAAS.md` e `VERIFICAR_ASAAS.md`
- **Webhook**: Ver `TROUBLESHOOTING_WEBHOOK.md`

---

**Última atualização:** 11/12/2025
**Versão do Sistema:** 1.0
