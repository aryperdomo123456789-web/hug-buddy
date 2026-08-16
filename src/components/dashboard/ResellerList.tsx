import React from "react";
import { Reseller } from "@/types/odin";
import { PlusCircle, Trash2, Settings, RefreshCw, Filter, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";

interface ResellerListProps {
  resellers: Reseller[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (r: Reseller) => Promise<void>;
  onEdit: (r: Reseller) => void;
  onAdd: () => void;
}

export function ResellerList({ resellers, loading, onRefresh, onDelete, onEdit, onAdd }: ResellerListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = resellers.filter(r => 
    r.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/30">
        <div className="flex gap-4">
          <button onClick={onRefresh} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-2 rounded-lg border border-zinc-800 transition-all" disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm">
            <PlusCircle size={18} /> Adicionar Revenda
          </button>
        </div>
        <input 
          placeholder="Pesquisar revendas..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 text-xs text-zinc-300 w-64"
        />
      </div>

      <table className="w-full">
        <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-black tracking-widest text-left">
          <tr>
            <th className="py-4 px-6">ID</th>
            <th className="py-4 px-6">Revendedor</th>
            <th className="py-4 px-6">Email</th>
            <th className="py-4 px-6 text-center">Créditos</th>
            <th className="py-4 px-6 text-center">Clientes</th>
            <th className="py-4 px-6 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/50">
          {filtered.map(r => (
            <tr key={r.id} className="text-xs text-zinc-300 hover:bg-zinc-900/50">
              <td className="py-4 px-6 font-mono text-zinc-600">{r.id}</td>
              <td className="py-4 px-6 flex items-center gap-3 font-bold">
                <UserCircle size={16} className="text-blue-500" />
                {r.username}
              </td>
              <td className="py-4 px-6 text-zinc-500">{r.email}</td>
              <td className="py-4 px-6 text-center font-bold text-emerald-500">{r.credits}</td>
              <td className="py-4 px-6 text-center">{r.user_count}</td>
              <td className="py-4 px-6 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(r)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-blue-500"><Settings size={14} /></button>
                  <button onClick={() => onDelete(r)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-red-500"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
