import React from "react";
import { User, UserSchema } from "@/types/odin";
import { X, Save, Info, Shield, Lock, Layout } from "lucide-react";

interface UserModalProps {
  user: User | null;
  bouquets: any[];
  resellers: any[];
  onClose: () => void;
  onSave: (data: User) => Promise<void>;
  loading?: boolean;
}

export function UserModal({ user, bouquets, resellers, onClose, onSave, loading }: UserModalProps) {
  const [activeTab, setActiveTab] = React.useState<'details' | 'advanced' | 'restrictions' | 'bouquets'>('details');
  const [formData, setFormData] = React.useState<User>(() => {
    if (user) {
      const now = typeof window !== 'undefined' ? Date.now() / 1000 : 0;
      const exp_days = user.exp_date ? Math.max(0, Math.ceil((user.exp_date - now) / 86400)) : 30;
      return { ...user, exp_days };
    }
    return UserSchema.parse({});
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    onSave(formData);
  };

  const updateField = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
        activeTab === id ? "border-blue-500 text-blue-500 bg-blue-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f12] w-full max-w-4xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[95vh] md:h-auto md:max-h-[90vh]">
        <div className="p-4 md:p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tighter text-zinc-100">
              {user ? `Editar: ${user.username}` : "Novo Utilizador"}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Configuração de conta Odin v6
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex bg-zinc-950/30 border-b border-zinc-900">
          <TabButton id="details" label="Detalhes" icon={Info} />
          <TabButton id="advanced" label="Avançado" icon={Shield} />
          <TabButton id="restrictions" label="Restrições" icon={Lock} />
          <TabButton id="bouquets" label="Bouquets" icon={Layout} />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6">
                <Field label="Nome de Utilizador">
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => updateField('username', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </Field>
                <Field label="Senha">
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => updateField('password', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </Field>
                <Field label="Validade (Dias)">
                  <input
                    type="number"
                    value={formData.exp_days}
                    onChange={e => updateField('exp_days', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </Field>
                <Field label="Dono / Revendedor">
                  <select
                    value={formData.owner_id}
                    onChange={e => updateField('owner_id', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                  >
                    {resellers.map(r => (
                      <option key={r.id} value={r.id}>{r.username}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="space-y-6">
                <Field label="Máximo de Conexões">
                  <input
                    type="number"
                    value={formData.max_connections}
                    onChange={e => updateField('max_connections', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </Field>
                <div className="flex gap-4 pt-4">
                  <Checkbox
                    label="Ativo"
                    checked={formData.enabled === 1}
                    onChange={checked => updateField('enabled', checked ? 1 : 0)}
                  />
                  <Checkbox
                    label="Teste"
                    checked={formData.is_trial === 1}
                    onChange={checked => updateField('is_trial', checked ? 1 : 0)}
                  />
                </div>
                <Field label="Notas Administrativas">
                  <textarea
                    value={formData.admin_notes}
                    onChange={e => updateField('admin_notes', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[100px] outline-none"
                  />
                </Field>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6">
                <Checkbox
                  label="Restreamer"
                  checked={formData.is_restreamer === 1}
                  onChange={checked => updateField('is_restreamer', checked ? 1 : 0)}
                />
                <Field label="Forçar País">
                  <select
                    value={formData.forced_country}
                    onChange={e => updateField('forced_country', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="Off">Desativado</option>
                    <option value="BR">Brasil</option>
                    <option value="PT">Portugal</option>
                    <option value="US">USA</option>
                  </select>
                </Field>
              </div>
              <div className="space-y-6">
                <Checkbox
                  label="ISP Lock"
                  checked={formData.is_isplock === 1}
                  onChange={checked => updateField('is_isplock', checked ? 1 : 0)}
                />
              </div>
            </div>
          )}

          {activeTab === 'restrictions' && (
            <div className="space-y-6">
              <Field label="IPs Permitidos (um por linha)">
                <textarea
                  value={formData.allowed_ips}
                  onChange={e => updateField('allowed_ips', e.target.value)}
                  placeholder="Ex: 192.168.1.1"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[120px] outline-none font-mono"
                />
              </Field>
              <Field label="User Agents Permitidos">
                <textarea
                  value={formData.allowed_ua}
                  onChange={e => updateField('allowed_ua', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[120px] outline-none font-mono"
                />
              </Field>
            </div>
          )}

          {activeTab === 'bouquets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bouquets.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-900">
                  <input
                    type="checkbox"
                    checked={(() => {
                      try {
                        const current = JSON.parse(formData.bouquet || "[]");
                        return current.includes(Number(b.id));
                      } catch(e) { return false; }
                    })()}
                    onChange={(e) => {
                      let current = [];
                      try { current = JSON.parse(formData.bouquet || "[]"); } catch(e) {}
                      if (e.target.checked) {
                        current.push(Number(b.id));
                      } else {
                        current = current.filter((id: number) => id !== Number(b.id));
                      }
                      updateField('bouquet', JSON.stringify(current));
                    }}
                    className="w-4 h-4 rounded border-zinc-800 text-blue-600 focus:ring-blue-600 bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-300">{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="p-4 md:p-6 border-t border-zinc-900 bg-zinc-950/50 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="order-2 sm:order-1 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`order-1 sm:order-2 ${loading ? 'bg-zinc-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest min-h-[44px]`}
          >
            {loading ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 animate-spin rounded-full" /> : <Save size={16} />} 
            {loading ? "Processando..." : (user ? "Salvar Alterações" : "Criar Utilizador")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div 
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
          checked ? "bg-blue-600 border-blue-600" : "bg-zinc-900 border-zinc-800 group-hover:border-zinc-700"
        }`}
      >
        {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
        {label}
      </span>
    </label>
  );
}
