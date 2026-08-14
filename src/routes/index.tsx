import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Users, 
  Server, 
  Terminal, 
  ShieldAlert, 
  LayoutDashboard, 
  Settings,
  PlusCircle,
  Activity,
  UserPlus,
  Play,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { runSSHCommand, getUsers, createUser, updateUser, toggleUserStatus, deleteUser } from "@/lib/server.functions";
import { getOdinConfig } from "@/lib/odin";
import { toast } from "sonner";

type UserEditorTab = "detalhes" | "avancado" | "restricoes" | "bouquets";

type UserEditorState = {
  id?: number;
  username: string;
  password: string;
  owner: string;
  exp_days: number;
  max_connections: number;
  enabled: boolean;
  admin_enabled: boolean;
  trial: boolean;
  forced_portal: boolean;
  restreamer: boolean;
  force_country: string;
  ip_lock: boolean;
  allowed_ips: string;
  allowed_agents: string;
  notes_admin: string;
  notes_reseller: string;
  bouquet_ids: string;
};

export const Route = createFileRoute("/")({
  component: Dashboard,
  loader: () => {
    const cfg = getOdinConfig();
    return {
      odin: {
        sshHost: cfg.sshHost,
        dbHost: cfg.dbHost,
        dbPort: cfg.dbPort,
        dbName: cfg.dbName,
        dbUsername: cfg.dbUsername,
        apiTokenLast4: cfg.apiToken ? cfg.apiToken.slice(-4) : "",
      },
    };
  },
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{label}</span>
      {children}
    </label>
  );
}

function LegacyLab() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#0f0f12] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Activity size={18} className="text-primary" />
          </div>
          <h2 className="font-bold text-lg">
            Laboratório Legado - Odin
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
            <code className="text-zinc-300">Ambiente legado desativado</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase tracking-tighter">User:</span>
            <code className="bg-black/30 px-2 py-1 rounded text-yellow-500/80">configurar no ambiente</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase tracking-tighter">Pass:</span>
            <code className="bg-black/30 px-2 py-1 rounded text-yellow-500/80">protegido</code>
          </div>
        </div>
        <a
          href="https://example.com"
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <PlusCircle size={14} />
          ABRIR AMBIENTE
        </a>
      </div>

      {/* Visualizador do Legado */}
      <div className="flex-1 bg-black/40 relative group">
        <iframe
          src="about:blank"
          className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
          title="Legacy Panel"
        />
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/10 group-hover:border-primary/20 transition-all" />
      </div>
    </div>
  );
}

function Dashboard() {
  const { odin } = Route.useLoaderData();
  const [view, setView] = React.useState<'dashboard' | 'legacy' | 'customers' | 'servers'>('dashboard');
  const [terminalOutput, setTerminalOutput] = React.useState<string>(() => `IP: ${odin.sshHost}\nAguardando comando...`);
  const [command, setCommand] = React.useState("ls -la /home/xtreamcodes/iptv_xtream_codes/");
  const [isRunning, setIsRunning] = React.useState(false);
  const [isDeploying, setIsDeploying] = React.useState(false);
  
  // States para Clientes
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(false);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [activeEditorTab, setActiveEditorTab] = React.useState<UserEditorTab>("detalhes");
  const [newUserData, setNewUserData] = React.useState<UserEditorState>({
    username: "",
    password: "",
    owner: "SuaFonte444",
    exp_days: 30,
    max_connections: 1,
    enabled: true,
    admin_enabled: true,
    trial: false,
    forced_portal: false,
    restreamer: false,
    force_country: "Off",
    ip_lock: false,
    allowed_ips: "",
    allowed_agents: "",
    notes_admin: "",
    notes_reseller: "",
    bouquet_ids: "[1]",
  });

  const runCommand = useServerFn(runSSHCommand);
  const fetchUsersFn = useServerFn(getUsers);
  const createUserFn = useServerFn(createUser);
  const updateUserFn = useServerFn(updateUser);
  const toggleUserStatusFn = useServerFn(toggleUserStatus);
  const deleteUserFn = useServerFn(deleteUser);

  const handleFetchUsers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetchUsersFn();
      if (res.success) {
        setCustomers(res.data || []);
        if (res.data && res.data.length > 0) {
          toast.success(`${res.data.length} usuários sincronizados!`);
        } else {
          toast.warning("Banco de dados Odin está vazio ou inacessível.");
        }
      } else {
        toast.error("Erro no banco Odin: " + res.error);
        console.error("Fetch Error:", res.error);
      }
    } catch (e) {
      toast.error("Erro ao carregar clientes via SSH");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  React.useEffect(() => {
    handleFetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setActiveEditorTab("detalhes");
    setNewUserData({
      username: "",
      password: "",
      owner: "SuaFonte444",
      exp_days: 30,
      max_connections: 1,
      enabled: true,
      admin_enabled: true,
      trial: false,
      forced_portal: false,
      restreamer: false,
      force_country: "Off",
      ip_lock: false,
      allowed_ips: "",
      allowed_agents: "",
      notes_admin: "",
      notes_reseller: "",
      bouquet_ids: "[1]",
    });
    setShowAddUserModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setActiveEditorTab("detalhes");
    setNewUserData({
      username: user.username || "",
      password: user.password || "",
      owner: user.owner || "SuaFonte444",
      exp_days: user.exp_date
        ? Math.max(1, Math.ceil((user.exp_date - Date.now() / 1000) / 86400))
        : 30,
      max_connections: user.max_connections || 1,
      enabled: user.enabled == 1,
      admin_enabled: user.admin_enabled == 1,
      trial: Boolean(user.trial),
      forced_portal: Boolean(user.forced_portal),
      restreamer: Boolean(user.restreamer),
      force_country: user.force_country || "Off",
      ip_lock: Boolean(user.ip_lock),
      allowed_ips: user.allowed_ips || "",
      allowed_agents: user.allowed_agents || "",
      notes_admin: user.notes_admin || "",
      notes_reseller: user.reseller_notes || "",
      bouquet_ids: user.bouquet || "[1]",
    });
    setShowAddUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!newUserData.username || !newUserData.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    setIsRunning(true);
    try {
      const exp_date = Math.floor(Date.now() / 1000) + (newUserData.exp_days * 86400);
      if (editingUser) {
        const res = await updateUserFn({
          data: {
            id: editingUser.id,
            username: newUserData.username,
            password: newUserData.password,
            exp_date,
            enabled: newUserData.enabled ? 1 : 0,
            max_connections: newUserData.max_connections,
            member_id: editingUser.member_id ?? 1,
            admin_enabled: newUserData.admin_enabled ? 1 : 0,
            admin_notes: newUserData.notes_admin,
            reseller_notes: newUserData.notes_reseller,
            bouquet: newUserData.bouquet_ids,
            is_restreamer: newUserData.restreamer ? 1 : 0,
            allowed_ips: newUserData.allowed_ips,
            allowed_ua: newUserData.allowed_agents,
            is_trial: newUserData.trial ? 1 : 0,
            is_isplock: newUserData.ip_lock ? 1 : 0,
            forced_country: newUserData.force_country,
            is_mag: 0,
            is_e2: 0,
            force_server_id: 0,
            is_stalker: 0,
            bypass_ua: 0,
            access_output: 3,
          }
        });
        if (res.success) {
          toast.success("Usuário atualizado com sucesso!");
          setShowAddUserModal(false);
          setEditingUser(null);
          handleFetchUsers();
        } else {
          toast.error("Erro ao atualizar: " + res.error);
        }
      } else {
        const res = await createUserFn({
          data: {
            username: newUserData.username,
            password: newUserData.password,
            exp_date: exp_date,
            max_connections: newUserData.max_connections,
            member_id: 1,
            admin_enabled: newUserData.admin_enabled ? 1 : 0,
            enabled: newUserData.enabled ? 1 : 0,
            admin_notes: newUserData.notes_admin,
            reseller_notes: newUserData.notes_reseller,
            bouquet: newUserData.bouquet_ids,
            is_restreamer: newUserData.restreamer ? 1 : 0,
            allowed_ips: newUserData.allowed_ips,
            allowed_ua: newUserData.allowed_agents,
            is_trial: newUserData.trial ? 1 : 0,
            is_isplock: newUserData.ip_lock ? 1 : 0,
            forced_country: newUserData.force_country,
            is_mag: 0,
            is_e2: 0,
            force_server_id: 0,
            is_stalker: 0,
            bypass_ua: 0,
            access_output: 3,
          }
        });
        if (res.success) {
          toast.success("Usuário criado com sucesso!");
          setShowAddUserModal(false);
          handleFetchUsers();
        } else {
          toast.error("Erro ao criar: " + res.error);
        }
      }
    } catch (e) {
      toast.error("Erro na comunicação SSH");
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleUser = async (user: any) => {
    setIsRunning(true);
    try {
      const res = await toggleUserStatusFn({
        data: {
          id: user.id,
          enabled: user.enabled == 1 ? 0 : 1,
        }
      });
      if (res.success) {
        toast.success(user.enabled == 1 ? "Usuário bloqueado" : "Usuário ativado");
        handleFetchUsers();
      } else {
        toast.error("Erro ao alterar status: " + res.error);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Excluir o usuário ${user.username}?`)) return;
    setIsRunning(true);
    try {
      const res = await deleteUserFn({ data: { id: user.id } });
      if (res.success) {
        toast.success("Usuário removido");
        handleFetchUsers();
      } else {
        toast.error("Erro ao excluir: " + res.error);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRenewDays = async (user: any, days: number) => {
    const exp_date = Math.floor(Date.now() / 1000) + days * 86400;
    setIsRunning(true);
    try {
      const res = await updateUserFn({
        data: {
          id: user.id,
          username: user.username,
          password: user.password,
          exp_date,
          enabled: user.enabled ?? 1,
          max_connections: user.max_connections ?? 1,
        }
      });
      if (res.success) {
        toast.success(`Expiração renovada por ${days} dias`);
        handleFetchUsers();
      } else {
        toast.error("Erro ao renovar: " + res.error);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSSH = async () => {
    setIsRunning(true);
    setTerminalOutput((prev) => prev + `\n\n> Executando: ${command}...`);
    
    try {
      const result = await runCommand({
        data: {
          host: odin.sshHost,
          port: 22,
          username: "root",
          password: "",
          command: command
        }
      });

      if (result.success) {
        setTerminalOutput((prev) => prev + `\n${result.stdout}${result.stderr ? '\nERROR: ' + result.stderr : ''}`);
        toast.success("Comando executado com sucesso!");
      } else {
        setTerminalOutput((prev) => prev + `\nERRO DE CONEXÃO: ${result.error}`);
        toast.error("Falha na conexão SSH");
      }
    } catch (err) {
      setTerminalOutput((prev) => prev + `\nERRO INESPERADO: Ocorreu um erro ao processar o comando.`);
      toast.error("Erro interno do servidor");
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeployScript = async () => {
    setIsDeploying(true);
    setTerminalOutput((prev) => prev + `\n\n> Iniciando implantação automática da API...`);
    
    try {
      // 1. Criar diretório
      // 2. Gerar token
      // 3. Salvar token
      // 4. Reportar sucesso
      const deployCommand = `mkdir -p /home/xtreamcodes/iptv_xtream_codes/wwwdir/mago-api && cd /home/xtreamcodes/iptv_xtream_codes/wwwdir/mago-api && [ ! -f token.txt ] && cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1 > token.txt; echo "TOKEN: $(cat token.txt)" && echo "IP: $(curl -s https://ifconfig.me || hostname -I | awk '{print $1}')"`;
      
      const result = await runCommand({
        data: {
          host: odin.sshHost,
          port: 22,
          username: "root",
          password: "",
          command: deployCommand
        }
      });

      if (result.success) {
        setTerminalOutput((prev) => prev + `\nIMPLANTAÇÃO CONCLUÍDA:\n${result.stdout}`);
        toast.success("API Mago implantada com sucesso via SSH!");
      } else {
        setTerminalOutput((prev) => prev + `\nFALHA NA IMPLANTAÇÃO: ${result.error}`);
        toast.error("Falha ao implantar API");
      }
    } catch (err) {
      setTerminalOutput((prev) => prev + `\nERRO INESPERADO NA IMPLANTAÇÃO.`);
    } finally {
      setIsDeploying(false);
    }
  };

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
          <NavItem 
            icon={<Users size={20} />} 
            label="Clientes" 
            active={view === 'customers'}
            onClick={() => {
              setView('customers');
              handleFetchUsers();
            }}
          />
          <NavItem icon={<Terminal size={20} />} label="Terminal" />
          <NavItem 
            icon={<Server size={20} />} 
            label="Servidores" 
            active={view === 'servers'}
            onClick={() => setView('servers')}
          />
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
              {view === 'dashboard' ? 'Dashboard' : view === 'customers' ? 'Clientes' : view === 'servers' ? 'Servidores' : 'Laboratório Legado'}
            </h1>
            <p className="text-zinc-500">
              {view === 'dashboard' 
                ? 'Bem-vindo à sua central de comando, mestre.' 
                : 'Analise e extraia o melhor do sistema legado para a nossa forja.'}
            </p>
          </div>
          {(view === 'dashboard' || view === 'customers') && (
            <button 
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <PlusCircle size={20} />
              CRIAR NOVO USUÁRIO
            </button>
          )}
        </header>

        {view === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatCard icon={<Users className="text-blue-500" />} label="Usuários Ativos" value={customers.length.toString()} change="Conectado ao DB" />
              <StatCard icon={<Activity className="text-green-500" />} label="Canais Online" value="0" change="Sync Odin" />
              <StatCard icon={<Server className="text-purple-500" />} label="Servidor Lab" value={odin.sshHost} change="API ATIVA" />
              <StatCard icon={<ShieldAlert className="text-yellow-500" />} label="Token de Acesso" value={odin.apiTokenLast4 ? `••••${odin.apiTokenLast4}` : "Configurar"} change={odin.apiTokenLast4 ? "Token presente" : "Sem token"} />
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
                {customers.length > 0 ? customers.slice(0, 5).map((user: any, idx: number) => (
                  <TableRow 
                    key={idx} 
                    name={user.username} 
                    status={user.enabled == 1 ? (user.exp_date > Date.now()/1000 ? 'Ativo' : 'Expirado') : 'Pendente'} 
                    expiry={user.exp_date ? new Date(user.exp_date * 1000).toLocaleDateString() : '-'} 
                    connections={`${user.active_cons || 0}/${user.max_connections || 1}`} 
                  />
                )) : (
                  <>
                    <TableRow name="Pedro Alcântara" status="Ativo" expiry="12 Out 2026" connections="1/1" />
                    <TableRow name="Maria Joaquina" status="Ativo" expiry="05 Set 2026" connections="2/3" />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mago Dev Motivational Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20 relative overflow-hidden group">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl font-black mb-4 uppercase">Odin Streaming System v6 Conectado</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Já estudei a arquitetura do Odin v6. Estamos operando na porta <span className="text-white font-bold">{odin.dbPort}</span> com o banco <span className="text-white font-bold">{odin.dbName}</span>.
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
                {typeof window !== 'undefined' ? `curl -sSL -H "Accept: text/plain" ${window.location.origin}/api/public/install | bash` : 'Carregando comando...'}
              </code>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`curl -sSL -H "Accept: text/plain" ${window.location.origin}/api/public/install | bash`);
                    toast.success("Comando copiado!");
                  }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-xs text-white"
              >
                COPIAR
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase text-green-500 flex items-center gap-2">
                  <CheckCircle2 size={12} />
                  API MAGO IMPLANTADA
                </h4>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Token de Segurança:</span>
                  <code className="text-xs text-zinc-300 bg-black/40 px-2 py-1 rounded border border-zinc-800 break-all select-all">
                    {odin.apiTokenLast4 ? `••••${odin.apiTokenLast4}` : "Configure ODIN_API_TOKEN"}
                  </code>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                  O servidor já está pronto para receber requisições. O diretório da API foi criado e o token gerado.
                </p>
              </div>
            </div>
          </section>

          {/* SSH Analysis Output (Real Terminal) */}
          <section className="p-8 rounded-2xl bg-[#0f0f12] border border-zinc-800/50 flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Terminal size={20} className="text-primary" />
              Terminal de Diagnóstico SSH
            </h3>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-black/40 rounded-xl border border-zinc-800 px-4 flex items-center group">
                <span className="text-zinc-600 text-xs font-mono mr-2">$</span>
                <input 
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSSH()}
                  placeholder="Digite um comando bash..."
                  className="bg-transparent border-none outline-none text-zinc-300 font-mono text-sm w-full py-3"
                  disabled={isRunning}
                />
              </div>
              <button 
                onClick={handleRunSSH}
                disabled={isRunning}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                {isRunning ? (
                  <Activity size={20} className="animate-spin" />
                ) : (
                  <Play size={20} />
                )}
              </button>
            </div>

            <div className="bg-black/60 rounded-xl border border-zinc-800/50 p-4 font-mono text-[10px] text-zinc-400 flex-1 overflow-auto h-[300px] scrollbar-thin scrollbar-thumb-zinc-800 relative group">
              <div className="text-primary mb-2 font-bold uppercase tracking-widest text-[9px] border-b border-zinc-800 pb-1 flex justify-between sticky top-0 bg-black/60 z-10">
                <span>// OUTPUT DO TERMINAL</span>
                <span className="flex items-center gap-2">
                  {isRunning ? (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Activity size={8} className="animate-spin" /> PROCESSANDO...
                    </span>
                  ) : (
                    <span className="text-zinc-600">PRONTO</span>
                  )}
                </span>
              </div>
              <pre className="whitespace-pre-wrap leading-tight pt-2">
                {terminalOutput}
              </pre>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button 
                onClick={() => setCommand("ls -la /home/xtreamcodes/iptv_xtream_codes/")}
                className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 py-1.5 rounded hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                LISTAR ARQUIVOS ODIN
              </button>
              <button 
                onClick={() => setCommand("mysql -e 'show databases;'")}
                className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 py-1.5 rounded hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                LISTAR BANCOS DB
              </button>
            </div>
          </section>
        </div>
          </>
        ) : view === 'customers' ? (
          <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Gerenciamento de Clientes (Odin v6)
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleFetchUsers}
                  className="text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <Activity size={12} className={isLoadingCustomers ? "animate-spin" : ""} />
                  ATUALIZAR
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoadingCustomers ? (
                <div className="p-20 text-center text-zinc-500 flex flex-col items-center gap-4">
                  <Activity size={40} className="animate-spin text-primary opacity-20" />
                  <p className="animate-pulse">Consultando base de dados do Odin...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/20 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Senha</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-center">Expiração</th>
                      <th className="px-6 py-4 text-center">Conns</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {customers.length > 0 ? customers.map((user: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.02] group transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-zinc-500">{user.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                              {user.username.substring(0,2).toUpperCase()}
                            </div>
                            <span className="font-bold text-zinc-200">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-500">{user.password}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${user.enabled == 1 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {user.enabled == 1 ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-zinc-400 text-xs">{user.exp_date ? new Date(user.exp_date * 1000).toLocaleDateString() : 'Unlimited'}</span>
                              {user.exp_date && (
                                <span className="text-[9px] text-zinc-600 uppercase">
                                  {Math.ceil((user.exp_date - Date.now()/1000) / 86400)} Dias
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">
                          {user.active_cons || 0} / {user.max_connections || 1}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => handleRenewDays(user, 1)}
                              className="text-zinc-600 hover:text-yellow-400 transition-colors p-1.5 bg-zinc-900/50 rounded-lg"
                              title="Renovar 1 dia"
                            >
                              <Play size={14} />
                            </button>
                            <button
                              onClick={() => handleRenewDays(user, 30)}
                              className="text-zinc-600 hover:text-yellow-400 transition-colors p-1.5 bg-zinc-900/50 rounded-lg"
                              title="Renovar 30 dias"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleUser(user)}
                              className="text-zinc-600 hover:text-white transition-colors p-1.5 bg-zinc-900/50 rounded-lg"
                              title={user.enabled == 1 ? "Bloquear" : "Ativar"}
                            >
                              <Activity size={14} />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-zinc-600 hover:text-primary transition-colors p-1.5 bg-zinc-900/50 rounded-lg"
                              title="Editar"
                            >
                              <Settings size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-zinc-600 hover:text-red-500 transition-colors p-1.5 bg-zinc-900/50 rounded-lg"
                              title="Excluir"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-zinc-600 italic">
                          Nenhum cliente encontrado no banco de dados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        ) : view === 'servers' ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Configuração da API */}
              <div className="bg-[#0f0f12] p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity size={80} />
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <Settings className="text-primary" />
                  </div>
                  Configuração da API & Token
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block tracking-widest">Endereço da API (Host)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly
                      value={odin.sshHost}
                        className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-4 text-zinc-300 font-mono text-sm outline-none cursor-default"
                      />
                      <div className="bg-green-500/10 border border-green-500/20 px-4 flex items-center rounded-xl text-green-500 font-bold text-[10px] uppercase">
                        Ativa
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block tracking-widest">Token de Segurança</label>
                    <div className="relative group/token">
                      <input 
                        type="text" 
                        readOnly
                        value={odin.apiTokenLast4 ? `••••${odin.apiTokenLast4}` : "Configure ODIN_API_TOKEN"}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl p-4 text-primary font-mono text-sm outline-none cursor-default"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(odin.apiTokenLast4 ? `••••${odin.apiTokenLast4}` : "Configure ODIN_API_TOKEN");
                          toast.success("Valor copiado!");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        COPIAR
                      </button>
                    </div>
                    <p className="mt-3 text-[10px] text-zinc-500 italic">
                      Este token é gerado automaticamente para autenticar as requisições entre o painel e o servidor Odin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuração do Banco de Dados */}
              <div className="bg-[#0f0f12] p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Server size={80} />
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Server className="text-blue-500" />
                  </div>
                  Base de Dados (MariaDB)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block tracking-widest">Host / IP</label>
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs">
                      {odin.dbHost}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block tracking-widest">Porta</label>
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs">
                      {odin.dbPort}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block tracking-widest">Database</label>
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs">
                      {odin.dbName}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block tracking-widest">Username</label>
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs">
                      {odin.dbUsername}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block tracking-widest">Password</label>
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs blur-[3px] hover:blur-0 transition-all cursor-help">
                      senha configurada no ambiente
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-3 text-blue-500 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Conexão Estabelecida via SSH</span>
                </div>
              </div>
            </div>

            {/* Banner de Status de Sincronização */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-6 rounded-2xl border border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200">Sincronização em Tempo Real</h4>
                  <p className="text-xs text-zinc-500">O Mago Panel está monitorando o servidor Odin v6 e aplicando comandos via tunnel SSH seguro.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-600 block uppercase font-bold mb-1">Último Check</span>
                <span className="text-xs font-mono text-zinc-400">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </section>
        ) : (
          <LegacyLab />
        )}
      </main>

      {/* Modal de Criação de Usuário */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f12] border border-zinc-800 w-full max-w-5xl rounded-2xl p-6 shadow-2xl animate-in zoom-in fade-in duration-200 max-h-[92vh] overflow-auto">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="text-primary" />
                {editingUser ? `Editar Utilizador #${editingUser.id}` : "Forjar Novo Cliente"}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
              <div className="rounded-2xl border border-zinc-800/60 bg-black/30 p-3">
                {[
                  { id: "detalhes", label: "Detalhes" },
                  { id: "avancado", label: "Avançado" },
                  { id: "restricoes", label: "Restrições" },
                  { id: "bouquets", label: "Bouquets" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditorTab(tab.id as UserEditorTab)}
                    className={`w-full text-left px-4 py-3 rounded-xl mb-2 border transition-all ${
                      activeEditorTab === tab.id
                        ? "bg-primary/15 border-primary/30 text-white"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                  Edite o utilizador no mesmo fluxo do painel principal, sem sair da tela.
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/60 bg-black/30 p-6">
                {activeEditorTab === "detalhes" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nome do utilizador">
                      <input className={panelInputClass} value={newUserData.username} onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })} />
                    </Field>
                    <Field label="Senha">
                      <input className={panelInputClass} type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} />
                    </Field>
                    <Field label="Dono">
                      <input className={panelInputClass} value={newUserData.owner} onChange={(e) => setNewUserData({ ...newUserData, owner: e.target.value })} />
                    </Field>
                    <Field label="Conexões máximas">
                      <input className={panelInputClass} type="number" min={1} value={newUserData.max_connections} onChange={(e) => setNewUserData({ ...newUserData, max_connections: Number(e.target.value) || 1 })} />
                    </Field>
                    <Field label="Validade (dias)">
                      <input className={panelInputClass} type="number" min={1} value={newUserData.exp_days} onChange={(e) => setNewUserData({ ...newUserData, exp_days: Number(e.target.value) || 1 })} />
                    </Field>
                    <Field label="Estado">
                      <div className="flex gap-3 items-center h-12 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-300">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newUserData.enabled} onChange={(e) => setNewUserData({ ...newUserData, enabled: e.target.checked })} /> Ativo</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={newUserData.admin_enabled} onChange={(e) => setNewUserData({ ...newUserData, admin_enabled: e.target.checked })} /> Admin</label>
                      </div>
                    </Field>
                    <Field label="Expiração calculada">
                      <div className="h-12 flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-300">{new Date((Math.floor(Date.now() / 1000) + newUserData.exp_days * 86400) * 1000).toLocaleString()}</div>
                    </Field>
                  </div>
                )}

                {activeEditorTab === "avancado" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Conexão forçada">
                      <div className="h-12 flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-300">desativado</div>
                    </Field>
                    <Field label="Ministra Portal">
                      <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm">
                        <input type="checkbox" checked={newUserData.forced_portal} onChange={(e) => setNewUserData({ ...newUserData, forced_portal: e.target.checked })} />
                        <span className="text-zinc-300">Ativar portal</span>
                      </div>
                    </Field>
                    <Field label="Conta de teste">
                      <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm">
                        <input type="checkbox" checked={newUserData.trial} onChange={(e) => setNewUserData({ ...newUserData, trial: e.target.checked })} />
                        <span className="text-zinc-300">Trial</span>
                      </div>
                    </Field>
                    <Field label="Restreamer">
                      <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm">
                        <input type="checkbox" checked={newUserData.restreamer} onChange={(e) => setNewUserData({ ...newUserData, restreamer: e.target.checked })} />
                        <span className="text-zinc-300">Permitir restream</span>
                      </div>
                    </Field>
                    <Field label="País forçado">
                      <select className={panelInputClass} value={newUserData.force_country} onChange={(e) => setNewUserData({ ...newUserData, force_country: e.target.value })}>
                        <option value="Off">Off</option>
                        <option value="BR">BR</option>
                        <option value="US">US</option>
                        <option value="PT">PT</option>
                      </select>
                    </Field>
                    <Field label="ISP Lock Info">
                      <input className={panelInputClass} value={newUserData.notes_reseller} onChange={(e) => setNewUserData({ ...newUserData, notes_reseller: e.target.value })} />
                    </Field>
                  </div>
                )}

                {activeEditorTab === "restricoes" && (
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Endereços IP permitidos">
                      <textarea className={panelTextareaClass} value={newUserData.allowed_ips} onChange={(e) => setNewUserData({ ...newUserData, allowed_ips: e.target.value })} />
                    </Field>
                    <Field label="Agentes permitidos">
                      <textarea className={panelTextareaClass} value={newUserData.allowed_agents} onChange={(e) => setNewUserData({ ...newUserData, allowed_agents: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <PanelToggle checked={newUserData.ip_lock} onChange={(e) => setNewUserData({ ...newUserData, ip_lock: e.target.checked })} label="IP Lock" />
                      <PanelToggle checked={newUserData.forced_portal} onChange={(e) => setNewUserData({ ...newUserData, forced_portal: e.target.checked })} label="Portal forçado" />
                      <PanelToggle checked={newUserData.trial} onChange={(e) => setNewUserData({ ...newUserData, trial: e.target.checked })} label="Conta de teste" />
                    </div>
                    <Field label="Notas do administrador">
                      <textarea className={panelTextareaClass} value={newUserData.notes_admin} onChange={(e) => setNewUserData({ ...newUserData, notes_admin: e.target.value })} />
                    </Field>
                  </div>
                )}

                {activeEditorTab === "bouquets" && (
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Bouquets atribuídos">
                      <textarea className={panelTextareaClass} value={newUserData.bouquet_ids} onChange={(e) => setNewUserData({ ...newUserData, bouquet_ids: e.target.value })} />
                    </Field>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400 leading-relaxed">
                      Seleção de bouquets pronta na interface. Se o schema remoto usar colunas/tabelas específicas para bouquet, eu amarro esse campo no próximo passo.
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Plano Completo", "24 HORAS", "Internacional", "Adultos"].map((name) => (
                        <button key={name} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-left hover:border-primary/30 transition-colors">
                          <div className="text-sm text-white font-semibold">{name}</div>
                          <div className="text-[10px] text-zinc-500">Selecionar bouquet</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800/70">
                  <div className="text-xs text-zinc-500">
                    {editingUser ? `Editando usuário ID ${editingUser.id}` : "Novo usuário"}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowAddUserModal(false)} className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold">
                      Cancelar
                    </button>
                    <button onClick={handleSaveUser} disabled={isRunning} className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2">
                      {isRunning ? <Activity size={16} className="animate-spin" /> : editingUser ? "Salvar alterações" : "Criar usuário"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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

const panelInputClass =
  "h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-200 outline-none focus:border-primary/50 transition-colors";

const panelTextareaClass =
  "min-h-[120px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-200 outline-none focus:border-primary/50 transition-colors";

function PanelToggle({ checked, onChange, label }: { checked: boolean; onChange: React.ChangeEventHandler<HTMLInputElement>; label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
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
