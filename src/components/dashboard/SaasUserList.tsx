import React from "react";
import { Users, UserPlus, Shield, UserCheck, Search, Mail } from "lucide-react";

export function SaasUserList() {
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div className="space-y-6">
      <div className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/30">
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm">
              <UserPlus size={18} /> Novo Usuário Painel
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              placeholder="Pesquisar usuários SaaS..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-300 w-64 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-12 text-center">
          <Shield className="mx-auto mb-4 text-zinc-700" size={48} />
          <h3 className="text-lg font-bold text-zinc-300">Nenhum Usuário Vinculado</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-2">
            Comece criando usuários Administrativos ou Revendedores para que eles possam acessar o Mago Panel de forma independente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Papel: Admin</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Poder Total</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Usuários com este nível de acesso podem ver todos os servidores, revendedores e clientes do Odin, além de gerenciar outros usuários do painel.
          </p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <UserCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Papel: Revendedor</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Escopo Restrito</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Revendedores só visualizam os clientes vinculados ao seu ID do Odin e possuem créditos limitados conforme definido no sistema central.
          </p>
        </div>
      </div>
    </div>
  );
}
