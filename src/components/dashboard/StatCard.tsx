import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "purple" | "pink" | "gray";
  secondaryLabel?: string;
  secondaryValue?: string | number;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = "blue",
  secondaryLabel,
  secondaryValue
}: StatCardProps) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    gray: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  };

  return (
    <div className="bg-[#0f0f12] p-4 rounded-xl border border-zinc-800 shadow-xl relative overflow-hidden group min-h-[100px] flex flex-col justify-center">
      <div className="flex items-center justify-between gap-4">
        <div className={`p-2.5 rounded-lg border ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} />
        </div>
        
        <div className="text-right flex-1">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-zinc-100 tracking-tighter leading-none">{value}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">{label}</span>
          </div>
          
          {secondaryLabel && (
            <div className="mt-2 pt-2 border-t border-zinc-800/50 flex flex-col">
              <span className="text-xl font-black text-zinc-300 tracking-tighter leading-none">{secondaryValue}</span>
              <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">{secondaryLabel}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-2 -left-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon size={80} />
      </div>
    </div>
  );
}
