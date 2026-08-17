-- 1. Enum app_role
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'reseller');
  end if;
end $$;

-- 2. Tabela user_roles
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- 3. Função has_role
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 4. Função preventiva de exclusão admin
create or replace function public.prevent_admin_deletion()
returns trigger as $$
begin
  if old.role = 'admin' then
    raise exception 'Não é possível excluir o usuário Dono/Admin.';
  end if;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_prevent_admin_deletion on public.profiles;
create trigger tr_prevent_admin_deletion
before delete on public.profiles
for each row execute function public.prevent_admin_deletion();

-- 5. Políticas RLS para profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- 6. Grants
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
