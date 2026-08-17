-- 1. Enum para papéis do SaaS
create type public.app_role as enum ('admin', 'reseller');

-- 2. Tabela de perfis
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role app_role not null default 'reseller',
  odin_reseller_id integer, -- ID do revendedor na tabela reg_users do Odin
  full_name text,
  updated_at timestamp with time zone default now()
);

-- 3. Grants
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 4. RLS
alter table public.profiles enable row level security;

create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  to authenticated
  using ( auth.uid() = id );

create policy "Admins podem ver todos os perfis"
  on public.profiles for select
  to authenticated
  using ( 
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Função para verificar se é admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$$;
