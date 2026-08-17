import React, { useState, useEffect } from "react";
// Mago Panel - Dashboard IPTV (Odin v6)
// Documentação completa no README.md e pasta /docs
// Deploy aaPanel: Porta 6328 e Nginx Exclusivo.
// Espelhamento Real Odin v6 Ativado 🚀

import { 
  Users, 
  Server as ServerIcon, 
  ShieldAlert, 
  LayoutDashboard, 
  RefreshCw,
  Activity,
  Monitor,
  Database,
  Globe,
  UserCheck,
  Settings
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { getOdinConfig } from "@/lib/odin";
import { useOdinData, useHydrated } from "@/hooks/use-odin";
import { StatCard } from "@/components/dashboard/StatCard";
import { CustomerList } from "@/components/dashboard/CustomerList";
import { UserModal } from "@/components/dashboard/UserModal";
import { ServerList } from "@/components/dashboard/ServerList";
import { StreamList } from "@/components/dashboard/StreamList";
import { DnsPanel } from "@/components/dashboard/DnsPanel";
import { ResellerList } from "@/components/dashboard/ResellerList";
import { ResellerModal } from "@/components/dashboard/ResellerModal";
import { ConfigPanel } from "@/components/dashboard/ConfigPanel";
import { User, Reseller } from "@/types/odin";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  loader: async () => {
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
  const data = Route.useLoaderData();
  const odin = data?.odin || {};
  const hydrated = useHydrated();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  
  const { 
    loading, 
    customers, 
    streams, 
    servers, 
    bouquets,
    resellers,
    stats, 
    fetchAll,
    actions 
  } = useOdinData();

  useEffect(() => {
    if (!hydrated) return;
    console.log("DASHBOARD HYDRATED - Triggering fetchAll");
    fetchAll();
  }, [hydrated]);


  const handleDeleteUser = async (user: User) => {
    if (!user.id) return;
    
    // Usando confirm do navegador para exclusão
    if (!window.confirm(`TEM CERTEZA? Deseja realmente EXCLUIR o utilizador "${user.username}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await actions.deleteUser({ data: { id: user.id } });
      if (res.success) {
        toast.success("Usuário removido com sucesso");
        fetchAll(false);
      }
    } catch (e) {
      toast.error("Erro ao remover usuário");
    }
  };

  const handleSaveUser = async (userData: User) => {
    if (!window.confirm(`CONFIRMAR: Deseja salvar as alterações para "${userData.username}"?`)) {
      return;
    }
    try {
      const exp_date = Math.floor(Date.now() / 1000) + (userData.exp_days * 86400);
      const data = {
        ...userData,
        exp_date,
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'streams', label: 'Streams', icon: Monitor },
    { id: 'servers', label: 'Servidores', icon: ServerIcon },
    { id: 'resellers', label: 'Revendedores', icon: UserCheck },
    { id: 'saas_users', label: 'Usuários SaaS', icon: Users },
    { id: "dns", label: "DNS Profissional", icon: Globe },
    { id: "config", label: "Configuração Odin", icon: Settings },
    { id: "deploy", label: "Deploy aaPanel", icon: Database },
  ];


  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden" id="odin-app-root">
      <div className="flex gap-10 relative">
        <aside className="w-64 shrink-0 relative z-[100] bg-[#0a0a0c]">
          <div className="mb-10 px-4">
            <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
              <ShieldAlert size={32} /> MAGO PANEL
            </div>
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Odin v6 Engine</div>
          </div>
          
          <div className="space-y-2 relative z-[9999]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("NAV CLICK:", item.id);
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border relative ${
                    isActive 
                      ? "bg-blue-600/10 text-blue-500 border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.05)]" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border-transparent hover:translate-x-1"
                  }`}
                  id={`nav-${item.id}`}
                  style={{ cursor: 'pointer', pointerEvents: 'auto', display: 'flex' }}
                  type="button"
                >
                  <Icon size={20} className="pointer-events-none" />
                  <span className="text-sm font-bold uppercase tracking-widest pointer-events-none">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-20 pt-10 border-t border-zinc-900 px-4">
            <div className="flex items-center gap-3 text-zinc-500 mb-6">
              <Database size={16} />
              <div className="text-xs font-bold uppercase tracking-widest">Database</div>
            </div>
            <div className="space-y-3 opacity-50 text-[10px] uppercase font-bold text-zinc-600">
              <div>Host: {odin.dbHost}</div>
              <div>DB: {odin.dbName}</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-tighter" id="page-title">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'customers' ? 'Clientes' : 
               activeTab === 'streams' ? 'Streams' : 
               activeTab === 'servers' ? 'Servidores' : 
               activeTab === 'resellers' ? 'Revendedores' : 
               activeTab === 'saas_users' ? 'Usuários SaaS' :
               activeTab === 'dns' ? 'DNS Profissional' : 
               activeTab === 'config' ? 'Configuração Odin' :
               activeTab === 'deploy' ? 'Deploy aaPanel' : ''}
            </h1>
            <button 
              onClick={() => fetchAll(false)}
              disabled={loading}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 border border-zinc-800"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div key={activeTab} className="animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Clientes Totais" value={stats.totalUsers} icon={Users} color="blue" />
                <StatCard label="Usuários Online" value={stats.onlineUsers} icon={Activity} color="green" />
                <StatCard label="Streams Ativas" value={stats.totalStreams > 0 ? `${stats.activeStreams}/${stats.totalStreams}` : "0/0"} icon={Monitor} color="purple" />
                <StatCard label="Servidores" value={stats.totalServers} icon={ServerIcon} color="blue" />
                <StatCard label="Revendedores" value={stats.totalResellers} icon={UserCheck} color="blue" />
              </div>
            )}

            {activeTab === 'customers' && (
              <CustomerList 
                customers={customers}
                resellers={resellers}
                loading={loading}
                onRefresh={() => fetchAll(false)}
                onAdd={() => { setEditingUser(null); setShowUserModal(true); }}
                onEdit={(user) => { setEditingUser(user); setShowUserModal(true); }}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
                onKill={handleKillConnections}
              />
            )}

            {activeTab === 'servers' && (
              <ServerList 
                servers={servers}
                loading={loading}
                onRefresh={() => fetchAll(false)}
              />
            )}

            {activeTab === 'streams' && (
              <StreamList 
                streams={streams}
                loading={loading}
                onRefresh={() => fetchAll(false)}
              />
            )}
            {activeTab === 'resellers' && (
              <ResellerList 
                resellers={resellers}
                loading={loading}
                onRefresh={() => fetchAll(false)}
                onAdd={() => { setEditingReseller(null); setShowResellerModal(true); }}
                onEdit={(r) => { setEditingReseller(r); setShowResellerModal(true); }}
                onDelete={async (r) => {
                  if (window.confirm("Apagar revenda?")) {
                    await actions.deleteReseller({ data: { id: r.id } });
                    fetchAll(false);
                  }
                }}
              />
            )}
            {activeTab === 'dns' && (
              <DnsPanel />
            )}
            {activeTab === 'saas_users' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center">
                <Users className="mx-auto mb-4 text-blue-500" size={40} />
                <h2 className="text-xl font-bold mb-2">Gestão SaaS em Preparação</h2>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">
                  A interface de gestão de usuários do painel está sendo integrada ao Supabase Auth. 
                  Em breve você poderá criar usuários Admin e Revendedores vinculados diretamente ao Odin.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <div className="px-4 py-2 bg-zinc-800 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-400">Suporte a Roles</div>
                  <div className="px-4 py-2 bg-zinc-800 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-400">Vínculo Odin ID</div>
                </div>
              </div>
            )}
            {activeTab === 'config' && (
              <ConfigPanel />
            )}
            {activeTab === 'deploy' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
                <Database className="mx-auto mb-6 text-blue-500" size={48} />
                <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">Mover para aaPanel</h2>
                <p className="text-zinc-400 mb-8 text-sm">
                  Execute o comando abaixo no terminal do seu novo servidor com aaPanel para instalar o painel de forma profissional e independente do servidor Odin.
                </p>
                <div className="bg-black p-4 rounded-xl font-mono text-xs text-blue-400 border border-zinc-800 break-all mb-6 select-all cursor-pointer" onClick={() => {
                  navigator.clipboard.writeText("git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh");
                  toast.success("Comando copiado!");
                }}>
                  git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh
                </div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  Certifique-se de ter o Bun ou Node.js instalado via aaPanel
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {showResellerModal && (
        <ResellerModal 
          reseller={editingReseller}
          loading={loading}
          onClose={() => { setShowResellerModal(false); setEditingReseller(null); }}
          onSave={async (data) => {
            const res = editingReseller 
              ? await actions.updateReseller({ data: { ...data, id: editingReseller.id } as any })
              : await actions.createReseller({ data: data as any });
            if (res.success) {
              setShowResellerModal(false);
              fetchAll(false);
              toast.success("Sucesso!");
            }
          }}
        />
      )}

      {showUserModal && (
        <UserModal 
          user={editingUser}
          bouquets={bouquets}
          resellers={resellers}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSave={handleSaveUser}
          loading={loading}
        />
      )}
    </div>
  );
}
