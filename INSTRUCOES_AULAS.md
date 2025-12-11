# Instruções para Configurar o Sistema de Aulas

## Passo 1: Executar os Schemas SQL no Supabase

Acesse o SQL Editor do Supabase e execute os seguintes arquivos na ordem:

### 1. Tabela de Aulas (lessons)
Execute o arquivo: `supabase/lessons-schema.sql`

Este schema cria:
- Tabela `lessons` ligada às turmas
- Campos: título do módulo, título da aula, ordem, URL do vídeo, link de material, descrição
- Índices e políticas RLS

### 2. Tabela de Progresso (lesson_progress)
Execute o arquivo: `supabase/lesson-progress-schema.sql`

Este schema cria:
- Tabela `lesson_progress` para rastrear progresso dos alunos
- Campos: profile_id, lesson_id, completed, last_watched_at
- Políticas RLS para permitir que alunos vejam/editem apenas seu próprio progresso

## Passo 2: Fluxo de Uso

### Para Admins (em /admin/aulas):
1. Clique em "+ Novo" para criar uma nova aula
2. Selecione a **Turma** (que já deve estar criada em /admin/turmas)
3. Defina o **Título do Módulo** (ex: "Módulo 1 - Introdução")
4. Defina o **Título da Aula** (ex: "Aula 01 - Conceitos Fundamentais")
5. Defina a **Ordem** da aula no módulo
6. Cole a **URL do Vídeo** (YouTube ou Vimeo)
7. (Opcional) Adicione um **Link de Material** de apoio
8. (Opcional) Adicione uma **Descrição** da aula
9. Clique em "Salvar Aula"

As aulas serão agrupadas por turma e módulo na listagem.

### Para Alunos (em /aluno/dashboard):
1. O aluno verá apenas as turmas em que está matriculado
2. Cada card mostra:
   - Nome da turma
   - Título do curso
   - Número total de aulas
   - Número de aulas concluídas
   - Percentual de progresso
3. Ao clicar em "Começar" ou "Continuar", o aluno é direcionado para o player

### Player do Aluno (em /aluno/curso/:turmaId):
1. Vídeo principal da aula atual
2. Informações da aula:
   - Badge com o nome do módulo
   - Título da aula
   - Descrição (se houver)
   - Link para material de apoio (se houver)
3. Botão "Marcar como concluída"
4. Barra lateral com todas as aulas organizadas por módulo
5. Indicadores visuais:
   - ✓ Verde: aula concluída
   - ▶ Azul: aula atual
   - ○ Cinza: aula não iniciada

## Passo 3: Testar o Fluxo Completo

1. **Como Admin:**
   - Vá para `/admin/aulas`
   - Crie aulas para uma turma existente
   - Organize as aulas em módulos diferentes

2. **Como Aluno:**
   - Certifique-se de que o aluno tem um enrollment na turma
   - Faça login como aluno
   - Veja a turma no dashboard
   - Entre no player e assista as aulas
   - Marque aulas como concluídas
   - Verifique se o progresso é atualizado

## Estrutura de URLs

- Admin - Gerenciar Aulas: `/admin/aulas`
- Aluno - Dashboard: `/aluno/dashboard`
- Aluno - Player do Curso: `/aluno/curso/:turmaId`

## Observações Importantes

1. **URLs de Vídeo:** O sistema converte automaticamente URLs do YouTube e Vimeo para formato embed:
   - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
   - Vimeo: `https://vimeo.com/VIDEO_ID` → `https://player.vimeo.com/video/VIDEO_ID`

2. **Progresso:** O progresso é calculado automaticamente baseado nas aulas marcadas como concluídas

3. **Módulos:** As aulas são automaticamente agrupadas por módulo no player

4. **Ordem:** A ordem das aulas dentro de cada módulo é definida pelo campo `lesson_order`

## Troubleshooting

Se o aluno não conseguir ver as turmas:
- Verifique se há um registro na tabela `enrollments` ligando o `profile_id` do aluno ao `turma_id`
- Verifique as políticas RLS da tabela `enrollments`

Se as aulas não aparecerem no player:
- Verifique se as aulas estão associadas à `turma_id` correta
- Verifique se há aulas criadas para essa turma em `/admin/aulas`
