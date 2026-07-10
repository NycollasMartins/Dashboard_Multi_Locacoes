-- ============================================================================
-- StageGear · Schema completo para Supabase
-- Cole TODO este arquivo no Supabase Studio → SQL Editor → Run.
-- É seguro rodar mais de uma vez (usa IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Função utilitária: atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. PERFIS DE USUÁRIO  (espelha auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  company     text,
  role        text not null default 'user',   -- 'admin' | 'user'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Arquivamento de usuário: mantém o cadastro, mas bloqueia o acesso.
alter table public.profiles
  add column if not exists archived     boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists confirmed_at timestamptz;  -- quando o convite foi aceito

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando um usuário é criado no Auth.
-- O PRIMEIRO usuário cadastrado vira 'admin' automaticamente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_count int;
begin
  select count(*) into v_count from public.profiles;
  if v_count = 0 then
    v_role := 'admin';
  else
    v_role := coalesce(new.raw_user_meta_data->>'role', 'user');
  end if;

  insert into public.profiles (id, email, full_name, role, confirmed_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    new.email_confirmed_at   -- já vem preenchido se o usuário foi criado confirmado
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Marca o perfil como confirmado quando a pessoa aceita o convite / confirma o e-mail.
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set confirmed_at = new.email_confirmed_at
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_user_confirmed();

-- Backfill: marca como confirmados os usuários que já existiam antes desta coluna.
update public.profiles p
   set confirmed_at = u.email_confirmed_at
  from auth.users u
 where u.id = p.id
   and p.confirmed_at is null
   and u.email_confirmed_at is not null;

-- Helper: o usuário atual é admin? (SECURITY DEFINER evita recursão de RLS)
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- 2. TABELAS DE NEGÓCIO
-- ============================================================================

-- Nota: as tabelas de negócio usam chave do tipo TEXT (default = UUID em texto).
-- Isso permite importar dados antigos do Base44 (cujos IDs não são UUID)
-- preservando os relacionamentos, sem perder compatibilidade com dados novos.

-- Clientes
create table if not exists public.clients (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  email       text,
  phone       text,
  company     text,
  cpf_cnpj    text,
  address     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Equipamentos
create table if not exists public.equipment (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  category        text,
  serial_number   text,
  purchase_price  numeric,
  purchase_date   date,
  location        text,
  status          text default 'Disponível',
  description     text,
  quantity        numeric default 1,
  invoice_number  text,
  image_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Locações
create table if not exists public.rentals (
  id              text primary key default gen_random_uuid()::text,
  client_id       text references public.clients(id) on delete set null,
  client_name     text,
  equipment_ids   text[] default '{}',
  equipment_names text,
  start_date      date,
  end_date        date,
  total_value     numeric,
  payment_status  text default 'Pendente',
  rental_status   text default 'Reservado',
  payment_type    text,
  is_bonus        boolean default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Orçamentos
create table if not exists public.quotes (
  id              text primary key default gen_random_uuid()::text,
  client_name     text,
  client_id       text references public.clients(id) on delete set null,
  equipment_names text,
  equipment_ids   text[] default '{}',
  start_date      date,
  end_date        date,
  subtotal        numeric,
  transport_cost  numeric,
  assembly_cost   numeric,
  tax_percent     numeric,
  total_value     numeric,
  status          text default 'Rascunho',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Notas Fiscais
create table if not exists public.invoices (
  id           text primary key default gen_random_uuid()::text,
  number       text,
  rental_id    text references public.rentals(id) on delete set null,
  client_id    text references public.clients(id) on delete set null,
  client_name  text,
  value        numeric,
  issue_date   date,
  status       text default 'Emitida',
  file_url     text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Despesas
create table if not exists public.expenses (
  id           text primary key default gen_random_uuid()::text,
  description  text,
  category     text,
  value        numeric,
  date         date,
  rental_id    text references public.rentals(id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Contas a Pagar
create table if not exists public.accounts_payable (
  id            text primary key default gen_random_uuid()::text,
  description   text,
  category      text,
  value         numeric,
  due_date      date,
  payment_date  date,
  status        text default 'Pendente',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Triggers de updated_at para todas as tabelas de negócio
do $$
declare t text;
begin
  foreach t in array array['clients','equipment','rentals','quotes','invoices','expenses','accounts_payable']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================
-- Modelo: workspace compartilhado. Qualquer usuário AUTENTICADO acessa os
-- dados de negócio (a equipe toda enxerga clientes, equipamentos, etc).
-- Visitantes anônimos não acessam nada.

alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.equipment         enable row level security;
alter table public.rentals           enable row level security;
alter table public.quotes            enable row level security;
alter table public.invoices          enable row level security;
alter table public.expenses          enable row level security;
alter table public.accounts_payable  enable row level security;

-- Tabelas de negócio: acesso total para autenticados
do $$
declare t text;
begin
  foreach t in array array['clients','equipment','rentals','quotes','invoices','expenses','accounts_payable']
  loop
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "auth_all_%1$s" on public.%1$s
       for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Perfis
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 4. STORAGE  (uploads de NF em PDF, fotos de equipamento, etc.)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects
  for select using (bucket_id = 'uploads');

drop policy if exists "uploads_auth_insert" on storage.objects;
create policy "uploads_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');

drop policy if exists "uploads_auth_update" on storage.objects;
create policy "uploads_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'uploads');

drop policy if exists "uploads_auth_delete" on storage.objects;
create policy "uploads_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads');

-- ============================================================================
-- FIM. Tudo pronto.
-- ============================================================================
