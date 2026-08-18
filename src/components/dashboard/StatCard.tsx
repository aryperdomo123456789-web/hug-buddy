import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "purple" | "pink" | "gray";
  secondaryLabel?: string;
}

export function StatCard({ label, value, icon: Icon, color = "blue", secondaryLabel }: StatCardProps) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
    red: "text-rose-500 bg-rose-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    pink: "text-pink-500 bg-pink-500/10",
    gray: "text-zinc-400 bg-zinc-800/50",
  };

  return (
    <div className="relative overflow-hidden bg-[#0f0f12] p-5 md:p-6 rounded-[24px] border border-zinc-800/50 shadow-xl hover:border-blue-500/30 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">{label}</div>
          <div className="flex items-end gap-3">
            <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <div className="text-right">
              <div className="text-4xl md:text-5xl font-light tracking-tighter text-zinc-100 leading-none">{value}</div>
              {secondaryLabel && (
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2">{secondaryLabel}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
