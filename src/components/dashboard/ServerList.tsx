import React from "react";
import { Server as ServerIcon, RefreshCw, Activity, Cpu, HardDrive, Network, Users } from "lucide-react";

interface ServerListProps {
  servers: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function ServerList({ servers, loading, onRefresh }: ServerListProps) {
  return (
    <section className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-4 md:p-6 border-b border-zinc-900 bg-zinc-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ServerIcon className="text-blue-500" size={24} />
          <h2 className="text-lg md:text-xl font-bold text-zinc-100 uppercase tracking-tighter">Servidores</h2>
        </div>
        <button 
          onClick={onRefresh} 
          className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-4 py-3 sm:py-2 rounded-lg border border-zinc-800 transition-all flex items-center justify-center gap-2 text-xs font-bold min-h-[44px]"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          ATUALIZAR
        </button>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {servers.map((server) => (
          <div key={server.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 md:p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg ${server.status === 1 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {server.status === 1 ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className={`p-4 rounded-2xl ${server.status === 1 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                <ServerIcon size={32} />
              </div>
              <div>
                <div className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1">ID: #{server.id} | PORTA: {server.port}</div>
                <div className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">{server.name}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Users size={12} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Clientes</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{server.total_clients}</div>
              </div>
              
              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Cpu size={12} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">CPU</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{server.hardware?.cpu_usage || 0}%</div>
              </div>

              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <HardDrive size={12} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">RAM</span>
                </div>
                <div className="text-lg font-black text-zinc-100">
                  {server.hardware?.total_ram ? Math.round((server.hardware.total_used / server.hardware.total_ram) * 100) : 0}%
                </div>
              </div>

              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Network size={12} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Rede</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{server.hardware?.network_speed || '1G'}</div>
              </div>
            </div>

            <div className="space-y-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest pt-4 border-t border-zinc-800/30">
              <div className="flex justify-between">
                <span>Kernel: {server.hardware?.kernel || 'N/A'}</span>
                <span className="text-zinc-500 flex items-center gap-1">
                  <Activity size={10} />
                  VIVO HÁ: {server.hardware?.uptime || 'N/A'}
                </span>
              </div>
              <div>CPU: {server.hardware?.cpu_name || 'Desconhecido'}</div>
            </div>
          </div>
        ))}
        {servers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <ServerIcon className="mx-auto text-zinc-800 mb-4" size={48} />
            <div className="text-zinc-600 italic font-medium">Nenhum servidor de streaming detectado no ecossistema Odin.</div>
          </div>
        )}
      </div>
    </section>
  );
}
