import React, { useEffect, useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
  Users,
  ShieldAlert,
  RefreshCw,
  Database,
  Globe,
  UserCheck,
  Settings,
  Menu,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Tag,
  MessageSquare
} from "lucide-react";
import { getOdinConfig } from "@/lib/odin";
import { useOdinData } from "@/hooks/use-odin";
import { CustomerList } from "@/components/dashboard/CustomerList";
import { UserModal } from "@/components/dashboard/UserModal";
import { DnsPanel } from "@/components/dashboard/DnsPanel";
import { ResellerList } from "@/components/dashboard/ResellerList";
import { ResellerModal } from "@/components/dashboard/ResellerModal";
import { ConfigPanel } from "@/components/dashboard/ConfigPanel";
import { SaasUserList } from "@/components/dashboard/SaasUserList";
import { PlanList } from "@/components/dashboard/PlanList";
import { PlanModal } from "@/components/dashboard/PlanModal";
import { NavItem } from "@/components/dashboard/NavItem";
import { User, Reseller, Profile, Plan } from "@/types/odin";
import { getOdinFullData, generateM3ULink } from "@/lib/server.functions";
import { getPlans, savePlan, deletePlan as deletePlanFn } from "@/lib/plans.functions";
import { getCurrentPanelSession, logoutPanel } from "@/lib/panel-auth.functions";
import { publishRuntimeError } from "@/lib/runtime-error-bus";
import { toast } from "sonner";

function formatStableTime(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getCurrentPanelSession();
    if (!session) {
      throw redirect({ to: "/auth" as any });
    }
    return { auth: session };
  },
  component: DashboardPage,
  loader: async () => {
    const cfg = getOdinConfig();
    let initialSnapshot = null;
    let initialLoadError: { message: string; details?: string } | null = null;

    try {
      const snapshot = await getOdinFullData();
      initialSnapshot = snapshot?.success ? snapshot.data : null;
      if (!snapshot?.success) {
        initialLoadError = {
          message: snapshot?.error || "Falha ao carregar dados do Odin.",
        };
      }
    } catch (error: any) {
      initialLoadError = {
        message: error?.message || "Falha ao carregar dados do Odin.",
        details: error?.stack,
      };
    }

    return {
      odin: {
        sshHost: cfg.sshHost,
        dbHost: cfg.dbHost,
        dbPort: cfg.dbPort,
        dbName: cfg.dbName,
        dbUsername: cfg.dbUsername,
      },
      initialSnapshot,
      initialSyncedAt: initialSnapshot ? Date.now() : null,
      initialLoadError,
    };
  },
});

class MainSectionBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, info: React.ErrorInfo) => void },
  { error: Error | null; info: React.ErrorInfo | null }
> {
  override state = { error: null as Error | null, info: null as React.ErrorInfo | null };

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    this.setState({ info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
    window.location.reload();
  };

  override render() {
    if (this.state.error) {
      const message = this.state.error.message || "Erro de renderização no painel.";
      return (
        <div className="rounded-3xl border border-rose-500/20 bg-zinc-950/80 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)]">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
            Seção isolada
          </div>
          <h2 className="mt-3 text-xl font-semibold text-zinc-100">
            O conteúdo principal falhou, mas a navegação foi preservada
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {message}
          </p>
          {this.state.info?.componentStack ? (
            <pre className="mt-4 max-h-56 overflow-auto rounded-2xl border border-zinc-800 bg-black/40 p-4 text-[11px] text-zinc-400 whitespace-pre-wrap">
              {this.state.info.componentStack}
            </pre>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Recarregar área
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function DashboardPage() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const odin = data?.odin || {};
  const [activeTab, setActiveTab] = useState("customers");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const {
    loading,
    customers,
    bouquets,
    resellers,
    plans,
    settings,
    lastSyncAt,
    fetchAll,
    actions,
  } = useOdinData(data?.initialSnapshot ?? null, data?.initialSyncedAt ?? null);

  const lastSyncLabel = lastSyncAt
    ? formatStableTime(lastSyncAt)
    : "aguardando primeiro sync";

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const session = await getCurrentPanelSession();
        if (cancelled || !session) return;
        setProfile({
          id: session.userId,
          role: session.role,
          odin_reseller_id: session.odin_reseller_id,
          full_name: session.full_name,
        });
      } catch (error) {
        console.warn("[Dashboard] Could not refresh panel session.", error);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (data?.initialLoadError) {
      const error = Object.assign(new Error(data.initialLoadError.message), {
        stack: data.initialLoadError.details,
      });
      publishRuntimeError(error, {
        source: "manual",
        phase: "loader",
        route: window.location.pathname,
      });
    }
  }, [data?.initialLoadError]);

  useEffect(() => {
    if (data?.initialSnapshot) {
      fetchAll(true);
      const quickRefresh = window.setTimeout(() => fetchAll(true), 3000);
      return () => window.clearTimeout(quickRefresh);
    }

    fetchAll();
  }, [data?.initialSnapshot]);

  const handleLogout = async () => {
    if (!window.confirm("Deseja realmente sair do Mago Panel?")) return;
    await logoutPanel();
    router.navigate({ to: "/auth" as any });
  };

  const handleDeleteUser = async (user: User) => {
    if (!user.id) return;
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
      const exp_date = userData.exp_days
        ? Math.floor(Date.now() / 1000) + userData.exp_days * 86400
        : userData.exp_date || 0;

      const data = {
        ...userData,
        exp_date,
        enabled: userData.enabled ? 1 : 0,
        admin_enabled: userData.admin_enabled ? 1 : 0,
        is_trial: userData.is_trial ? 1 : 0,
        is_restreamer: userData.is_restreamer ? 1 : 0,
        is_isplock: userData.is_isplock ? 1 : 0,
      };

      const res = editingUser?.id
        ? await actions.updateUser({ data: { ...data, id: editingUser.id } as any })
        : await actions.createUser({ data: data as any });

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
        data: { id: user.id, enabled: user.enabled === 1 ? 0 : 1 },
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
    { id: "customers", label: "Clientes", icon: Users },
    { id: "resellers", label: "Revendedores", icon: UserCheck, adminOnly: true },
    { id: "plans", label: "Planos de Venda", icon: Tag, adminOnly: true },
    { id: "saas_users", label: "Usuários SaaS", icon: Users, adminOnly: true },
    { id: "dns", label: "DNS Profissional", icon: Globe, adminOnly: true },
    { id: "config", label: "Configuração Odin", icon: Settings, adminOnly: true },
    { id: "logout", label: "Sair do Painel", icon: RefreshCw },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || profile?.role === "admin");

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 md:p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden" id="odin-app-root">
      <div className="md:hidden flex items-center justify-between mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="text-xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
          <ShieldAlert size={24} /> MAGO PANEL
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-zinc-800 rounded-lg text-zinc-400"
          type="button"
        >
          <Menu size={24} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-[#0a0a0c] p-6 border-r border-zinc-800 shadow-2xl animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div className="text-2xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
                <ShieldAlert size={32} /> MAGO PANEL
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500" type="button">
                <CloseIcon size={24} />
              </button>
            </div>

            <nav className="space-y-2">
              {visibleNavItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => {
                    if (item.id === "logout") {
                      handleLogout();
                      return;
                    }
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                />
              ))}
            </nav>

            <div className="mt-10 pt-6 border-t border-zinc-900 text-xs text-zinc-500">
              <div className="font-bold uppercase tracking-widest mb-2">
                {profile?.full_name || profile?.role || "Usuário"}
              </div>
              <div>{profile?.odin_reseller_id ? `Revenda #${profile.odin_reseller_id}` : "Admin / Global"}</div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative">
        <aside className={`hidden md:flex shrink-0 bg-[#0a0a0c] flex-col transition-all duration-300 ${isSidebarCollapsed ? "w-24" : "w-64"}`}>
          <div className={`${isSidebarCollapsed ? "px-2" : "px-4"} mb-10`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`font-black text-blue-500 tracking-tighter flex items-center ${isSidebarCollapsed ? "justify-center w-full" : "gap-2 text-2xl"}`}>
                <ShieldAlert size={isSidebarCollapsed ? 26 : 32} />
                {!isSidebarCollapsed && <span>MAGO PANEL</span>}
              </div>
              <button
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                className="hidden md:inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                type="button"
                title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
            {!isSidebarCollapsed && (
              <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Odin v6 Engine</div>
            )}
          </div>

          <nav className="space-y-2">
            {visibleNavItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                compact={isSidebarCollapsed}
                active={activeTab === item.id}
                onClick={() => {
                  if (item.id === "logout") {
                    handleLogout();
                    return;
                  }
                  setActiveTab(item.id);
                }}
              />
            ))}
          </nav>

          <div className={`mt-20 pt-10 border-t border-zinc-900 ${isSidebarCollapsed ? "px-2" : "px-4"} opacity-60`}>
            <div className="flex items-center gap-3 text-zinc-500 mb-6">
              <Database size={16} />
              {!isSidebarCollapsed && <div className="text-xs font-bold uppercase tracking-widest">Database</div>}
            </div>
            {!isSidebarCollapsed && (
              <div className="space-y-3 text-[10px] uppercase font-bold text-zinc-600">
                <div>Host: {odin.dbHost}</div>
                <div>DB: {odin.dbName}</div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-start gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tighter">
                {navItems.find((i) => i.id === activeTab)?.label || "Painel"}
              </h1>
              {profile && (
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mt-2">
                  {profile.full_name || profile.role} {profile.odin_reseller_id ? `• Revenda #${profile.odin_reseller_id}` : "• Acesso Global"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <span className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                Sync {lastSyncLabel}
              </div>
              <button
                onClick={() => fetchAll(false)}
                disabled={loading}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 border border-zinc-800 transition-colors"
                type="button"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <MainSectionBoundary
            onError={(error, info) => {
              publishRuntimeError(error, {
                source: "boundary",
                phase: "render",
                route: window.location.pathname,
                componentStack: info.componentStack,
              });
            }}
          >
            <div key={activeTab} className="animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
            {activeTab === "customers" && (
              <CustomerList
                customers={customers}
                resellers={resellers}
                plans={plans}
                settings={settings}
                loading={loading}
                onRefresh={() => fetchAll(false)}
                onAdd={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                onEdit={(user) => {
                  setEditingUser(user);
                  setShowUserModal(true);
                }}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
                onKill={handleKillConnections}
              />
            )}

            {activeTab === "plans" && (
              <PlanList 
                plans={plans}
                loading={loading}
                onRefresh={() => fetchAll(false)}
                onAdd={() => {
                  setEditingPlan(null);
                  setShowPlanModal(true);
                }}
                onEdit={(plan) => {
                  setEditingPlan(plan);
                  setShowPlanModal(true);
                }}
                onDelete={async (plan) => {
                  if (window.confirm("Deseja excluir este plano?")) {
                    await deletePlanFn({ data: { id: plan.id! } });
                    fetchAll(false);
                  }
                }}
              />
            )}

            {activeTab === "resellers" && (
              <ResellerList
                resellers={resellers}
                loading={loading}
                onRefresh={() => fetchAll(false)}
                onAdd={() => {
                  setEditingReseller(null);
                  setShowResellerModal(true);
                }}
                onEdit={(r) => {
                  setEditingReseller(r);
                  setShowResellerModal(true);
                }}
                onDelete={async (r) => {
                  if (window.confirm("Apagar revenda?")) {
                    await actions.deleteReseller({ data: { id: r.id } });
                    fetchAll(false);
                  }
                }}
              />
            )}

            {activeTab === "saas_users" && <SaasUserList />}

            {activeTab === "dns" && <DnsPanel />}

            {activeTab === "config" && <ConfigPanel />}
            </div>
          </MainSectionBoundary>
        </main>
      </div>

      {showResellerModal && (
        <ResellerModal
          reseller={editingReseller}
          loading={loading}
          onClose={() => {
            setShowResellerModal(false);
            setEditingReseller(null);
          }}
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
          canChangeOwner={profile?.role === "admin"}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          loading={loading}
        />
      )}
    </div>
  );
}
