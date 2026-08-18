import React, { useState } from "react";
import { UserPlus, Shield, UserCheck, Search, Trash2, Key, X, Save, Settings, User } from "lucide-react";
import { getSaasProfiles, changePassword } from "@/lib/saas.functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Reseller } from "@/types/odin";
import { supabase } from "@/integrations/supabase/client";

export function SaasUserList({ resellers = [] }: { resellers?: Reseller[] }) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["saas-profiles"],
    queryFn: () => getSaasProfiles(),
  });

  const passMutation = useMutation({
    mutationFn: (password: string) => changePassword({ data: { password } }),
    onSuccess: () => {
      setIsChangingPassword(false);
      setNewPassword("");
      toast.success("Senha alterada com sucesso");
    },
    onError: (err: any) => toast.error("Erro ao alterar senha: " + err.message),
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    passMutation.mutate(newPassword);
  };

  const filteredProfiles = profiles?.filter(
    (p: any) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
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
              type="button"
            >
              ALTERAR MINHA SENHA
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsChangingPassword(false)}
                className="p-2 text-zinc-500 hover:text-zinc-300"
                type="button"
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
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-4 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={passMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
            >
              {passMutation.isPending ? "SALVANDO..." : (
                <>
                  <Save size={16} /> SALVAR SENHA
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/30">
          <div className="flex gap-4">
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm opacity-50 cursor-not-allowed"
              type="button"
            >
              <UserPlus size={18} /> Novo Usuário Painel
            </button>
            <span className="text-[10px] text-zinc-600 flex items-center font-bold italic">
              (Criação via dashboard Supabase recomendada)
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              placeholder="Pesquisar usuários SaaS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-500">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredProfiles?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : filteredProfiles?.map((profile: any) => (
                <tr key={profile.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          profile.role === "admin" ? "bg-blue-500/20 text-blue-500" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {profile.full_name?.charAt(0) || profile.role?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{profile.full_name || "Sem Nome"}</div>
                        <div className="text-[10px] text-zinc-500">{profile.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                        profile.role === "admin"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}
                    >
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-zinc-300 font-mono">
                        {profile.odin_reseller_id ? `#${profile.odin_reseller_id}` : "Global (Admin)"}
                      </div>
                      {profile.permissions && (
                        <div className="flex gap-2">
                           {profile.permissions.can_create_customers && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 rounded border border-blue-500/20">CLIENTES</span>}
                           {profile.permissions.can_create_resellers && <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1 rounded border border-purple-500/20">REVENDAS</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingProfile(profile)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 transition-all"
                        type="button"
                      >
                        <Settings size={16} />
                      </button>
                      {profile.role !== "admin" && (
                        <button
                          className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-lg border border-zinc-700 transition-all"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Permissões SaaS */}
      {editingProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingProfile(null)} />
          <div className="relative w-full max-w-lg bg-[#0f0f12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-100">Permissões SaaS</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vincular Usuário ao Odin</p>
              </div>
              <button onClick={() => setEditingProfile(null)} className="p-2 text-zinc-500 hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <User size={24} />
                </div>
                <div>
                  <div className="font-bold text-zinc-200">{editingProfile.full_name || "Sem Nome"}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{editingProfile.role}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Vínculo Revenda Odin</label>
                  <select
                    value={editingProfile.odin_reseller_id || ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setEditingProfile({ ...editingProfile, odin_reseller_id: val });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Acesso Global (Admin)</option>
                    {resellers.map((r) => (
                      <option key={r.id} value={r.id}>{r.username} (ID: #{r.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Autorizações Específicas</div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={editingProfile.permissions?.can_create_customers !== false}
                      onChange={(e) => {
                        const permissions = { ...(editingProfile.permissions || {}), can_create_customers: e.target.checked };
                        setEditingProfile({ ...editingProfile, permissions });
                      }}
                      className="w-5 h-5 rounded border-zinc-800 text-blue-600 bg-zinc-900"
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">Permitir Criar Clientes</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={editingProfile.permissions?.can_create_resellers === true}
                      onChange={(e) => {
                        const permissions = { ...(editingProfile.permissions || {}), can_create_resellers: e.target.checked };
                        setEditingProfile({ ...editingProfile, permissions });
                      }}
                      className="w-5 h-5 rounded border-zinc-800 text-blue-600 bg-zinc-900"
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">Permitir Criar Sub-Revendas</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-900 bg-zinc-950/50 flex justify-end gap-4">
               <button
                onClick={() => setEditingProfile(null)}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const updateData: any = {
                      odin_reseller_id: editingProfile.odin_reseller_id,
                      permissions: editingProfile.permissions
                    };

                    const { error } = await supabase
                      .from('profiles')
                      .update(updateData)
                      .eq('id', editingProfile.id);
                    
                    if (error) throw error;
                    
                    toast.success("Permissões atualizadas!");
                    queryClient.invalidateQueries({ queryKey: ["saas-profiles"] });
                    setEditingProfile(null);
                  } catch (e: any) {
                    toast.error("Erro ao salvar: " + e.message);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                <Save size={16} /> Salvar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
    </div>
  );
}
