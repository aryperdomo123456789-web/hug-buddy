import React, { useState, useEffect } from "react";
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
import { StatCard } from "@/components/dashboard/StatCard";
import { CustomerList } from "@/components/dashboard/CustomerList";
import { UserModal } from "@/components/dashboard/UserModal";
import { ServerList } from "@/components/dashboard/ServerList";
import { StreamList } from "@/components/dashboard/StreamList";
import { User } from "@/types/odin";
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
  const { odin } = Route.useLoaderData();
  const hydrated = useHydrated();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
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

  useEffect(() => {
    if (hydrated) {
      fetchAll(true);
    }
  }, [hydrated]);

  if (!hydrated) {
    return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest">Iniciando Odin Engine...</div>;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'streams', label: 'Streams', icon: Monitor },
    { id: 'servers', label: 'Servidores', icon: ServerIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-10 font-sans">
      <div className="flex gap-10">
        <aside className="w-64 shrink-0">
          <div className="mb-10 px-4">
            <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
              <ShieldAlert size={32} /> MAGO PANEL
            </div>
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Odin v6 Engine</div>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
                  }`}
                  id={`nav-${item.id}`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                </div>
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

        <main className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-tighter" id="page-title">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'customers' ? 'Clientes' : 
               activeTab === 'streams' ? 'Streams' : 
               activeTab === 'servers' ? 'Servidores' : ''}
            </h1>
            <button 
              onClick={() => fetchAll(false)}
              disabled={loading}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 border border-zinc-800"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div key={activeTab}>
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Clientes Totais" value={stats.totalUsers} icon={Users} color="blue" />
                <StatCard label="Usuários Online" value={stats.onlineUsers} icon={Activity} color="green" />
                <StatCard label="Streams Ativas" value={`${stats.activeStreams}/${stats.totalStreams}`} icon={Monitor} color="purple" />
                <StatCard label="Servidores" value={stats.totalServers} icon={ServerIcon} color="blue" />
              </div>
            )}

            {activeTab === 'customers' && (
              <CustomerList 
                customers={customers}
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
          </div>
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
