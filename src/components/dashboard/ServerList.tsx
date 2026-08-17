import React from "react";
import { Server as ServerIcon, RefreshCw, Activity, Cpu, HardDrive, Network, Users, Tv, Settings } from "lucide-react";

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
          <div key={server.id} className="bg-[#16161a] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl group transition-all hover:border-blue-500/30">
            {/* Server Header */}
            <div className="bg-zinc-900/80 p-3 px-4 flex justify-between items-center border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Tv size={16} className="text-zinc-400" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xs font-black text-zinc-100 uppercase tracking-tight">{server.name}</span>
                  <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">—</span>
                  <span className="text-[10px] text-zinc-500 font-bold">{server.hardware?.ip || 'IP N/A'}</span>
                  <span className="text-[10px] text-zinc-600 font-bold">— {server.hardware?.uptime || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-zinc-500 hover:text-blue-500 transition-colors">
                  <Settings size={14} />
                </button>
                <button className="text-zinc-500 hover:text-emerald-500 transition-colors">
                  <Activity size={14} />
                </button>
              </div>
            </div>

            {/* Server Body */}
            <div className="p-4 grid grid-cols-3 gap-6">
              {/* Stats Left */}
              <div className="col-span-2 grid grid-cols-2 gap-y-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Conns.</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-black min-w-[30px] text-center">
                      {server.total_clients || 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Utilizadores</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-black min-w-[30px] text-center">
                      {server.total_clients || 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Streams Live</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-black min-w-[30px] text-center">
                      0
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Streams Off</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-black min-w-[30px] text-center">
                      0
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Input</span>
                  <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-black w-fit">
                    0
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Output</span>
                  <div className="bg-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-black w-fit">
                    0
                  </div>
                </div>
              </div>

              {/* Hardware Progress Right */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-zinc-500">{server.hardware?.cpu_usage || 0}% CPU</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${server.hardware?.cpu_usage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-zinc-500">
                      {server.hardware?.total_ram ? Math.round((server.hardware.total_used / server.hardware.total_ram) * 100) : 0}% RAM
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500" 
                      style={{ width: `${server.hardware?.total_ram ? Math.round((server.hardware.total_used / server.hardware.total_ram) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-zinc-500">0% Input</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-900 transition-all duration-500" style={{ width: '0%' }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-zinc-500">0% Output</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
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
