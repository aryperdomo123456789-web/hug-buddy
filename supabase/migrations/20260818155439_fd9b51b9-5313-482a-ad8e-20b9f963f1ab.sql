CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    odin_server_id TEXT,
    odin_package_id INTEGER,
    bouquets JSONB DEFAULT '[]',
    connections INTEGER DEFAULT 1,
    duration INTEGER DEFAULT 1,
    duration_unit TEXT DEFAULT 'months',
    price DECIMAL(10,2) DEFAULT 0.00,
    is_trial BOOLEAN DEFAULT false,
    has_adult_content BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can see active plans" ON public.plans
    FOR SELECT TO authenticated
    USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

CREATE POLICY "Admins can manage settings" ON public.app_settings
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can read settings" ON public.app_settings
    FOR SELECT TO authenticated
    USING (true);

INSERT INTO public.app_settings (key, value) VALUES (
    'default_message_template',
    '{"template": "✅ *Usuário:* {username}\n✅ *Senha:* {password}\n📦 *Plano:* {package}\n💳 *Assinar/Renovar Plano:* {pay_url}\n💵 *Valor do Plano:* {plan_price}\n🗓️ *Vencimento:* {expires_at}\n📶 *Conexões:* {connections}\n\n🟠 *DNS XCIPTV:* {dns}\n🟠 *DNS SMARTERS:* {dns}\n\n🟢 *Link (M3U):* {dns}/get.php?username={username}&password={password}&type=m3u_plus&output=mpegts\n\n🟢 *Link Curto (M3U):* http://e.{dns_host}/p/{username}/{password}/m3u\n\n🟡 *Link (HLS):* {dns}/get.php?username={username}&password={password}&type=m3u_plus&output=hls\n\n🟡 *Link Curto (HLS):* http://e.{dns_host}/p/{username}/{password}/hls\n\n🔴 *Link (SSIPTV):* http://e.{dns_host}/p/{username}/{password}/ssiptv"}'
) ON CONFLICT (key) DO NOTHING;
