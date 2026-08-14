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
  Trash2
} from "lucide-react";
import { 
  runSSHCommand, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getServers, 
  getStreams 
} from "@/lib/server.functions";
import { getOdinConfig } from "@/lib/odin";
import { toast } from "sonner";

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

function Dashboard() {
  const { odin } = Route.useLoaderData();
  const [view, setView] = React.useState<'dashboard' | 'customers' | 'servers' | 'streams'>('dashboard');
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
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

  const fetchUsersFn = useServerFn(getUsers);
  const createUserFn = useServerFn(createUser);
  const updateUserFn = useServerFn(updateUser);
  const deleteUserFn = useServerFn(deleteUser);

  const handleFetchUsers = async () => {
    try {
      const res = await fetchUsersFn();
      if (res.success) setCustomers(res.data || []);
    } catch (e) { toast.error("Erro ao carregar clientes"); }
  };

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
    const res = await deleteUserFn({ data: { id: user.id } });
    if (res.success) { toast.success("Removido!"); handleFetchUsers(); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-10 font-sans">
      <div className="flex gap-10">
        <aside className="w-64 space-y-4">
           <NavItem label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
           <NavItem label="Clientes" active={view === 'customers'} onClick={() => { setView('customers'); handleFetchUsers(); }} />
        </aside>
        <main className="flex-1">
          <h1 className="text-3xl font-bold mb-8 uppercase">{view}</h1>
          {view === 'customers' && (
             <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 p-6 shadow-xl">
               <button onClick={() => { setEditingUser(null); setShowAddUserModal(true); }} className="bg-primary px-5 py-2.5 rounded-xl font-bold mb-6 flex items-center gap-2">
                 <UserPlus size={18} /> Novo Cliente
               </button>
               <table className="w-full">
                 <thead>
                    <tr className="text-zinc-500 text-xs uppercase text-left">
                        <th className="p-4">Usuário</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4">Expiração</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                  {customers.map(u => (
                    <tr key={u.id} className="text-sm">
                      <td className="p-4 font-bold text-zinc-200">{u.username}</td>
                      <td className="p-4 text-center">
                        <span className={u.enabled == 1 ? "text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-[10px]" : "text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-[10px]"}>
                          {u.enabled == 1 ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-400">{new Date(u.exp_date * 1000).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <button onClick={() => { setEditingUser(u); setShowAddUserModal(true); }} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteUser(u)} className="p-2 hover:bg-red-900/30 rounded-lg text-red-400"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                 </tbody>
               </table>
             </section>
          )}
        </main>
      </div>
      
      {showAddUserModal && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
           <div className="bg-[#0f0f12] p-8 rounded-2xl w-full max-w-lg border border-zinc-800">
             <h3 className="text-xl font-bold mb-6">{editingUser ? "Editar Cliente" : "Forjar Novo Cliente"}</h3>
             <div className="space-y-4">
                <Field label="Username"><input className="w-full bg-black/50 p-3 rounded-xl border border-zinc-800" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} /></Field>
                <Field label="Password"><input className="w-full bg-black/50 p-3 rounded-xl border border-zinc-800" type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} /></Field>
             </div>
             <div className="flex gap-4 mt-8">
               <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-3 bg-zinc-900 rounded-xl">Cancelar</button>
               <button onClick={handleSaveUser} className="flex-1 py-3 bg-primary rounded-xl font-bold">Salvar</button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`block w-full p-4 rounded-xl font-bold text-sm text-left ${active ? 'bg-primary text-white' : 'hover:bg-zinc-800'}`}>{label}</button>;
}
