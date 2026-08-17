import React, { useState } from "react";
import { Database, Shield, Terminal, Key, Server } from "lucide-react";
import { toast } from "sonner";
import { getOdinConfig } from "@/lib/odin";

export function ConfigPanel() {
  const cfg = getOdinConfig();
  const [activeTab, setActiveTab] = useState("db");

  // Usamos localhost como default seguro para SSR
  const [origin, setOrigin] = useState('http://localhost:8080');
  
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installCmd = `bash <(curl -sSL ${origin}/api/install)`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex gap-2 p-1 bg-black/40 border border-zinc-800 rounded-xl w-fit">
        {[
          { id: "db", label: "Banco & SSH", icon: Database },
          { id: "api", label: "Instalador API", icon: Key },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "db" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2">
              <Server size={16} /> Conexão SSH
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Host / IP</label>
                <input disabled value={cfg.sshHost} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Usuário</label>
                <input disabled value={cfg.sshUsername} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2">
              <Database size={16} /> MariaDB (Odin)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Porta SQL</label>
                <input disabled value={cfg.dbPort} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Nome do Banco</label>
                <input disabled value={cfg.dbName} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Shield className="text-blue-500 shrink-0" size={20} />
            <p className="text-xs text-zinc-400 leading-relaxed">
              As credenciais estão atualmente configuradas via variáveis de ambiente no laboratório. 
              Para alterá-las permanentemente, edite o arquivo <code className="text-blue-400">src/lib/odin.ts</code>.
            </p>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-center">
          <Terminal className="mx-auto mb-6 text-blue-500" size={48} />
          <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">Instalador Mago API</h2>
          <p className="text-zinc-400 mb-8 text-sm max-w-md mx-auto">
            Este comando gera o diretório necessário e injeta o <span className="text-blue-500 font-bold">Token de Segurança</span> no seu servidor Odin via terminal.
          </p>
          
          <div 
            className="bg-black p-4 rounded-xl font-mono text-xs text-blue-400 border border-zinc-800 break-all mb-6 select-all cursor-pointer group relative"
            onClick={() => {
              navigator.clipboard.writeText(installCmd);
              toast.success("Comando de instalação copiado!");
            }}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-400">
              CLIQUE PARA COPIAR
            </div>
            {installCmd}
          </div>

          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
            <Key size={12} /> Token Ativo: {cfg.apiToken.substring(0, 10)}...
          </div>
        </div>
      )}
    </div>
  );
}
