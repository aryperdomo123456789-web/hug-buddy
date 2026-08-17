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
      className={`w-full flex items-center px-4 py-4 md:py-3 rounded-xl transition-all duration-200 group min-h-[44px] ${
        label ? 'gap-3' : 'justify-center'
      } ${
        active 
          ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      }`}
      title={!label ? "Navegar" : undefined}
    >
      <Icon size={20} className={active ? "text-blue-500" : "group-hover:text-zinc-300"} />
      {label && <span className="text-sm font-bold uppercase tracking-widest truncate animate-in fade-in duration-300">{label}</span>}
    </button>
  );
}
