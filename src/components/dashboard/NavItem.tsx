import { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      }`}
    >
      <Icon size={20} className={active ? "text-blue-500" : "group-hover:text-zinc-300"} />
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
