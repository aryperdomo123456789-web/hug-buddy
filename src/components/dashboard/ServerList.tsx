import React from "react";
import { Server as ServerIcon, RefreshCw, Activity, Globe } from "lucide-react";

interface ServerListProps {
  servers: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function ServerList({ servers, loading, onRefresh }: ServerListProps) {
  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ServerIcon className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tighter">Servidores de Streaming</h2>
        </div>
        <button 
          onClick={onRefresh} 
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-2 rounded-lg border border-zinc-800 transition-all"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <div key={server.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1">ID: #{server.id}</div>
                <div className="text-lg font-bold text-zinc-100 uppercase">{server.name}</div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${server.status === 1 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {server.status === 1 ? 'Online' : 'Offline'}
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-500">
                <Activity size={14} />
                <span className="text-[10px] font-bold uppercase">Última Verificação: {new Date(server.last_check * 1000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        {servers.length === 0 && !loading && (
          <div className="col-span-full py-10 text-center text-zinc-600 italic">Nenhum servidor encontrado no Odin.</div>
        )}
      </div>
    </section>
  );
}
