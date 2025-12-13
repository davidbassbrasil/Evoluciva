# Sistema de Controle de Módulos

## 📦 Visão Geral

Sistema completo para gerenciamento de entregas de módulos físicos para alunos matriculados em turmas.

## 🎯 Funcionalidades

### 1. Dashboard de Estatísticas
- Total de módulos em estoque
- Quantidade de módulos entregues
- Módulos disponíveis para entrega
- Visualização em cards informativos

### 2. Gestão de Módulos (CRUD)
- ✅ **Criar** - Cadastrar novos módulos vinculados a turmas
- ✅ **Editar** - Atualizar informações de módulos existentes
- ✅ **Excluir** - Remover módulos (remove também registros de entrega)
- ✅ **Listar** - Visualizar todos os módulos com informações agregadas

### 3. Filtros e Busca
- Filtrar módulos por turma específica
- Busca por nome do módulo, turma ou curso
- Visualização de progresso de entregas por módulo

### 4. Controle de Entregas
- Lista completa de alunos matriculados na turma
- Checkbox para marcar/desmarcar entrega individual
- Registro automático de data/hora da entrega
- Registro de quem realizou a entrega
- Busca de alunos por nome ou email
- Barra de progresso visual das entregas

### 5. Exportação em PDF
- Relatório completo de entregas por módulo
- Inclui:
  - Nome do módulo e turma
  - Lista de todos os alunos
  - Status de entrega (Sim/Não)
  - Data da entrega
  - Estatísticas de progresso

## 🗄️ Estrutura do Banco de Dados

### Tabela: `modules`
```sql
- id (UUID, PK)
- name (VARCHAR)
- turma_id (UUID, FK → turmas)
- stock_quantity (INTEGER)
- description (TEXT, opcional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK → auth.users)
```

### Tabela: `module_deliveries`
```sql
- id (UUID, PK)
- module_id (UUID, FK → modules)
- student_id (UUID, FK → profiles)
- delivered_at (TIMESTAMP)
- delivered_by (UUID, FK → auth.users)
- notes (TEXT, opcional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(module_id, student_id) - Um aluno só pode receber o mesmo módulo uma vez
```

### View: `modules_with_stats`
Agregação automática de estatísticas:
- Informações da turma e curso
- Contagem de entregas realizadas
- Módulos disponíveis
- Total de alunos na turma

## 🚀 Como Usar

### 1. Configurar o Banco de Dados

Execute o script SQL no Supabase:
```bash
supabase/modules-schema.sql
```

Este script criará:
- ✅ Tabelas `modules` e `module_deliveries`
- ✅ Índices para performance
- ✅ RLS Policies (apenas admin/moderadores)
- ✅ Triggers para updated_at
- ✅ View com estatísticas agregadas

### 2. Permissões

O sistema respeita permissões do sistema de acesso:
- **Admin**: Acesso total
- **Moderador**: Precisa da permissão `modulos` cadastrada

Para adicionar permissão a um moderador:
```sql
INSERT INTO user_permissions (user_id, permission_key)
VALUES ('[user_id]', 'modulos');
```

### 3. Acessar o Menu

Navegue para: **Admin → Módulos** (`/admin/modulos`)

### 4. Fluxo de Trabalho

#### Passo 1: Cadastrar Módulo
1. Clique em "Novo Módulo"
2. Preencha:
   - Nome do módulo (ex: "Módulo 1 - Introdução")
   - Selecione a turma
   - Quantidade em estoque
   - Descrição (opcional)
3. Clique em "Criar"

#### Passo 2: Gerenciar Entregas
1. Localize o módulo na lista
2. Clique no botão "Entregas"
3. Visualize a lista de alunos matriculados
4. Marque o checkbox ao lado do nome do aluno para registrar entrega
5. Desmarque para remover o registro de entrega

#### Passo 3: Exportar Relatório
1. Na tela de entregas, clique em "Exportar PDF"
2. O PDF será baixado automaticamente com:
   - Cabeçalho com info do módulo
   - Estatísticas de entrega
   - Tabela completa de alunos e status

#### Passo 4: Editar/Excluir
1. Clique no menu "⋮" ao lado do módulo
2. Selecione "Editar" ou "Excluir"
3. Confirme a ação

## 📊 Indicadores na Interface

### Card do Módulo na Lista
- **Estoque**: Badge cinza com quantidade total
- **Entregues**: Badge verde com quantidade entregue
- **Alunos**: Badge com total de alunos matriculados
- **Progresso**: Barra visual + percentual

### Tela de Entregas
- Cards de estatísticas no topo
- Barra de progresso geral
- Busca de alunos
- Badges de status:
  - 🟢 Verde: Entregue
  - 🟠 Laranja: Pendente

## 🔧 Tecnologias Utilizadas

- **React** + TypeScript
- **Supabase** (Banco de dados + Auth + RLS)
- **shadcn/ui** (Componentes)
- **jsPDF** + **jspdf-autotable** (Exportação PDF)
- **Lucide React** (Ícones)
- **React Router** (Navegação)

## 📁 Arquivos Criados

```
📦 Projeto
├── 📂 supabase/
│   └── modules-schema.sql              # Schema do banco
├── 📂 src/
│   ├── 📂 types/
│   │   └── index.ts                    # Tipos: Module, ModuleDelivery
│   ├── 📂 lib/
│   │   └── moduleService.ts            # Hooks e funções CRUD
│   ├── 📂 components/admin/
│   │   ├── ModuleFormDialog.tsx        # Dialog de criar/editar
│   │   ├── ModuleDeliveriesDialog.tsx  # Controle de entregas + PDF
│   │   └── AdminLayout.tsx             # Menu atualizado
│   ├── 📂 pages/admin/
│   │   └── Modulos.tsx                 # Página principal
│   ├── App.tsx                          # Rota adicionada
│   └── jspdf-autotable.d.ts            # Tipos do jspdf-autotable
```

## 🎨 Design System

O sistema segue o padrão visual do restante do admin:
- Cards com sombras e bordas arredondadas
- Cores do Tailwind CSS (primary, secondary, etc.)
- Animações suaves
- Responsivo para mobile

## 🔐 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Apenas admin/moderadores podem acessar
- ✅ Registro automático de quem criou/entregou
- ✅ Validações no frontend e backend
- ✅ Prevenção de duplicatas (UNIQUE constraint)

## 📝 Melhorias Futuras Possíveis

- [ ] Histórico de entregas (quem removeu uma entrega)
- [ ] Notificação por email ao registrar entrega
- [ ] Importação em massa de módulos via CSV
- [ ] Código de barras/QR Code para módulos
- [ ] Assinatura digital do aluno no recebimento
- [ ] Dashboard com gráficos de entregas ao longo do tempo
- [ ] Filtros por data de entrega
- [ ] Exportação em Excel além de PDF

## 🆘 Troubleshooting

### Erro: "Permissão negada"
- Verifique se o usuário tem role 'admin' ou 'moderator'
- Para moderadores, confirme que a permissão 'modulos' está cadastrada

### Módulos não aparecem
- Execute o SQL no Supabase
- Verifique se as RLS policies foram criadas
- Confirme que há turmas cadastradas

### PDF não exporta
- Verifique se as bibliotecas foram instaladas: `npm install jspdf jspdf-autotable`
- Limpe o cache do navegador

### Erro ao marcar entrega
- Confirme que o aluno está matriculado na turma
- Verifique se já existe uma entrega (não permite duplicatas)

---

**Desenvolvido com ❤️ para Evoluciva**
