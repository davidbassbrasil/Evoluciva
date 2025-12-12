# 🚀 SETUP COMPLETO DO BANCO DE DADOS - EVOLUCIVA

Este guia mostra a **ordem correta** de execução dos scripts SQL para replicar o sistema do zero.

## 📋 PRÉ-REQUISITOS

1. Projeto criado no Supabase
2. Acesso ao SQL Editor: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new`

---

## 🎯 ORDEM DE EXECUÇÃO DOS SCRIPTS

### **FASE 1: ESTRUTURA BÁSICA** (Core do Sistema)

Execute na ordem:

#### 1.1 Perfis de Usuário
```sql
-- Arquivo: profiles_and_policies.sql
-- Cria tabela profiles com campos básicos e políticas RLS iniciais
```

#### 1.2 Sistema de Cursos
```sql
-- Arquivo: supabase-schema-courses.sql
-- Cria tabelas: courses, course_tags
-- IMPORTANTE: Este é o core do sistema de cursos
```

#### 1.3 Sistema de Turmas
```sql
-- Arquivo: turmas-schema.sql
-- Cria tabela: turmas
-- Relaciona turmas com cursos
```

#### 1.4 Sistema de Aulas
```sql
-- Arquivo: lessons-schema.sql
-- Cria tabela: lessons
-- Relaciona aulas com turmas
```

#### 1.5 Progresso do Aluno
```sql
-- Arquivo: lesson-progress-schema.sql
-- Cria tabela: lesson_progress
-- Rastreia progresso de cada aluno em cada aula
```

#### 1.6 Sistema de Matrículas
```sql
-- Arquivo: enrollments-schema.sql
-- Cria tabela: enrollments
-- Registra matrículas de alunos em turmas
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
-- Cria tabela: banners
-- Para banners da página inicial
```

#### 4.2 Professores
```sql
-- Arquivo: professors_table.sql
-- Cria tabela: professors
-- Seção de professores na landing page
```

#### 4.3 Tags
```sql
-- Arquivo: tags_table.sql
-- Cria tabela: tags
-- Tags para categorizar cursos
```

#### 4.4 Depoimentos
```sql
-- Arquivo: testimonials_table.sql
-- Cria tabela: testimonials
-- Depoimentos de alunos
```

#### 4.5 FAQ
```sql
-- Arquivo: faq_table.sql
-- Cria tabela: faq
-- Perguntas frequentes
```

---

### **FASE 5: SISTEMA DE PERMISSÕES (RBAC)**

#### 5.1 Permissões e Moderadores
```sql
-- Arquivo: permissions-system.sql
-- Cria tabela: user_permissions
-- Função: has_permission()
-- Sistema completo de permissões por módulo
```

---

### **FASE 6: AJUSTES E CORREÇÕES**

Execute **APENAS** os que forem necessários após testar o sistema:

#### 6.1 Ajustes de ENUM e Tipos
```sql
-- Arquivo: add-cancelled-to-payment-status.sql
-- Adiciona status 'CANCELLED' ao enum de payment_status

-- Arquivo: add-cash-to-payment-type-enum.sql
-- Adiciona 'CASH' ao enum de billing_type

-- Arquivo: add-credit-card-installment-to-enum.sql
-- Adiciona 'CREDIT_CARD_INSTALLMENT' ao enum de billing_type

-- Arquivo: fix-webhook-logs-event-type.sql
-- IMPORTANTE: Altera event_type de ENUM para TEXT (evita erros com eventos novos)

-- Arquivo: fix-asaas-payment-id-nullable.sql
-- Torna asaas_payment_id nullable (permite criar payment antes de enviar ao Asaas)
```

#### 6.2 Ajustes de RLS e Políticas
```sql
-- Arquivo: fix-rls-recursion.sql
-- Cria função is_admin_or_moderator() para evitar recursão em RLS

-- Arquivo: moderator-read-policies.sql
-- Políticas de leitura para moderadores

-- Arquivo: fix-admin-payments-policies.sql
-- Ajusta políticas de payments para admin

-- Arquivo: fix-payments-policies-completo.sql
-- Políticas completas de payments (usar se houver problemas)

-- Arquivo: fix-public-tables-policies.sql
-- Políticas para tabelas públicas (banners, faq, etc)

-- Arquivo: fix-storage-policies.sql
-- Políticas para storage (upload de arquivos)
```

#### 6.3 Ajustes de Profiles e Roles
```sql
-- Arquivo: fix-moderator-enum.sql
-- Adiciona 'moderator' ao enum de roles

-- Arquivo: fix-moderator-role-FINAL.sql
-- Fix completo para adicionar moderator (usar este se o anterior não funcionar)

-- Arquivo: FIX-AGORA-VAI.sql
-- Fix alternativo para moderator role (último recurso)

-- Arquivo: profiles_update_policy.sql
-- Política para update de profiles

-- Arquivo: profiles_admin_policy.sql
-- Políticas específicas de admin para profiles
```

---

## 🎬 ORDEM RESUMIDA (SETUP RÁPIDO)

Para setup limpo do zero:

```sql
-- 1. CORE
1. profiles_and_policies.sql
2. supabase-schema-courses.sql
3. turmas-schema.sql
4. lessons-schema.sql
5. lesson-progress-schema.sql
6. enrollments-schema.sql

-- 2. PAGAMENTOS
7. payments-table.sql
8. payments-policies.sql
9. enrollments-payments-integration.sql
10. refunds-table.sql
11. refunds-policies.sql

-- 3. WEBHOOK
12. webhook-logs-table.sql
13. webhook-logs-policies.sql

-- 4. LANDING PAGE
14. banners_table.sql
15. professors_table.sql
16. tags_table.sql
17. testimonials_table.sql
18. faq_table.sql

-- 5. PERMISSÕES
19. permissions-system.sql

-- 6. FIXES ESSENCIAIS (execute depois de testar)
20. fix-webhook-logs-event-type.sql  -- IMPORTANTE: Mudar event_type para TEXT
21. add-cancelled-to-payment-status.sql
22. add-cash-to-payment-type-enum.sql
23. add-credit-card-installment-to-enum.sql
24. fix-rls-recursion.sql  -- IMPORTANTE: Evita recursão em RLS
25. moderator-read-policies.sql
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
