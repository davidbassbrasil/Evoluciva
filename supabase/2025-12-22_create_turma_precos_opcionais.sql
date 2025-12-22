-- Migration: criar tabela de preços opcionais por turma (online / presencial)
-- Adiciona registros que substituem o preço final enquanto ativos (ordena por expires_at asc)

create table if not exists public.turma_precos_opcionais (
  id uuid not null default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  label text null,
  price numeric(10,2) not null,
  channel text not null default 'both' check (channel in ('online','presential','both')),
  expires_at date not null,
  created_at timestamptz null default now(),
  updated_at timestamptz null default now(),
  constraint turma_precos_opcionais_pkey primary key (id)
);

create index if not exists idx_turma_precos_turma_id on public.turma_precos_opcionais using btree (turma_id);
create index if not exists idx_turma_precos_expires_at on public.turma_precos_opcionais using btree (expires_at);
