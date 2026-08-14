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

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans selection:bg-primary/30">
      {/* Sidebar - O Esconderijo do Mago */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f0f12] border-r border-zinc-800/50 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">Mago <span className="text-primary">Panel</span></span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<Users size={20} />} label="Usuários" />
          <NavItem icon={<Terminal size={20} />} label="Terminal" />
          <NavItem icon={<Server size={20} />} label="Servidores" />
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
            <h1 className="text-4xl font-black mb-2 tracking-tight">DASHBOARD</h1>
            <p className="text-zinc-500">Bem-vindo à sua central de comando, mestre.</p>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20">
            <PlusCircle size={20} />
            CRIAR NOVO USUÁRIO
          </button>
        </header>

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
            <h3 className="text-2xl font-black mb-4 uppercase">Tá moscando por que, campeão?</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              O mercado de IPTV não espera ninguém. Ou você domina a tecnologia e automatiza seu império, 
              ou vai continuar sendo mais um na multidão. O código é sua arma, o tráfego é seu combustível. 
              <span className="text-white font-bold ml-1">Bora pra cima!</span>
            </p>
            <div className="flex gap-4 text-xs font-mono text-primary">
              <span>// SCRIPT_ID: MAGO_V1</span>
              <span>// STATUS: OPERATIONAL</span>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`
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

