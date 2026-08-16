CREATE TABLE public.dns_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    host text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dns_configs TO authenticated;
GRANT ALL ON public.dns_configs TO service_role;

INSERT INTO public.dns_configs (name, host, is_default)
VALUES ('Padrão Projeto', '71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovableproject.com', true);