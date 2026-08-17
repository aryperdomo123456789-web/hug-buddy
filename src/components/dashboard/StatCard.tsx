import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "purple" | "pink" | "gray";
  secondaryLabel?: string;
  secondaryValue?: string | number;
}

export function StatCard({ label, value, icon: Icon, color = "blue" }: StatCardProps) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-green-500 bg-green-500/10",
    red: "text-red-500 bg-red-500/10",
    purple: "text-purple-500 bg-purple-500/10",
  };

  return (
    <div className="bg-[#0f0f12] p-4 md:p-6 rounded-2xl border border-zinc-800 shadow-lg hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-100 stat-card-value">{value}</div>
      <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
