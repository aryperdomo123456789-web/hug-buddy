import React from "react";
import { Monitor, RefreshCw, Play, Settings, AlertCircle } from "lucide-react";

interface StreamListProps {
  streams: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function StreamList({ streams, loading, onRefresh }: StreamListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = streams.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toString().includes(searchTerm)
  );

  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-4 md:p-6 border-b border-zinc-900 bg-zinc-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Monitor className="text-purple-500" size={24} />
          <h2 className="text-lg md:text-xl font-bold text-zinc-100 uppercase tracking-tighter">Gestão de Streams</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Pesquisar Streams..." 
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-xs text-zinc-300 sm:w-64 focus:outline-none focus:border-purple-500 transition-all min-h-[44px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={onRefresh} 
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-3 rounded-lg border border-zinc-800 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-widest text-left border-b border-zinc-900">
              <th className="py-4 px-6 font-black">ID</th>
              <th className="py-4 px-6 font-black">Stream</th>
              <th className="py-4 px-6 font-black">Categoria</th>
              <th className="py-4 px-6 font-black">Estado</th>
              <th className="py-4 px-6 font-black text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {filtered.map(s => (
              <tr key={s.id} className="text-xs group hover:bg-purple-600/5 transition-colors">
                <td className="py-4 px-6 font-mono text-zinc-600">#{s.id}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    {s.icon ? (
                      <img src={s.icon} alt="" className="w-8 h-8 rounded bg-zinc-900 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-700">
                        <Monitor size={14} />
                      </div>
                    )}
                    <div className="font-bold text-zinc-200">{s.name}</div>
                  </div>
                </td>
                <td className="py-4 px-6 text-zinc-500">CAT #{s.category_id}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${s.status === 1 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {s.status === 1 ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-lg border border-zinc-800 transition-all">
                      <Play size={14} />
                    </button>
                    <button className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 rounded-lg border border-zinc-800 transition-all">
                      <Settings size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-zinc-700 italic">Nenhum stream encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
