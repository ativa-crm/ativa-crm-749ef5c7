-- Medição de campo: 4 tabelas novas. Não altera nenhuma tabela existente.
-- Padrão igual ao das tabelas atuais: RLS por empresa_id via public.usuarios,
-- preenchimento automático de empresa_id e grants para authenticated/service_role.

-- Preenche empresa_id com a empresa do usuário logado quando não vier informado.
create or replace function public.medicao_set_empresa_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.empresa_id is null then
    select empresa_id into new.empresa_id from public.usuarios where id = auth.uid();
  end if;
  return new;
end;
$$;

-- 1) Pontos/vértices do imóvel -----------------------------------------------
create table if not exists public.imovel_pontos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  codigo text,
  lat numeric not null,
  lon numeric not null,
  lat_gms text,
  lon_gms text,
  utm_e numeric,
  utm_n numeric,
  utm_zona text,
  origem text default 'kml',
  criado_em timestamptz default now()
);

grant select, insert, update, delete on public.imovel_pontos to authenticated;
grant all on public.imovel_pontos to service_role;
alter table public.imovel_pontos enable row level security;

create policy "imovel_pontos da empresa" on public.imovel_pontos
  for all to authenticated
  using (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()));

create trigger imovel_pontos_empresa before insert on public.imovel_pontos
  for each row execute function public.medicao_set_empresa_id();

create index if not exists imovel_pontos_imovel_idx on public.imovel_pontos (imovel_id);

-- 2) Localização (centróide) do imóvel ---------------------------------------
create table if not exists public.imovel_localizacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  imovel_id uuid not null unique references public.imoveis(id) on delete cascade,
  lat numeric not null,
  lon numeric not null,
  dispersao_km numeric,
  atualizado_em timestamptz default now()
);

grant select, insert, update, delete on public.imovel_localizacao to authenticated;
grant all on public.imovel_localizacao to service_role;
alter table public.imovel_localizacao enable row level security;

create policy "imovel_localizacao da empresa" on public.imovel_localizacao
  for all to authenticated
  using (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()));

create trigger imovel_localizacao_empresa before insert on public.imovel_localizacao
  for each row execute function public.medicao_set_empresa_id();

-- 3) Roteiros ----------------------------------------------------------------
create table if not exists public.roteiros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  nome text not null,
  data_prevista date,
  status text default 'planejamento',
  base_endereco text,
  base_lat numeric,
  base_lon numeric,
  fator_sinuosidade numeric default 1.35,
  velocidade_media_kmh numeric default 55,
  tempo_vistoria_h numeric default 2,
  jornada_h numeric default 9,
  custo_km numeric default 2.2,
  reotimizar_pendentes boolean default true,
  clima_dados jsonb,
  clima_atualizado_em timestamptz,
  criado_por uuid references public.usuarios(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

grant select, insert, update, delete on public.roteiros to authenticated;
grant all on public.roteiros to service_role;
alter table public.roteiros enable row level security;

create policy "roteiros da empresa" on public.roteiros
  for all to authenticated
  using (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()));

create trigger roteiros_empresa before insert on public.roteiros
  for each row execute function public.medicao_set_empresa_id();

-- 4) Paradas do roteiro ------------------------------------------------------
create table if not exists public.roteiro_paradas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  roteiro_id uuid not null references public.roteiros(id) on delete cascade,
  ordem_servico_id uuid not null references public.ordens_servico(id),
  ordem int,
  lat numeric not null,
  lon numeric not null,
  n_pontos int default 0,
  dispersao_km numeric,
  status text default 'pendente',
  sequencia_baixa int,
  km_previsto numeric,
  horas_previsto numeric,
  custo_previsto numeric,
  km_real numeric,
  horas_real numeric,
  custo_real numeric,
  data_execucao date,
  observacoes_campo text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

grant select, insert, update, delete on public.roteiro_paradas to authenticated;
grant all on public.roteiro_paradas to service_role;
alter table public.roteiro_paradas enable row level security;

create policy "roteiro_paradas da empresa" on public.roteiro_paradas
  for all to authenticated
  using (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.usuarios where id = auth.uid()));

create trigger roteiro_paradas_empresa before insert on public.roteiro_paradas
  for each row execute function public.medicao_set_empresa_id();

create index if not exists roteiro_paradas_roteiro_idx on public.roteiro_paradas (roteiro_id);
