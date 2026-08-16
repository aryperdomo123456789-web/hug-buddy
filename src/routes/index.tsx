import React from "react";
import { 
  Users, 
  Server as ServerIcon, 
  ShieldAlert, 
  LayoutDashboard, 
  RefreshCw,
  Activity,
  Monitor,
  Database
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { getOdinConfig } from "@/lib/odin";
import { useOdinData, useHydrated } from "@/hooks/use-odin";
import { NavItem } from "@/components/dashboard/NavItem";
import { StatCard } from "@/components/dashboard/StatCard";
import { CustomerList } from "@/components/dashboard/CustomerList";
import { UserModal } from "@/components/dashboard/UserModal";
import { User } from "@/types/odin";
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
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  
  const { 
    loading, 
    customers, 
    streams, 
    servers, 
    bouquets,
    stats, 
    fetchAll,
    actions 
  } = useOdinData();

  React.useEffect(() => {
    if (hydrated) {
      // Inicia o carregamento silencioso em background após hidratação
      fetchAll(true);
    }
  }, [hydrated]);

  const handleDeleteUser = async (user: User) => {
    if (!user.id || !confirm(`Deseja realmente excluir ${user.username}?`)) return;
    try {
      const res = await actions.deleteUser({ data: { id: user.id } });
      if (res.success) {
        toast.success("Usuário removido");
        fetchAll(false);
      }
    } catch (e) {
      toast.error("Erro ao remover usuário");
    }
  };

  const handleSaveUser = async (userData: User) => {
    try {
      const exp_date = Math.floor(Date.now() / 1000) + (userData.exp_days * 86400);
      const data = {
        ...userData,
        exp_date,
        // Garantir tipos para o Odin
        enabled: userData.enabled ? 1 : 0,
        admin_enabled: userData.admin_enabled ? 1 : 0,
        is_trial: userData.is_trial ? 1 : 0,
        is_restreamer: userData.is_restreamer ? 1 : 0,
        is_isplock: userData.is_isplock ? 1 : 0,
      };

      let res;
      if (editingUser?.id) {
        res = await actions.updateUser({ data: { ...data, id: editingUser.id } as any });
      } else {
        res = await actions.createUser({ data: data as any });
      }

      if (res.success) {
        toast.success(editingUser ? "Atualizado!" : "Criado!");
        setShowUserModal(false);
        setEditingUser(null);
        fetchAll(false);
      } else {
        toast.error("Erro Odin: " + (res as any).error);
      }
    } catch (e) {
      toast.error("Falha na comunicação");
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!user.id) return;
    try {
      const res = await actions.toggleStatus({ 
        data: { id: user.id, enabled: user.enabled === 1 ? 0 : 1 } 
      });
      if (res.success) {
        toast.success("Estado alterado");
        fetchAll(false);
      }
    } catch (e) {
      toast.error("Erro ao alterar estado");
    }
  };

  const handleKillConnections = async (user: User) => {
    if (!user.id) return;
    try {
      const res = await actions.killConnections({ data: { id: user.id } });
      if (res.success) {
        toast.success("Conexões derrubadas");
        fetchAll(false);
      }
    } catch (e) {
      toast.error("Erro ao derrubar conexões");
    }
  };

  if (!hydrated) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-zinc-500 uppercase tracking-widest font-bold text-xs">Iniciando Mago Panel...</div>;


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
                onClick={() => fetchAll(false)}
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
             <CustomerList 
               customers={customers}
               loading={loading}
               onRefresh={fetchAll}
               onAdd={() => { setEditingUser(null); setShowUserModal(true); }}
               onEdit={(user) => { setEditingUser(user); setShowUserModal(true); }}
               onDelete={handleDeleteUser}
               onToggleStatus={handleToggleStatus}
               onKill={handleKillConnections}
             />
          )}
        </main>
      </div>

      {showUserModal && (
        <UserModal 
          user={editingUser}
          bouquets={bouquets}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
