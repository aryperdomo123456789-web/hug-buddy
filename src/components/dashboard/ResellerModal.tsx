import React from "react";
import { Reseller } from "@/types/odin";
import { X, Save } from "lucide-react";

interface ResellerModalProps {
  reseller: Reseller | null;
  onClose: () => void;
  onSave: (data: Reseller) => Promise<void>;
  loading?: boolean;
}

export function ResellerModal({ reseller, onClose, onSave, loading }: ResellerModalProps) {
  const [data, setData] = React.useState<Reseller>(reseller || { 
    username: "", password: "", email: "", credits: 0, active: 1, member_group_id: 2 
  } as Reseller);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f12] w-full max-w-lg rounded-2xl border border-zinc-800 p-8">
        <h2 className="text-xl font-bold mb-6 text-zinc-100">{reseller ? "Editar Revenda" : "Nova Revenda"}</h2>
        <div className="space-y-4">
          <input 
            placeholder="Username" 
            value={data.username} 
            onChange={e => setData({...data, username: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
          />
          <input 
            placeholder="Senha" 
            type="password"
            value={data.password} 
            onChange={e => setData({...data, password: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
          />
          <input 
            placeholder="Email" 
            value={data.email} 
            onChange={e => setData({...data, email: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
          />
          <div className="flex gap-4">
            <input 
              type="number"
              placeholder="Créditos" 
              value={data.credits} 
              onChange={e => setData({...data, credits: Number(e.target.value)})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2 text-zinc-500 hover:text-zinc-300">Cancelar</button>
          <button onClick={() => onSave(data)} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
