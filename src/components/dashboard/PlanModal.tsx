import React, { useState } from "react";
import { Plan } from "@/types/odin";
import { X, Save } from "lucide-react";

interface PlanModalProps {
  plan: Plan | null;
  onClose: () => void;
  onSave: (data: Plan) => Promise<void>;
  loading?: boolean;
}

export function PlanModal({ plan, onClose, onSave, loading }: PlanModalProps) {
  const [data, setData] = useState<Plan>(plan || { 
    id: "",
    name: "", 
    connections: 1, 
    duration: 1, 
    duration_unit: 'months', 
    price: 0, 
    status: 'active', 
    bouquets: [], 
    sort_order: 0, 
    is_trial: false, 
    has_adult_content: false,
    odin_server_id: null,
    odin_package_id: null,
    template: null
  } as Plan);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f12] w-full max-w-2xl rounded-2xl border border-zinc-800 p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-zinc-100 uppercase tracking-tighter">
          {plan ? "Editar Plano" : "Novo Plano"}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Nome do Plano" 
              value={data.name} 
              onChange={e => setData({...data, name: e.target.value})}
              className="col-span-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            />
            <input 
              type="number"
              placeholder="Preço" 
              value={data.price} 
              onChange={e => setData({...data, price: Number(e.target.value)})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            />
            <input 
              type="number"
              placeholder="Conexões" 
              value={data.connections} 
              onChange={e => setData({...data, connections: Number(e.target.value)})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number"
              placeholder="Duração" 
              value={data.duration} 
              onChange={e => setData({...data, duration: Number(e.target.value)})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            />
            <select 
              value={data.duration_unit}
              onChange={e => setData({...data, duration_unit: e.target.value as any})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300"
            >
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
              <option value="days">Dias</option>
              <option value="months">Meses</option>
              <option value="years">Anos</option>
            </select>
          </div>

          <textarea 
            placeholder="Template de Mensagem (Deixe em branco para usar o padrão)"
            value={data.template || ""}
            onChange={e => setData({...data, template: e.target.value || null})}
            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300"
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2 text-zinc-500 hover:text-zinc-300 transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave(data)} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Save size={16} />} 
            Salvar Plano
          </button>
        </div>
      </div>
    </div>
  );
}