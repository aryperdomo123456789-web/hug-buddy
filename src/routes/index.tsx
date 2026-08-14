import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Users, 
  Server as ServerIcon, 
  Terminal, 
  ShieldAlert, 
  LayoutDashboard, 
  Settings,
  PlusCircle,
  Activity,
  UserPlus,
  Play,
  Trash2,
  Database,
  Globe,
  Cpu,
  Monitor
} from "lucide-react";
import { 
  runSSHCommand, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getServers, 
  getStreams,
  getBouquets,
  killUserConnections,
  toggleUserStatus
} from "@/lib/server.functions";
import { getOdinConfig } from "@/lib/odin";
import { toast } from "sonner";

type UserEditorState = {
  id?: number;
  username: string;
  password: string;
  owner: string;
  member_id: number;
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

function StatCard({ label, value, icon: Icon, color = "blue" }: { label: string, value: string | number, icon: any, color?: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-green-500 bg-green-500/10",
    red: "text-red-500 bg-red-500/10",
    purple: "text-purple-500 bg-purple-500/10",
  };

  return (
    <div className="bg-[#0f0f12] p-6 rounded-2xl border border-zinc-800 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function Dashboard() {
  const { odin } = Route.useLoaderData();
  const [view, setView] = React.useState<'dashboard' | 'customers' | 'servers' | 'streams'>('dashboard');
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [bouquets, setBouquets] = React.useState<any[]>([]);
  const [servers, setServers] = React.useState<any[]>([]);
  const [streams, setStreams] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'details' | 'advanced' | 'restrictions' | 'bouquets'>('details');
  const [loading, setLoading] = React.useState(false);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [newUserData, setNewUserData] = React.useState<UserEditorState>({
    username: "",
    password: "",
    owner: "SuaFonte444",
    member_id: 1,
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

  const fetchUsersFn = useServerFn(getUsers);
  const fetchServersFn = useServerFn(getServers);
  const fetchStreamsFn = useServerFn(getStreams);
  const fetchBouquetsFn = useServerFn(getBouquets);
  const createUserFn = useServerFn(createUser);
  const updateUserFn = useServerFn(updateUser);
  const deleteUserFn = useServerFn(deleteUser);
  const killConnectionsFn = useServerFn(killUserConnections);
  const toggleStatusFn = useServerFn(toggleUserStatus);

  const handleFetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([fetchUsersFn(), fetchBouquetsFn()]);
      if (uRes.success) setCustomers(uRes.data || []);
      if (bRes.success) setBouquets(bRes.data || []);
    } catch (e) { toast.error("Erro ao carregar clientes"); }
    finally { setLoading(false); }
  };

  const handleFetchServers = async () => {
    setLoading(true);
    try {
      const res = await fetchServersFn();
      if (res.success) setServers(res.data || []);
    } catch (e) { toast.error("Erro ao carregar servidores"); }
    finally { setLoading(false); }
  };

  const handleFetchStreams = async () => {
    setLoading(true);
    try {
      const res = await fetchStreamsFn();
      if (res.success) setStreams(res.data || []);
    } catch (e) { toast.error("Erro ao carregar streams"); }
    finally { setLoading(false); }
  };

  const handleFetchDashboard = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, stRes, bRes] = await Promise.all([fetchUsersFn(), fetchServersFn(), fetchStreamsFn(), fetchBouquetsFn()]);
      if (uRes.success) setCustomers(uRes.data || []);
      if (sRes.success) setServers(sRes.data || []);
      if (stRes.success) setStreams(stRes.data || []);
      if (bRes.success) setBouquets(bRes.data || []);
    } catch (e) { toast.error("Erro ao carregar dashboard"); }
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    if (view === 'dashboard') handleFetchDashboard();
    else if (view === 'customers') handleFetchUsers();
    else if (view === 'servers') handleFetchServers();
    else if (view === 'streams') handleFetchStreams();
  }, [view]);

  const handleSaveUser = async () => {
    if (!newUserData.username || !newUserData.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    try {
      const exp_date = Math.floor(Date.now() / 1000) + (newUserData.exp_days * 86400);
      const userData = {
        username: newUserData.username,
        password: newUserData.password,
        exp_date,
        enabled: newUserData.enabled ? 1 : 0,
        max_connections: newUserData.max_connections,
        member_id: 1,
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
      };

      if (editingUser) {
        const res = await updateUserFn({ data: { id: editingUser.id, ...userData } });
        if (res.success) { toast.success("Atualizado!"); setShowAddUserModal(false); setEditingUser(null); handleFetchUsers(); }
      } else {
        const res = await createUserFn({ data: userData });
        if (res.success) { toast.success("Criado!"); setShowAddUserModal(false); handleFetchUsers(); }
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Deseja realmente excluir o usuário ${user.username}?`)) return;
    const res = await deleteUserFn({ data: { id: user.id } });
    if (res.success) { toast.success("Removido!"); handleFetchUsers(); }
    else { toast.error("Erro ao remover usuário"); }
  };

  const onlineUsers = customers.reduce((acc, curr) => acc + (curr.active_cons || 0), 0);
  const onlineStreams = streams.filter(s => s.is_online === 1).length;

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
            {loading && <div className="animate-spin text-blue-500"><Activity size={20} /></div>}
          </div>

          {view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Clientes Totais" value={customers.length} icon={Users} color="blue" />
              <StatCard label="Usuários Online" value={onlineUsers} icon={Activity} color="green" />
              <StatCard label="Streams Ativas" value={`${onlineStreams}/${streams.length}`} icon={Monitor} color="purple" />
              <StatCard label="Servidores" value={servers.length} icon={ServerIcon} color="blue" />
            </div>
          )}

          {view === 'customers' && (
             <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
                 <div className="flex gap-4">
                   <button onClick={() => { setEditingUser(null); setActiveTab('details'); setShowAddUserModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm">
                     <PlusCircle size={18} /> Adicionar um Utilizador
                   </button>
                   <div className="flex bg-zinc-900 rounded-lg p-1">
                      <button className="px-4 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-800 rounded-md shadow-sm">Modo Manual</button>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="relative">
                      <input type="text" placeholder="Pesquisar Utilizadores..." className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 text-xs text-zinc-300 w-64 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      {customers.length} Utilizadores
                    </div>
                 </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                      <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-widest text-left border-b border-zinc-900">
                          <th className="py-4 px-6 font-black">ID</th>
                          <th className="py-4 px-6 font-black">Nome do Utilizador</th>
                          <th className="py-4 px-6 font-black">Senha</th>
                          <th className="py-4 px-6 font-black">Revendedor</th>
                          <th className="py-4 px-6 font-black text-center">Estado</th>
                          <th className="py-4 px-6 font-black text-center">Teste</th>
                          <th className="py-4 px-6 font-black">Expiração</th>
                          <th className="py-4 px-6 font-black">Dias</th>
                          <th className="py-4 px-6 font-black text-center">Conns.</th>
                          <th className="py-4 px-6 font-black">Info</th>
                          <th className="py-4 px-6 font-black text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-900/50">
                    {customers.map(u => {
                      const daysLeft = u.exp_date ? Math.max(0, Math.ceil((u.exp_date - Date.now() / 1000) / 86400)) : null;
                      return (
                      <tr key={u.id} className="text-xs group hover:bg-blue-600/5 transition-colors border-b border-zinc-900/30">
                        <td className="py-4 px-6 font-mono text-zinc-600">{u.id}</td>
                        <td className="py-4 px-6 font-bold text-zinc-200">{u.username}</td>
                        <td className="py-4 px-6 text-zinc-500 font-mono">{u.password}</td>
                        <td className="py-4 px-6 text-zinc-400">{u.owner || 'SuaFonte444'}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={u.enabled == 1 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase" : "bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase"}>
                            {u.enabled == 1 ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={u.is_trial == 1 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase" : "bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[9px] font-black uppercase"}>
                            {u.is_trial == 1 ? 'Trial' : 'Official'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-zinc-400">
                          {u.exp_date ? new Date(u.exp_date * 1000).toLocaleDateString() : 'Unlimited'}
                        </td>
                        <td className="py-4 px-6 font-mono text-zinc-500">
                          {daysLeft !== null ? `${daysLeft}d` : '-'}
                        </td>
                        <td className="py-4 px-6 text-center font-mono">
                          <span className={u.active_cons > 0 ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                            {u.active_cons}
                          </span>
                          <span className="text-zinc-800 mx-1">/</span>
                          <span className="text-zinc-500">{u.max_connections}</span>
                        </td>
                        <td className="py-4 px-6 text-[10px] text-zinc-500 max-w-[150px] truncate">
                          {u.isp_info || '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={async () => {
                              const res = await toggleStatusFn({ data: { id: u.id, enabled: u.enabled == 1 ? 0 : 1 } });
                              if (res.success) { toast.success("Status alterado!"); handleFetchUsers(); }
                            }} title="Toggle Status" className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white transition-all"><ShieldAlert size={12} /></button>
                            
                            <button onClick={() => { 
                              setEditingUser(u); 
                              setNewUserData({
                                id: u.id,
                                username: u.username,
                                password: u.password,
                                owner: u.owner || 'SuaFonte444',
                                member_id: u.member_id || 1,
                                exp_days: daysLeft || 30,
                                max_connections: u.max_connections,
                                enabled: u.enabled == 1,
                                admin_enabled: u.admin_enabled == 1,
                                trial: u.is_trial == 1,
                                forced_portal: u.forced_portal == 1,
                                restreamer: u.is_restreamer == 1,
                                force_country: u.forced_country || "Off",
                                ip_lock: u.is_isplock == 1,
                                allowed_ips: u.allowed_ips || "",
                                allowed_agents: u.allowed_ua || "",
                                notes_admin: u.admin_notes || "",
                                notes_reseller: u.reseller_notes || "",
                                bouquet_ids: u.bouquet || "[1]",
                              });
                              setActiveTab('details');
                              setShowAddUserModal(true); 
                            }} title="Editar" className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white transition-all"><Settings size={12} /></button>
                            
                            <button onClick={async () => {
                              const res = await killConnectionsFn({ data: { id: u.id } });
                              if (res.success) toast.success("Conexões derrubadas!");
                            }} title="Kill Connections" className="p-1.5 bg-zinc-900 hover:bg-red-900/20 border border-zinc-800 rounded text-zinc-400 hover:text-red-500 transition-all"><Play size={12} className="rotate-90" /></button>
                            
                            <button onClick={() => handleDeleteUser(u)} title="Remover" className="p-1.5 bg-zinc-900 hover:bg-red-900/20 border border-zinc-800 rounded text-red-900 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                   </tbody>
                 </table>
               </div>
             </section>
          )}

          {view === 'servers' && (
            <div className="space-y-8">
              <section className="bg-[#0f0f12] p-8 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShieldAlert size={120} />
                </div>
                <h2 className="text-xl font-black text-blue-500 uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Terminal size={20} /> API & Conexão SSH
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Field label="Token de Acesso Mago">
                      <div className="bg-black p-4 rounded-xl border border-zinc-900 font-mono text-blue-400 text-sm break-all">
                        {odin.sshHost === '23.158.72.30' ? 'p0P2pycjQooGKKO2fqdkIagwfNA03DFj' : 'AGUARDANDO CONFIGURAÇÃO...'}
                      </div>
                    </Field>
                    <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/20">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                        Este token autentica seu servidor Odin v6 com este painel. Mantenha-o em segurança.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Field label="Comando de Instalação">
                      <div className="group relative">
                        <div className="bg-black p-4 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs overflow-x-auto whitespace-pre group-hover:text-blue-400 transition-colors">
                          bash &lt;(curl -sSL https://{typeof window !== 'undefined' ? window.location.host : 'mago.lovable.app'}/api/public/install)
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`bash <(curl -sSL https://${window.location.host}/api/public/install)`);
                            toast.success("Comando copiado!");
                          }}
                          className="absolute right-2 top-2 p-2 bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Database size={14} />
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>
              </section>
              <section className="bg-[#0f0f12] p-8 rounded-2xl border border-zinc-800 shadow-xl">

                <h2 className="text-xl font-black text-blue-500 uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Database size={20} /> Conexão MariaDB/MySQL
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Host do Banco">
                    <div className="bg-black p-3.5 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs">
                      {odin.dbHost}
                    </div>
                  </Field>
                  <Field label="Porta">
                    <div className="bg-black p-3.5 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs">
                      {odin.dbPort}
                    </div>
                  </Field>
                  <Field label="Base de Dados">
                    <div className="bg-black p-3.5 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs">
                      {odin.dbName}
                    </div>
                  </Field>
                  <Field label="Usuário">
                    <div className="bg-black p-3.5 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs">
                      {odin.dbUsername}
                    </div>
                  </Field>
                  <Field label="Senha">
                    <div className="bg-black p-3.5 rounded-xl border border-zinc-900 font-mono text-zinc-400 text-xs blur-sm hover:blur-none transition-all cursor-help">
                      {odin.sshHost === '23.158.72.30' ? 'Y92RYuXHLP58AbOciQW' : '********'}
                    </div>
                  </Field>
                  <div className="flex items-end">
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl w-full flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Banco Conectado</span>
                    </div>
                  </div>
                </div>
              </section>


              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map(s => (
                  <div key={s.id} className="bg-[#0f0f12] p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-blue-600 shadow-xl group hover:border-l-blue-400 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100">{s.server_name}</h3>
                        <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest mt-1">{s.server_ip}</div>
                      </div>
                      <span className={s.status == 1 ? "text-green-500 animate-pulse" : "text-red-500"}>
                        <Activity size={18} />
                      </span>
                    </div>
                    <div className="mt-6 flex justify-between items-end">
                      <div>
                        <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Carga</div>
                        <div className="text-xl font-bold text-zinc-300 group-hover:text-blue-400 transition-colors">{s.total_clients} <span className="text-xs text-zinc-600 font-medium">clientes</span></div>
                      </div>
                      <div className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Porta: {s.server_port}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'streams' && (
            <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 p-6 shadow-xl">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                      <tr className="text-zinc-500 text-[10px] uppercase tracking-widest text-left border-b border-zinc-900">
                          <th className="pb-4 px-4 font-black">ID</th>
                          <th className="pb-4 px-4 font-black">Nome do Canal</th>
                          <th className="pb-4 px-4 font-black text-center">Status</th>
                          <th className="pb-4 px-4 font-black">Bitrate</th>
                          <th className="pb-4 px-4 font-black text-right">Server ID</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-900/50">
                    {streams.map(s => (
                      <tr key={s.id} className="text-sm hover:bg-zinc-800/10 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-zinc-600">{s.id}</td>
                        <td className="py-4 px-4 font-bold text-zinc-200">{s.stream_display_name}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <div className={`w-2 h-2 rounded-full ${s.is_online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500'}`} />
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-zinc-500">{s.bitrate || 0} kbps</td>
                        <td className="py-4 px-4 text-right font-mono text-xs text-zinc-600">{s.server_id}</td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
               </div>
            </section>
          )}
        </main>
      </div>
      
      {showAddUserModal && (
         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#0f0f12] p-10 rounded-3xl w-full max-w-2xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black uppercase tracking-tighter text-blue-500">
                 {editingUser ? "Modificar Utilizador" : "Forjar Novo Acesso"}
               </h3>
               <button onClick={() => setShowAddUserModal(false)} className="text-zinc-600 hover:text-white transition-colors">
                 <Trash2 size={24} />
               </button>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <Field label="Username"><input className="w-full bg-black p-3.5 rounded-xl border border-zinc-900 focus:border-blue-600 outline-none transition-all font-mono" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} /></Field>
                <Field label="Password"><input className="w-full bg-black p-3.5 rounded-xl border border-zinc-900 focus:border-blue-600 outline-none transition-all font-mono" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} /></Field>
                <Field label="Dias Expiração"><input type="number" className="w-full bg-black p-3.5 rounded-xl border border-zinc-900 focus:border-blue-600 outline-none transition-all font-mono" value={newUserData.exp_days} onChange={e => setNewUserData({...newUserData, exp_days: Number(e.target.value)})} /></Field>
                <Field label="Conexões Max"><input type="number" className="w-full bg-black p-3.5 rounded-xl border border-zinc-900 focus:border-blue-600 outline-none transition-all font-mono" value={newUserData.max_connections} onChange={e => setNewUserData({...newUserData, max_connections: Number(e.target.value)})} /></Field>
             </div>
             
             <div className="flex gap-4 mt-12">
               <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-4 bg-zinc-950 text-zinc-500 font-bold rounded-xl border border-zinc-900 hover:bg-zinc-900 transition-all uppercase tracking-widest text-xs">Descartar</button>
               <button onClick={handleSaveUser} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-xs">Confirmar Forja</button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-sm text-left transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200'
      }`}
    >
      <Icon size={20} />
      <span className="uppercase tracking-tighter">{label}</span>
    </button>
  );
}