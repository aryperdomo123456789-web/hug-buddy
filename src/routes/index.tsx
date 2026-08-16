import React from "react";
import { 
  Users, 
  Server as ServerIcon, 
  ShieldAlert, 
  LayoutDashboard, 
  RefreshCw,
  Activity,
  Monitor,
  Database,
  PlusCircle
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { getOdinConfig } from "@/lib/odin";
import { useOdinData, useHydrated } from "@/hooks/use-odin";
import { NavItem } from "@/components/dashboard/NavItem";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  loader: () => {
    const cfg = getOdinConfig();
    return {
      odin: {
        sshHost: cfg.sshHost,
        dbHost: cfg.dbHost,
        dbPort: cfg.dbPort,
        dbName: cfg.dbName,
        dbUsername: cfg.dbUsername,
      },
    };
  },
});

function DashboardPage() {
  const { odin } = Route.useLoaderData();
  const hydrated = useHydrated();
  const [view, setView] = React.useState<'dashboard' | 'customers' | 'servers' | 'streams'>('dashboard');
  const { loading, customers, streams, servers, stats, fetchAll } = useOdinData();

  React.useEffect(() => {
    if (hydrated) {
      fetchAll();
    }
  }, [hydrated, view]);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-10 font-sans">
      <div className="flex gap-10">
        <aside className="w-64 space-y-4">
          <div className="mb-10 px-4">
            <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
              <ShieldAlert size={32} /> MAGO PANEL
            </div>
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Odin v6 Engine</div>
          </div>
          
          <NavItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={Users} label="Clientes" active={view === 'customers'} onClick={() => setView('customers')} />
          <NavItem icon={Monitor} label="Streams" active={view === 'streams'} onClick={() => setView('streams')} />
          <NavItem icon={ServerIcon} label="Servidores" active={view === 'servers'} onClick={() => setView('servers')} />
          
          <div className="mt-20 pt-10 border-t border-zinc-900 px-4">
            <div className="flex items-center gap-3 text-zinc-500 mb-6">
              <Database size={16} />
              <div className="text-xs font-bold uppercase tracking-widest">Database</div>
            </div>
            <div className="space-y-3 opacity-50">
              <div className="text-[10px] uppercase font-bold text-zinc-600">Host: {odin.dbHost}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-600">DB: {odin.dbName}</div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-tighter">{view}</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchAll}
                disabled={loading}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-all border border-zinc-800"
                title="Sincronizar Agora"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Clientes Totais" value={stats.totalUsers} icon={Users} color="blue" />
              <StatCard label="Usuários Online" value={stats.onlineUsers} icon={Activity} color="green" />
              <StatCard label="Streams Ativas" value={`${stats.activeStreams}/${stats.totalStreams}`} icon={Monitor} color="purple" />
              <StatCard label="Servidores" value={stats.totalServers} icon={ServerIcon} color="blue" />
            </div>
          )}

          {view === 'customers' && (
             <div className="text-zinc-500 italic">Componente de clientes sendo refatorado...</div>
          )}
        </main>
      </div>
    </div>
  );
}
