ALTER TABLE public.dns_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage DNS configs"
ON public.dns_configs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);