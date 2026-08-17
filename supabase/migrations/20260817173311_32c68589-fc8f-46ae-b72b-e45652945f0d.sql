-- 1. Revogar tudo da função is_admin que existia antes
revoke all on function public.is_admin() from public, authenticated, anon;
grant execute on function public.is_admin() to service_role;
alter function public.is_admin() set search_path = public;

-- 2. Garantir que has_role não é acessível por anon
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- 3. Garantir que prevent_admin_deletion não é acessível por anon
revoke execute on function public.prevent_admin_deletion() from anon, public;
grant execute on function public.prevent_admin_deletion() to authenticated, service_role;
