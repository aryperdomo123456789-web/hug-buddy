import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, createFileRoute, redirect } from "@tanstack/react-router";
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
  Settings,
  Menu,
  X as CloseIcon,
  Download,
  Upload,
  Tv
} from "lucide-react";
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
import { SaasUserList } from "@/components/dashboard/SaasUserList";
import { NavItem } from "@/components/dashboard/NavItem";
import { User, Reseller, Profile } from "@/types/odin";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" as any });
    }
  },
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
  const router = useRouter();
  const data = Route.useLoaderData();
  const odin = data?.odin || {};
  const isHydrated = useHydrated();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
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
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data as Profile);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Deseja realmente sair do Mago Panel?")) return;
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" as any });
  };

  const handleSaveUser = async (userData: User) => {
    if (!window.confirm(`CONFIRMAR: Deseja salvar as alterações para "${userData.username}"?`)) {
      return;
    }
    try {
      const exp_date = userData.exp_days 
        ? Math.floor(Date.now() / 1000) + (userData.exp_days * 86400)
        : userData.exp_date || 0;

      const submitData = {
        ...userData,
        exp_date,
        enabled: userData.enabled ? 1 : 0,
        admin_enabled: userData.admin_enabled ? 1 : 0,
        is_trial: userData.is_trial ? 1 : 0,
        is_restreamer: userData.is_restreamer ? 1 : 0,
        is_isplock: userData.is_isplock ? 1 : 0,
      };

      const res = editingUser?.id 
        ? await actions.updateUser({ data: { ...submitData, id: editingUser.id } as any })
        : await actions.createUser({ data: submitData as any });

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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'streams', label: 'Streams', icon: Monitor },
    { id: 'servers', label: 'Servidores', icon: ServerIcon },
    { id: 'resellers', label: 'Revendedores', icon: UserCheck, adminOnly: true },
    { id: 'saas_users', label: 'Usuários SaaS', icon: Users, adminOnly: true },
    { id: "dns", label: "DNS Profissional", icon: Globe, adminOnly: true },
    { id: "config", label: "Configuração Odin", icon: Settings, adminOnly: true },
    { id: "deploy", label: "Deploy aaPanel", icon: Database, adminOnly: true },
    { id: "logout", label: "Sair do Painel", icon: RefreshCw },
  ];

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 md:p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="text-xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
          <ShieldAlert size={24} /> MAGO PANEL
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-zinc-800 rounded-lg text-zinc-400"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute top-0 left-0 w-80 h-full bg-[#0a0a0c] p-6 border-r border-zinc-800 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
                <ShieldAlert size={32} /> MAGO PANEL
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500">
                <CloseIcon size={24} />
              </button>
            </div>
            
            <nav className="space-y-2">
              {navItems
                .filter(item => !item.adminOnly || profile?.role === 'admin')
                .map((item) => (
                  <NavItem 
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    onClick={() => {
                      if (item.id === 'logout') {
                        handleLogout();
                        return;
                      }
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative">
        <aside 
          className={`hidden md:flex flex-col shrink-0 bg-[#0a0a0c] transition-all duration-300 ease-in-out border-r border-zinc-900/50 relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Botão de Toggle Flutuante */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-10 z-50 p-1.5 bg-blue-600 rounded-full text-white border-2 border-[#0a0a0c] hover:bg-blue-500 transition-all shadow-lg hidden md:block"
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {isSidebarCollapsed ? <Menu size={14} /> : <CloseIcon size={14} />}
          </button>

          <div className={`mb-10 px-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
            {!isSidebarCollapsed ? (
              <div className="animate-in fade-in duration-500 overflow-hidden">
                <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2 whitespace-nowrap">
                  <ShieldAlert size={32} /> MAGO PANEL
                </div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Odin v6 Engine</div>
              </div>
            ) : (
              <div className="text-blue-500 animate-in zoom-in duration-300">
                <ShieldAlert size={32} />
              </div>
            )}
          </div>
          
          <nav className="space-y-2">
            {navItems
              .filter(item => !item.adminOnly || profile?.role === 'admin')
              .map((item) => (
                <NavItem 
                  key={item.id}
                  icon={item.icon}
                  label={isSidebarCollapsed ? "" : item.label}
                  active={activeTab === item.id}
                  onClick={() => {
                    if (item.id === 'logout') {
                      handleLogout();
                      return;
                    }
                    setActiveTab(item.id);
                  }}
                />
              ))}
          </nav>
          
          {!isSidebarCollapsed && (
            <div className="mt-20 pt-10 border-t border-zinc-900 px-4 opacity-50 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 text-zinc-500 mb-6">
                <Database size={16} />
                <div className="text-xs font-bold uppercase tracking-widest">Database</div>
              </div>
              <div className="space-y-3 text-[10px] uppercase font-bold text-zinc-600">
                <div>Host: {odin.dbHost}</div>
                <div>DB: {odin.dbName}</div>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-tighter">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <button 
              onClick={() => fetchAll(false)}
              disabled={loading}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 border border-zinc-800 transition-colors"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div key={activeTab} className="animate-in fade-in zoom-in-95 duration-300">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                <StatCard 
                  label="Utilizadores Online" 
                  value={stats.onlineUsers} 
                  icon={Users} 
                  color="blue" 
                />
                <StatCard 
                  label="Conexões Abertas" 
                  value={stats.totalConns} 
                  icon={Database} 
                  color="green" 
                />
                <StatCard 
                  label="Total Input" 
                  value={stats.totalInput} 
                  icon={Download} 
                  secondaryLabel="Total Output"
                  secondaryValue={stats.totalOutput}
                  color="pink" 
                />
                <StatCard 
                  label="Streams Online" 
                  value={stats.activeStreams} 
                  icon={Tv} 
                  secondaryLabel="Streams Offline"
                  secondaryValue={stats.totalStreams - stats.activeStreams}
                  color="gray" 
                />
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
                onDelete={async (u) => {
                  if (window.confirm(`Excluir "${u.username}"?`)) {
                    await actions.deleteUser({ data: { id: u.id! } });
                    fetchAll(false);
                  }
                }}
                onToggleStatus={async (u) => {
                  await actions.toggleStatus({ data: { id: u.id!, enabled: u.enabled === 1 ? 0 : 1 } });
                  fetchAll(false);
                }}
                onKill={async (u) => {
                  await actions.killConnections({ data: { id: u.id! } });
                  fetchAll(false);
                }}
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
                    await actions.deleteReseller({ data: { id: r.id! } });
                    fetchAll(false);
                  }
                }}
              />
            )}

            {activeTab === 'dns' && <DnsPanel />}
            {activeTab === 'saas_users' && <SaasUserList />}
            {activeTab === 'config' && <ConfigPanel />}
            
            {activeTab === 'deploy' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
                <Database className="mx-auto mb-6 text-blue-500" size={48} />
                <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">Mover para aaPanel</h2>
                <p className="text-zinc-400 mb-8 text-sm">
                  Execute o comando abaixo no terminal do seu novo servidor com aaPanel.
                </p>
                <div 
                  className="bg-black p-4 rounded-xl font-mono text-xs text-blue-400 border border-zinc-800 break-all mb-6 select-all cursor-pointer" 
                  onClick={() => {
                    navigator.clipboard.writeText("git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh");
                    toast.success("Comando copiado!");
                  }}
                >
                  git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh
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
          onSave={async (formData) => {
            const res = editingReseller 
              ? await actions.updateReseller({ data: { ...formData, id: editingReseller.id! } as any })
              : await actions.createReseller({ data: formData as any });
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
