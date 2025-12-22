-- Função: retorna o preço opcional vigente para uma turma e canal ('online'|'presential')
-- Retorna NULL se não houver preço opcional vigente

create or replace function public.get_turma_preco_vigente(p_turma_id uuid, p_channel text)
returns table (
  id uuid,
  turma_id uuid,
  label text,
  price numeric(10,2),
  channel text,
  expires_at date,
  created_at timestamptz,
  updated_at timestamptz
) language sql stable as $$
  select id, turma_id, label, price, channel, expires_at, created_at, updated_at
  from public.turma_precos_opcionais
  where turma_id = p_turma_id
    and expires_at >= current_date
    and (channel = 'both' or channel = p_channel)
  order by expires_at asc, created_at asc
  limit 1;
$$;

-- Trigger para manter updated_at atualizado
create or replace function public.update_turma_precos_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger turma_precos_opcionais_updated_at
before update on public.turma_precos_opcionais
for each row
execute function public.update_turma_precos_updated_at();
