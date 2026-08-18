import { createFileRoute, useRouter, useRouterState } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ShieldAlert, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { loginPanel, getCurrentPanelSession } from '@/lib/panel-auth.functions';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const search = useRouterState().location.search as { redirect?: string };
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentPanelSession();
        if (session) {
          router.navigate({ to: (search.redirect || '/') as any });
        }
      } catch (error) {
        // Ignora erro de sessão inicial
      }
    };
    checkSession();
  }, [router, search.redirect]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginPanel({ data: { email, password } });
      if (result.success) {
        toast.success('Bem-vindo ao Mago Panel!');
        router.navigate({ to: (search.redirect || '/') as any });
      }
    } catch (error: any) {
      toast.error(error.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 rounded-2xl text-blue-500 mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic uppercase">
            MAGO PANEL
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
            Central de Comando IPTV • Odin v6
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="EMAIL DO MAGO"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all uppercase font-bold tracking-widest"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="SENHA SECRETA"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all uppercase font-bold tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 group uppercase tracking-[0.1em]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  ENTRAR AGORA
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          Ambiente aaPanel • Porta 6328 • Criptografado
        </div>
      </div>
    </div>
  );
}
