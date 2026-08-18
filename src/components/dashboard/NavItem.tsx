import { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  compact?: boolean;
  onClick: () => void;
}

export function NavItem({ icon: Icon, label, active, compact = false, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      title={compact ? label : undefined}
      aria-label={label}
      className={`w-full flex items-center ${compact ? "justify-center px-3" : "gap-3 px-4"} py-3 rounded-xl transition-all duration-200 group min-h-[44px] ${
        active
          ? "bg-blue-600/10 text-blue-500 border border-blue-600/20 shadow-[0_0_0_1px_rgba(37,99,235,0.08)]"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/70"
      }`}
    >
      <Icon size={20} className={active ? "text-blue-500" : "group-hover:text-zinc-300"} />
      {!compact && <span className="text-sm font-bold uppercase tracking-widest">{label}</span>}
    </button>
  );
}
