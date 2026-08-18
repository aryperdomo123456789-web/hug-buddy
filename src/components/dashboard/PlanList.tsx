import React from "react";
import { Plan } from "@/types/odin";
import { Plus, Edit2, Trash2, Copy, Tag, Clock, Database } from "lucide-react";
import { toast } from "sonner";

interface PlanListProps {
  plans: Plan[];
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onQuickTest?: (plan: Plan) => void;
}

export function PlanList({ plans, loading, onRefresh, onAdd, onEdit, onDelete, onQuickTest }: PlanListProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tighter text-zinc-100 flex items-center gap-2">
            <Tag className="text-blue-500" size={24} /> Gestão de Planos
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Configure pacotes e atalhos de venda
          </p>
        </div>
        <button 
          onClick={onAdd}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
            {plan.is_trial && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                Teste
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                  {plan.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-blue-500">
                  <span className="text-2xl font-black">R$ {Number(plan.price).toFixed(2)}</span>
                </div>
              </div>
              {plan.is_trial && onQuickTest && (
                <button
                  onClick={() => onQuickTest(plan)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                >
                  Gerar Teste
                </button>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-zinc-400">
                <Clock size={16} className="text-zinc-600" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {plan.duration} {
                    plan.duration_unit === 'months' ? 'Mês(es)' :
                    plan.duration_unit === 'days' ? 'Dia(s)' :
                    plan.duration_unit === 'hours' ? 'Hora(s)' :
                    plan.duration_unit === 'minutes' ? 'Minuto(s)' : 'Ano(s)'
                  }
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Database size={16} className="text-zinc-600" />
                <span className="text-xs font-bold uppercase tracking-widest">{plan.connections} Conexão(ões)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onEdit(plan)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(plan.template || "");
                  toast.success("Template copiado!");
                }}
                className="bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-500 p-3 rounded-xl transition-all"
                title="Copiar Template"
              >
                <Copy size={14} />
              </button>
              <button 
                onClick={() => onDelete(plan)}
                className="bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-500 p-3 rounded-xl transition-all"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
            <Tag className="mx-auto mb-4 text-zinc-700" size={48} />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nenhum plano configurado</p>
          </div>
        )}
      </div>
    </div>
  );
}
