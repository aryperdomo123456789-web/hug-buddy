-- Adicionar colunas para template personalizado e variáveis por plano
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS plan_price NUMERIC,
ADD COLUMN IF NOT EXISTS pay_url TEXT,
ADD COLUMN IF NOT EXISTS dns_host TEXT;

-- Garantir privilégios
GRANT ALL ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
