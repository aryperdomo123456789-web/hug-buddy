-- 1. Restringir execução da função has_role
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- 2. Restringir execução da função prevent_admin_deletion (apenas sistema)
revoke execute on function public.prevent_admin_deletion() from public;
grant execute on function public.prevent_admin_deletion() to authenticated, service_role;
alter function public.prevent_admin_deletion() set search_path = public;

-- 3. Adicionar política RLS para user_roles (Admin pode ver tudo, User vê a si mesmo)
drop policy if exists "Admins can view all roles" on public.user_roles;
create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- 4. Grants adicionais para garantir acesso da API
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
