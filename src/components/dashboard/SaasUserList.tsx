import React, { useState } from "react";
import { Users, UserPlus, Shield, UserCheck, Search, Mail, Trash2, Key, Edit, X, Save } from "lucide-react";
import { getSaasProfiles, updateSaasProfile, changePassword } from "@/lib/saas.functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function SaasUserList() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'reseller' as 'admin' | 'reseller', odin_reseller_id: '' });
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['saas-profiles'],
    queryFn: () => getSaasProfiles()
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSaasProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-profiles'] });
      toast.success("Perfil atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar perfil")
  });

  const passMutation = useMutation({
    mutationFn: (password: string) => changePassword({ data: { password } }),
    onSuccess: () => {
      setIsChangingPassword(false);
      setNewPassword("");
      toast.success("Senha alterada com sucesso");
    },
    onError: (err: any) => toast.error("Erro ao alterar senha: " + err.message)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const { createSaasUser } = require("@/lib/saas.functions");
      return createSaasUser({ data });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['saas-profiles'] });
      setIsAddingUser(false);
      setNewUser({ email: '', full_name: '', role: 'reseller', odin_reseller_id: '' });
      toast.success(res.message || "Usuário criado!");
    },
    onError: (err: any) => toast.error("Erro ao criar usuário: " + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const { deleteSaasUser } = require("@/lib/saas.functions");
      return deleteSaasUser({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-profiles'] });
      toast.success("Usuário removido");
    },
    onError: (err: any) => toast.error("Erro ao remover: " + err.message)
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) return;
    createMutation.mutate({
      ...newUser,
      odin_reseller_id: newUser.odin_reseller_id ? Number(newUser.odin_reseller_id) : undefined
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o acesso de ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    passMutation.mutate(newPassword);
  };

  const filteredProfiles = profiles?.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Seção de Perfil Próprio / Senha */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Key size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Minha Segurança</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Gerenciar Acesso</p>
            </div>
          </div>
          {!isChangingPassword ? (
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-bold transition-all border border-zinc-700"
            >
              ALTERAR MINHA SENHA
            </button>
          ) : (
            <div className="flex gap-2">
               <button 
                onClick={() => setIsChangingPassword(false)}
                className="p-2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {isChangingPassword && (
          <form onSubmit={handlePasswordChange} className="flex gap-4 animate-in slide-in-from-top-2 duration-300">
            <input 
              type="password"
              placeholder="Nova senha (min 6 caracteres)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-4 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button 
              type="submit"
              disabled={passMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
            >
              {passMutation.isPending ? "SALVANDO..." : <><Save size={16} /> SALVAR SENHA</>}
            </button>
          </form>
        )}
      </div>

      <div className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/30">
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAddingUser(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
            >
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                <th className="px-6 py-4">Usuário / Email</th>
                <th className="px-6 py-4">Papel</th>
                <th className="px-6 py-4">Revenda Odin</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {isLoading ? (
                <tr><td colSpan={4} className="p-12 text-center text-zinc-500">Carregando usuários...</td></tr>
              ) : filteredProfiles?.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-zinc-500">Nenhum usuário encontrado.</td></tr>
              ) : filteredProfiles?.map(profile => (
                <tr key={profile.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${profile.role === 'admin' ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        {profile.full_name?.charAt(0) || profile.role?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{profile.full_name || "Sem Nome"}</div>
                        <div className="text-[10px] text-zinc-500">{profile.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                      profile.role === 'admin' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-400 font-mono">
                      {profile.odin_reseller_id ? `#${profile.odin_reseller_id}` : "Global (Admin)"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {profile.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(profile.id, profile.full_name || profile.role)}
                          className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-lg border border-zinc-700 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {profile.role === 'admin' && (
                        <span className="text-[9px] text-zinc-600 font-bold uppercase py-2">IMUTÁVEL</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Papel: Admin (Dono)</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Poder Total</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Usuários Administrativos vêem todos os dados do Odin. O usuário Dono (mago@dono.com) nunca pode ser excluído.
          </p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <UserCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Papel: Revendedor Comum</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Escopo Restrito</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Estes usuários são vinculados a um ID de revendedor do Odin. Eles só enxergam os clientes criados por aquela revenda específica.
          </p>
        </div>
      </div>

      {isAddingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold uppercase tracking-tighter text-white">Novo Usuário SaaS</h3>
              <button onClick={() => setIsAddingUser(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  value={newUser.full_name}
                  onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">E-mail de Acesso</label>
                <input 
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Papel no Painel</label>
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="reseller">Revendedor (Restrito)</option>
                  <option value="admin">Administrador (Dono)</option>
                </select>
              </div>

              {newUser.role === 'reseller' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Revendedor Odin (XTREAM)</label>
                  <input 
                    type="number"
                    required={newUser.role === 'reseller'}
                    value={newUser.odin_reseller_id}
                    onChange={e => setNewUser(prev => ({ ...prev, odin_reseller_id: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: 5"
                  />
                  <p className="text-[9px] text-zinc-600 font-bold italic uppercase">Vínculo obrigatório para restringir visualização de clientes.</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {createMutation.isPending ? "PROCESSANDO..." : "CRIAR ACESSO AGORA"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
