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
  XCircle,
  Trash2,
  ToggleLeft
} from "lucide-react";
import { 
  runSSHCommand, 
  getUsers, 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  deleteUser, 
  getServers, 
  getStreams 
} from "@/lib/server.functions";
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
        sshPort: cfg.sshPort,
        sshUsername: cfg.sshUsername,
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
      if (res.success) { toast.success("Atualizado!"); setShowAddUserModal(false); handleFetchUsers(); }
    } else {
      const res = await createUserFn({ data: userData });
      if (res.success) { toast.success("Criado!"); setShowAddUserModal(false); handleFetchUsers(); }
    }
  };

  const handleDeleteUser = async (user: any) => {
    const res = await deleteUserFn({ data: { id: user.id } });
    if (res.success) { toast.success("Removido!"); handleFetchUsers(); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-10">
      <div className="flex gap-10">
        <aside className="w-64 space-y-4">
           <NavItem label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
           <NavItem label="Clientes" active={view === 'customers'} onClick={() => { setView('customers'); handleFetchUsers(); }} />
        </aside>
        <main className="flex-1">
          {view === 'customers' && (
             <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 p-6">
               <button onClick={() => { setEditingUser(null); setShowAddUserModal(true); }} className="bg-primary px-4 py-2 rounded-xl mb-4">Novo Cliente</button>
               <table className="w-full">
                 {customers.map(u => (
                   <tr key={u.id} className="border-b border-zinc-800">
                     <td className="p-4">{u.username}</td>
                     <td className="p-4 text-right flex gap-2">
                       <button onClick={() => { setEditingUser(u); setShowAddUserModal(true); }}><Settings size={16} /></button>
                       <button onClick={() => handleDeleteUser(u)}><Trash2 size={16} /></button>
                     </td>
                   </tr>
                 ))}
               </table>
             </section>
          )}
        </main>
      </div>
      
      {showAddUserModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
           <div className="bg-[#0f0f12] p-8 rounded-2xl w-full max-w-md border border-zinc-800">
             <input className="w-full bg-black mb-4 p-3 rounded" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} placeholder="Username" />
             <input className="w-full bg-black mb-4 p-3 rounded" type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} placeholder="Password" />
             <div className="flex gap-4">
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
  return <button onClick={onClick} className={`block w-full p-3 rounded ${active ? 'bg-primary' : 'hover:bg-zinc-800'}`}>{label}</button>;
}
