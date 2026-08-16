import React from "react";
import { User } from "@/types/odin";
import { 
  PlusCircle, 
  Trash2, 
  Play, 
  Settings, 
  Activity, 
  Globe, 
  Database,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";

interface CustomerListProps {
  customers: User[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (user: User) => Promise<void>;
  onEdit: (user: User) => void;
  onAdd: () => void;
  onToggleStatus: (user: User) => Promise<void>;
  onKill: (user: User) => Promise<void>;
}

export function CustomerList({ 
  customers, 
  loading, 
  onRefresh, 
  onDelete, 
  onEdit, 
  onAdd, 
  onToggleStatus, 
  onKill 
}: CustomerListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.username?.toLowerCase().includes(term) || 
      c.id?.toString().includes(term)
    );
  }, [customers, searchTerm]);

  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
        <div className="flex gap-4">
          <button 
            onClick={onAdd} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
          >
            <PlusCircle size={18} /> Adicionar um Utilizador
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Pesquisar Utilizadores..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 text-xs text-zinc-300 w-64 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
            {filteredCustomers.length} Utilizadores
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-widest text-left border-b border-zinc-900">
              <th className="py-4 px-6 font-black">ID</th>
              <th className="py-4 px-6 font-black">Utilizador</th>
              <th className="py-4 px-6 font-black">Senha</th>
              <th className="py-4 px-6 font-black text-center">Estado</th>
              <th className="py-4 px-6 font-black text-center">Teste</th>
              <th className="py-4 px-6 font-black">Expiração</th>
              <th className="py-4 px-6 font-black">Dias</th>
              <th className="py-4 px-6 font-black text-center">Conns.</th>
              <th className="py-4 px-6 font-black text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {filteredCustomers.map(u => {
              const daysLeft = u.exp_date ? Math.max(0, Math.ceil((u.exp_date - Date.now() / 1000) / 86400)) : null;
              return (
                <tr key={u.id} className="text-xs group hover:bg-blue-600/5 transition-colors border-b border-zinc-900/30">
                  <td className="py-4 px-6 font-mono text-zinc-600">{u.id}</td>
                  <td className="py-4 px-6 font-bold text-zinc-200">{u.username}</td>
                  <td className="py-4 px-6 text-zinc-500 font-mono">{u.password}</td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => onToggleStatus(u)}
                      className={u.enabled == 1 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase" : "bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase"}
                    >
                      {u.enabled == 1 ? 'Active' : 'Blocked'}
                    </button>
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
                    <div className="flex items-center justify-center gap-2">
                      <span className={(u.active_cons || 0) > 0 ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                        {u.active_cons || 0}
                      </span>
                      <span className="text-zinc-800">/</span>
                      <span className="text-zinc-500">{u.max_connections}</span>
                      {(u.active_cons || 0) > 0 && (
                        <button 
                          onClick={() => onKill(u)}
                          className="text-red-500 hover:text-red-400 p-1"
                          title="Derrubar Conexões"
                        >
                          <Activity size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(u)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 rounded-lg border border-zinc-800 transition-all">
                        <Settings size={14} />
                      </button>
                      <button onClick={() => onDelete(u)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg border border-zinc-800 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
