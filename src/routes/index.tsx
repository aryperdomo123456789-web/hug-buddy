import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, 
  Server, 
  Terminal, 
  ShieldAlert, 
  LayoutDashboard, 
  Settings,
  PlusCircle,
  Activity,
  UserPlus
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  loader: () => ({}),
});

function LegacyLab() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#0f0f12] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Activity size={18} className="text-primary" />
          </div>
          <h2 className="font-bold text-lg">
            Laboratório Legado - Wolf Play
          </h2>
        </div>
        <div className="flex gap-2">
           <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded uppercase font-bold tracking-wider">Modo Inspeção</span>
           <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase font-bold tracking-wider">v3.89</span>
        </div>
      </div>
      
      {/* Informações de Acesso para o Desenvolvedor */}
      <div className="p-4 bg-yellow-500/5 border-b border-yellow-500/10 flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase tracking-tighter">Portal:</span>
            <code className="text-zinc-300">https://wolfplay.mplll.com/</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase tracking-tighter">User:</span>
            <code className="bg-black/30 px-2 py-1 rounded text-yellow-500/80">laboratoriolovable</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase tracking-tighter">Pass:</span>
            <code className="bg-black/30 px-2 py-1 rounded text-yellow-500/80">iGNVgbAlTP3130</code>
          </div>
        </div>
        <a 
          href="https://wolfplay.mplll.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <PlusCircle size={14} />
          ABRIR PORTAL EXTERNO
        </a>
      </div>

      {/* Visualizador do Legado */}
      <div className="flex-1 bg-black/40 relative group">
        <iframe 
          src="https://wolfplay.mplll.com/" 
          className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
          title="Legacy Panel"
        />
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/10 group-hover:border-primary/20 transition-all" />
      </div>
    </div>
  );
}

function Dashboard() {
  const [view, setView] = React.useState<'dashboard' | 'legacy'>('dashboard');

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans selection:bg-primary/30">
      {/* Sidebar - O Esconderijo do Mago */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f0f12] border-r border-zinc-800/50 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <span 
            className="font-bold text-xl tracking-tight uppercase cursor-pointer" 
            onClick={() => setView('dashboard')}
          >
            Mago <span className="text-primary">Panel</span>
          </span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
          />
          <NavItem icon={<Users size={20} />} label="Usuários" />
          <NavItem icon={<Terminal size={20} />} label="Terminal" />
          <NavItem icon={<Server size={20} />} label="Servidores" />
          <div className="my-2 border-t border-zinc-800/30 mx-2" />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Laboratório Legado" 
            active={view === 'legacy'}
            onClick={() => setView('legacy')}
          />
          <NavItem icon={<Settings size={20} />} label="Configurações" />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800/50">
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/30">
            <p className="text-xs text-zinc-500 mb-2 uppercase font-semibold">Status do Sistema</p>
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Conectado ao Main
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - A Forja */}
      <main className="ml-64 p-10 max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">
              {view === 'dashboard' ? 'Dashboard' : 'Laboratório Legado'}
            </h1>
            <p className="text-zinc-500">
              {view === 'dashboard' 
                ? 'Bem-vindo à sua central de comando, mestre.' 
                : 'Analise e extraia o melhor do sistema legado para a nossa forja.'}
            </p>
          </div>
          {view === 'dashboard' && (
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20">
              <PlusCircle size={20} />
              CRIAR NOVO USUÁRIO
            </button>
          )}
        </header>

        {view === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatCard icon={<Users className="text-blue-500" />} label="Usuários Ativos" value="1,284" change="+12%" />
              <StatCard icon={<Activity className="text-green-500" />} label="Canais Online" value="15,402" change="99.9%" />
              <StatCard icon={<Server className="text-purple-500" />} label="Carga CPU" value="42%" change="Estável" />
              <StatCard icon={<ShieldAlert className="text-yellow-500" />} label="Alertas" value="0" change="Limpo" />
            </div>

            {/* Recent Activity / Users Table */}
            <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Usuários Recentes
            </h2>
            <button className="text-xs text-zinc-500 hover:text-white transition-colors">Ver todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Expiração</th>
                  <th className="px-6 py-4">Conexões</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                <TableRow name="Pedro Alcântara" status="Ativo" expiry="12 Out 2026" connections="1/1" />
                <TableRow name="Maria Joaquina" status="Ativo" expiry="05 Set 2026" connections="2/3" />
                <TableRow name="Lucas Silva" status="Expirado" expiry="10 Ago 2026" connections="0/1" />
                <TableRow name="Carla Souza" status="Pendente" expiry="-" connections="0/1" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Mago Dev Motivational Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20 relative overflow-hidden group">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl font-black mb-4 uppercase">Odin Streaming System v6 Conectado</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Já estudei a arquitetura do Odin v6. Estamos operando na porta <span className="text-white font-bold">7999</span> com o banco <span className="text-white font-bold">xtream_iptvpro</span>. 
              O instalador já foi atualizado para extrair as credenciais automaticamente e preparar sua API.
              <span className="text-white font-bold ml-1">Bora pra cima!</span>
            </p>
            <div className="flex gap-4 text-xs font-mono text-primary">
              <span>// SYSTEM: ODIN_V6</span>
              <span>// DB: MARIA_10.3</span>
              <span>// STATUS: READY_TO_FORGE</span>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
        </div>

        {/* SSH Insights & Connection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* SSH Connection Helper */}
          <section className="p-8 rounded-2xl bg-[#0f0f12] border border-zinc-800/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Terminal size={20} className="text-primary" />
              Conectar Servidor SSH
            </h3>
            <p className="text-zinc-400 mb-6 text-sm">
              Para conectar seu servidor Odin ao painel, rode o comando abaixo no terminal SSH do seu servidor.
            </p>
            
            <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 font-mono text-sm relative group mb-6">
              <code className="text-primary break-all">
                wget -qO- https://71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovableproject.com/api/public/install | bash
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("wget -qO- https://71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovableproject.com/api/public/install | bash");
                  alert("Comando copiado!");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-xs text-white"
              >
                COPIAR
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">Segurança</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O script cria um diretório seguro em <code className="text-zinc-300">/home/xtreamcodes/iptv_xtream_codes/wwwdir/mago-api</code> e gera um token único de 32 caracteres.
                </p>
              </div>
            </div>
          </section>

          {/* SSH Analysis Output */}
          <section className="p-8 rounded-2xl bg-[#0f0f12] border border-zinc-800/50 flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Análise do Servidor (SSH)
            </h3>
            <div className="bg-black/60 rounded-xl border border-zinc-800/50 p-4 font-mono text-[10px] text-zinc-400 flex-1 overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="text-primary mb-2 font-bold uppercase tracking-widest text-[9px] border-b border-zinc-800 pb-1 flex justify-between">
                <span>// LOG DE COMANDO: ls -la /home/xtreamcodes/iptv_xtream_codes/</span>
                <span className="text-zinc-600">STATE: ANALYZED</span>
              </div>
              <pre className="whitespace-pre-wrap leading-tight">
{`total 128572
drwxrwxrwx 23 xtreamcodes xtreamcodes     4096 Aug 11 21:40 .
drwxrwxrwx  4 xtreamcodes xtreamcodes     4096 Jun 26 16:08 ..
drwxrwxrwx  9 xtreamcodes xtreamcodes     4096 Jun 21 12:45 admin
drwxrwxrwx  4 xtreamcodes xtreamcodes     4096 Jun 20 01:15 adtools
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Jun 20 01:15 bin
-rwxrwxrwx  1 xtreamcodes xtreamcodes      904 Jun 26 15:43 check_geolite.sh
-rwxrwxrwx  1 xtreamcodes xtreamcodes      208 Jun 20 02:40 config
-rwxrwxrwx  1 xtreamcodes xtreamcodes     2323 Jun 21 12:45 config.py
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Aug 25  2017 created_channels
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Aug  2 13:12 crons
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Dec  1  2018 delay
-rw-r--r--  1 xtreamcodes xtreamcodes 65775230 Jun 23 22:29 GeoLite2.guard.mmdb
-rw-r--r--  1 xtreamcodes xtreamcodes 65755735 Jul 15 22:24 GeoLite2.mmdb
drwxrwxrwx  3 xtreamcodes xtreamcodes     4096 Jun 20 01:15 isp
-rwxrwxrwx  1 xtreamcodes xtreamcodes       22 Sep 16  2019 kill_pids
drwxr-xr-x  2 xtreamcodes xtreamcodes     4096 Aug 11 21:40 libcompat
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Jun 20 01:16 logs
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Apr 14  2019 movies
drwxrwxrwx  5 xtreamcodes xtreamcodes     4096 Aug 11 22:22 nginx
drwxrwxrwx 10 xtreamcodes xtreamcodes     4096 Aug 11 22:22 nginx_rtmp
-rwxrwxrwx  1 xtreamcodes xtreamcodes      509 Jun 21 12:45 permissions.sh
drwxrwxrwx  9 xtreamcodes xtreamcodes     4096 Aug 11 22:22 php
drwxrwxrwx  3 xtreamcodes xtreamcodes     4096 Jun 21 12:46 pytools
drwxrwxrwx  5 xtreamcodes xtreamcodes     4096 Jun 20 01:15 SecTools
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Dec  1  2018 signals
-rwxrwxrwx  1 xtreamcodes xtreamcodes     2370 Aug 11 21:42 start_services.sh
drwxrwxrwt  2 xtreamcodes xtreamcodes     1100 Aug 13 21:20 streams
drwxrwxrwt  8 xtreamcodes xtreamcodes   287580 Aug 13 21:36 tmp
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Sep 16  2019 tools
drwxrwxrwx  2 xtreamcodes xtreamcodes     4096 Dec  1  2018 tv_archive
drwxrwxrwx  9 xtreamcodes xtreamcodes     4096 Jun 23 22:31 wwwdir
-rwxrwxrwx  1 xtreamcodes xtreamcodes     8847 Sep  2  2018 xfirewall.php`}
              </pre>
            </div>
          </section>
        </div>
          </>
        ) : (
          <LegacyLab />
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
      ${active 
        ? 'bg-primary/10 text-primary border border-primary/20' 
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'}
    `}>
      <span className={active ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change: string }) {
  return (
    <div className="bg-[#0f0f12] p-6 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.includes('+') || change.includes('99') ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
          {change}
        </span>
      </div>
      <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black">{value}</h4>
    </div>
  );
}

function TableRow({ name, status, expiry, connections }: { name: string; status: string; expiry: string; connections: string }) {
  const statusColors = {
    Ativo: 'text-green-500 bg-green-500/10 border-green-500/20',
    Expirado: 'text-red-500 bg-red-500/10 border-red-500/20',
    Pendente: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold uppercase group-hover:border-primary/50 transition-colors">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-semibold">{name}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-zinc-400 font-mono">{expiry}</td>
      <td className="px-6 py-5 text-sm text-zinc-400">{connections}</td>
      <td className="px-6 py-5 text-right">
        <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
          <Settings size={16} />
        </button>
      </td>
    </tr>
  );
}

