-- Revogar execução pública para evitar alertas de segurança
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin() from authenticated;

-- Garantir que apenas service_role ou chamadas internas seguras funcionem
grant execute on function public.is_admin() to service_role;
