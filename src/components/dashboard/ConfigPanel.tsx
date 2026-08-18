import React, { useState } from "react";
import { Database, Key, Server, Layout, ExternalLink, Terminal, Tag, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getOdinConfig } from "@/lib/odin";
import { useOdinData, useHydrated } from "@/hooks/use-odin";

export function ConfigPanel() {
  const isHydrated = useHydrated();
  const cfg = getOdinConfig();
  const { settings, actions } = useOdinData();
  const [activeTab, setActiveTab] = useState("db");
  const [defaultTemplate, setDefaultTemplate] = useState("");

  React.useEffect(() => {
    if (settings?.default_message_template?.template) {
      setDefaultTemplate(settings.default_message_template.template);
    }
  }, [settings]);

  const handleSaveTemplate = async () => {
    try {
      await actions.saveAppSetting({ 
        data: { 
          key: 'default_message_template', 
          value: { template: defaultTemplate } 
        } 
      });
      toast.success("Template padrão atualizado!");
    } catch (e) {
      toast.error("Erro ao salvar template");
    }
  };

  const origin = isHydrated ? window.location.origin : 'http://localhost:8080';
  const installCmd = `bash <(curl -sSL ${origin}/api/install)`;

  if (!isHydrated) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 p-1 bg-black/40 border border-zinc-800 rounded-xl w-full sm:w-fit">
        {[
          { id: "db", label: "Banco & SSH", icon: Database },
          { id: "api", label: "Instalador API", icon: Key },
          { id: "templates", label: "Templates", icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all min-h-[44px] ${
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
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                <Layout size={24} />
              </div>
              <div>
                <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Estratégia SaaS & aaPanel</h4>
                <p className="text-[10px] text-zinc-500 uppercase font-black">Documentação Especializada</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-zinc-800 rounded-xl">
                <h5 className="text-xs font-bold text-zinc-300 mb-2 uppercase">VISÃO DA ARQUITETURA</h5>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  O Mago Panel utiliza o MariaDB do Odin como "Fonte de Verdade" para espelhamento em tempo real, 
                  enquanto o Supabase gerencia a identidade SaaS e permissões (Dono vs Revendedor).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-zinc-800 rounded-xl">
                  <h5 className="text-xs font-bold text-zinc-300 mb-2 uppercase">PORTA 6328</h5>
                  <p className="text-[11px] text-zinc-500">Porta padrão obrigatória para o painel no aaPanel.</p>
                </div>
                <div className="p-4 bg-black/40 border border-zinc-800 rounded-xl">
                  <h5 className="text-xs font-bold text-zinc-300 mb-2 uppercase">NGINX EXCLUSIVO</h5>
                  <p className="text-[11px] text-zinc-500">Requer arquivo de configuração próprio para evitar conflitos.</p>
                </div>
              </div>

              <a 
                href="/docs/odin/ARQUITETURA_ESPECIALISTA.md" 
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700"
              >
                <ExternalLink size={14} />
                VER DOCUMENTAÇÃO COMPLETA
              </a>
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

      {activeTab === "templates" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Template de Mensagem Padrão</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Configuração Global de Vendas</p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea 
              value={defaultTemplate}
              onChange={(e) => setDefaultTemplate(e.target.value)}
              className="w-full h-80 bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono text-blue-400 focus:border-blue-500 outline-none transition-all"
              placeholder="Digite o template aqui..."
            />
            
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-[10px] text-zinc-500 uppercase font-bold leading-loose">
              <p className="text-blue-500 mb-2">Variáveis Disponíveis:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>{"{username}"}</div>
                <div>{"{password}"}</div>
                <div>{"{package}"}</div>
                <div>{"{plan_price}"}</div>
                <div>{"{expires_at}"}</div>
                <div>{"{connections}"}</div>
                <div>{"{dns}"}</div>
                <div>{"{dns_host}"}</div>
              </div>
            </div>

            <button 
              onClick={handleSaveTemplate}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Save size={14} /> SALVAR TEMPLATE PADRÃO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
