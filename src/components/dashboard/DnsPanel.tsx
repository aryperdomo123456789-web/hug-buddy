import React, { useState, useEffect } from "react";
import { Globe, Plus, Trash2, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getDnsConfigs, createDnsConfig, updateDnsConfig, deleteDnsConfig } from "@/lib/dns.functions";

export function DnsPanel() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHost, setNewHost] = useState("");

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getDnsConfigs();
      setConfigs(data || []);
    } catch (e) {
      toast.error("Erro ao carregar DNS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newHost) return;
    
    try {
      await createDnsConfig({ data: { 
        name: newName, 
        host: newHost.replace(/^https?:\/\//, '').replace(/:.*$/, ''), 
        is_default: configs.length === 0 
      } });
      toast.success("DNS adicionado");
      setNewName("");
      setNewHost("");
      setIsAdding(false);
      loadConfigs();
    } catch (e) {
      toast.error("Erro ao salvar DNS");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateDnsConfig({ data: { id, is_default: true } });
      toast.success("DNS padrão alterado");
      loadConfigs();
    } catch (e) {
      toast.error("Erro ao alterar padrão");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este DNS?")) return;
    try {
      await deleteDnsConfig({ data: { id } });
      toast.success("DNS removido");
      loadConfigs();
    } catch (e) {
      toast.error("Erro ao remover DNS");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2 text-blue-500">
          <Globe size={24} /> GERENCIAR DNS PROFISSIONAL
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={loadConfigs}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 border border-zinc-800"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2"
          >
            <Plus size={16} /> ADICIONAR DNS
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">NOME IDENTIFICADOR</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Minha Fonte VIP"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-200 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">DOMÍNIO / DNS (SEM HTTP)</label>
              <input 
                type="text" 
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                placeholder="suafonte.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-300"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase"
            >
              SALVAR DNS
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configs.map((config) => (
          <div 
            key={config.id} 
            className={`bg-zinc-950/50 p-6 rounded-2xl border transition-all duration-300 ${config.is_default ? 'border-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'border-zinc-900 hover:border-zinc-800'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.is_default ? 'bg-blue-600/20 text-blue-500' : 'bg-zinc-900 text-zinc-600'}`}>
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-200">{config.name}</h3>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{config.host}</p>
                </div>
              </div>
              {config.is_default && (
                <div className="text-blue-500" title="DNS Padrão Ativo">
                  <ShieldCheck size={20} />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              {!config.is_default && (
                <button 
                  onClick={() => handleSetDefault(config.id)}
                  className="flex-1 bg-zinc-900 hover:bg-blue-600/20 hover:text-blue-500 text-zinc-500 py-2 rounded-xl text-[9px] font-black uppercase border border-zinc-800 transition-all"
                >
                  Definir Padrão
                </button>
              )}
              <button 
                onClick={() => handleDelete(config.id)}
                className="p-2 bg-zinc-900 hover:bg-red-600/20 text-zinc-500 hover:text-red-500 rounded-xl border border-zinc-800 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && !loading && (
        <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
          <Globe size={48} className="mx-auto text-zinc-800 mb-4" />
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum DNS cadastrado</p>
        </div>
      )}
    </div>
  );
}
