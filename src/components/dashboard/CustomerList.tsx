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
  UserPlus,
  RefreshCw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { generateM3ULink } from "@/lib/server.functions";
import { Plan } from "@/types/odin";

function formatStableDate(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value * 1000));
}

interface CustomerListProps {
  customers: User[];
  resellers: any[];
  plans: Plan[];
  settings: Record<string, any>;
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
  resellers,
  plans,
  settings,
  loading,

  onRefresh, 
  onDelete, 
  onEdit, 
  onAdd, 
  onToggleStatus, 
  onKill 
}: CustomerListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [perPage, setPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const copySalesMessage = (u: User) => {
    try {
      // 1. Get plan-specific template or fallback to global template
      const userPlan = plans.find(p => p.name === u.package_name);
      const globalTemplate = settings?.['global_template'] || "";
      const template = userPlan?.template || globalTemplate;

      if (!template) {
        toast.error("Template de mensagem não configurado (Global ou no Plano)");
        return;
      }

      // 2. Fetch DNS config for links
      const dns = settings?.['dns_config']?.host || window.location.origin;

      // 3. Simple placeholder replacement
      let msg = template
        .replace(/{username}/g, u.username)
        .replace(/{password}/g, u.password)
        .replace(/{connections}/g, String(u.max_connections))
        .replace(/{package}/g, u.package_name || userPlan?.name || 'N/A')
        .replace(/{plan_price}/g, userPlan?.plan_price ? `R$ ${Number(userPlan.plan_price).toFixed(2)}` : (userPlan?.price ? `R$ ${Number(userPlan.price).toFixed(2)}` : 'N/A'))
        .replace(/{pay_url}/g, userPlan?.pay_url || 'N/A')
        .replace(/{dns}/g, dns)
        .replace(/{dns_host}/g, userPlan?.dns_host || dns.replace(/^https?:\/\//, ''))
        .replace(/{expires_at}/g, u.exp_date ? new Date(u.exp_date * 1000).toLocaleDateString('pt-BR') : 'Ilimitado');
      
      navigator.clipboard.writeText(msg);
      toast.success("Mensagem de venda copiada!");
    } catch (e) {
      toast.error("Erro ao gerar mensagem");
    }
  };

  const filteredCustomers = React.useMemo(() => {
    let result = customers;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.username?.toLowerCase().includes(term) || 
        c.id?.toString().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") result = result.filter(c => c.enabled === 1);
      if (statusFilter === "blocked") result = result.filter(c => c.enabled === 0);
      if (statusFilter === "trial") result = result.filter(c => c.is_trial === 1);
      if (statusFilter === "official") result = result.filter(c => c.is_trial === 0);
      if (statusFilter === "expired") {
        const now = Date.now() / 1000;
        result = result.filter(c => (c.exp_date || 0) > 0 && (c.exp_date || 0) < now);
      }
    }

    return result;
  }, [customers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / perPage);
  const paginatedCustomers = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCustomers.slice(start, start + perPage);
  }, [filteredCustomers, currentPage, perPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, perPage]);

  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
        <div className="flex gap-4">
          <button 
            onClick={() => onRefresh()} 
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-2 rounded-lg border border-zinc-800 transition-all flex items-center gap-2"
            title="Sincronizar Lista"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={onAdd} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
          >
            <PlusCircle size={18} /> Adicionar um Utilizador
          </button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Sem filtro</option>
              <option value="active">Activo</option>
              <option value="blocked">Desativado</option>
              <option value="trial">Teste</option>
              <option value="official">Official</option>
              <option value="expired">Expirado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Mostrar</span>
            <select 
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>

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
            {filteredCustomers.length} Total
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-widest text-left border-b border-zinc-900">
              <th className="py-4 px-6 font-black">ID</th>
              <th className="py-4 px-6 font-black">Utilizador</th>
              <th className="py-4 px-6 font-black">Dono</th>
              <th className="py-4 px-6 font-black">Senha</th>
              <th className="py-4 px-6 font-black text-center">Estado</th>
              <th className="py-4 px-6 font-black text-center">Teste</th>
              <th className="py-4 px-6 font-black">Expiração</th>
              <th className="py-4 px-6 font-black text-center">Conns.</th>
              <th className="py-4 px-6 font-black">Bouquets</th>
              <th className="py-4 px-6 font-black text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {paginatedCustomers.map(u => {
              const daysLeft = u.exp_date ? Math.max(0, Math.ceil((u.exp_date - Date.now() / 1000) / 86400)) : null;
              return (
                <tr key={u.id} className="text-xs group hover:bg-blue-600/5 transition-all duration-200 border-b border-zinc-900/30">
                  <td className="py-4 px-6 font-mono text-zinc-600">{u.id}</td>
                  <td className="py-4 px-6 font-bold text-zinc-200">{u.username}</td>
                  <td className="py-4 px-6 text-zinc-500 italic">
                    {resellers.find(r => r.id === u.owner_id)?.username || 'Admin'}
                  </td>
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
                    {u.exp_date ? formatStableDate(u.exp_date) : "Unlimited"}
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
                  <td className="py-4 px-6">
                    <div className="text-[9px] text-zinc-600 font-mono truncate max-w-[100px]">
                      {u.bouquet}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={async () => {
                          try {
                            const url = await generateM3ULink({ data: { username: u.username, password: u.password } });
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(url);
                              toast.success("Link M3U copiado!");
                            } else {
                              window.alert(`Link M3U:\n${url}`);
                            }
                          } catch (e) {
                            toast.error("Erro ao gerar link M3U");
                          }
                        }}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-lg border border-zinc-800 transition-all"
                        title="Download Playlist / Copiar Link"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => copySalesMessage(u)} 
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 rounded-lg border border-zinc-800 transition-all"
                        title="Copiar Dados de Acesso"
                      >
                        <MessageSquare size={14} />
                      </button>
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex justify-between items-center">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Página {currentPage} de {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 bg-zinc-900 disabled:opacity-30 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-zinc-800 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black text-blue-500">
            {currentPage}
          </div>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-2 bg-zinc-900 disabled:opacity-30 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-zinc-800 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
