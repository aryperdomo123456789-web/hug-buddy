import {
  Activity,
  Download,
  EyeOff,
  LayoutDashboard,
  RefreshCw,
  Server as ServerIcon,
  Upload,
  Users,
  Pencil,
} from "lucide-react";

import type { DashboardStats, Profile, Server } from "@/types/odin";
import type { LucideIcon } from "lucide-react";

interface OdinDashboardProps {
  profile: Profile | null;
  stats: DashboardStats;
  servers: Server[];
  loading: boolean;
  lastSyncLabel: string;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatValue(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function pickMetric(source: Record<string, unknown> | null | undefined, keys: string[], fallback = 0): number {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    const parsed = toFiniteNumber(value);
    if (parsed !== 0 || value === 0 || value === "0" || value === "0.0") {
      return parsed;
    }
  }
  return fallback;
}

function formatMbps(value: number): string {
  const normalized = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(normalized)} Mbps`;
}

function formatNetworkSpeed(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value >= 1000 ? `${value / 1000} Gbit/s` : `${value} Mbit/s`;
  }
  if (typeof value === "string" && value.trim()) {
    return value.replace(/\s+/g, " ").trim();
  }
  return "N/A";
}

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatUptime(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return `${Math.round(value)}s`;
  return "N/A";
}

function getServerMetrics(server: Server) {
  const hardware = (server.hardware && typeof server.hardware === "object" ? server.hardware : {}) as Record<string, unknown>;
  const connections = server.live_connections ?? pickMetric(hardware, ["conns", "connections", "current_connections", "active_connections", "users"], 0);
  const users = server.live_users ?? pickMetric(hardware, ["users", "utilizadores", "online_users", "current_users"], 0);
  const streamsLive = server.live_streams ?? pickMetric(hardware, ["streams_live", "live_streams", "streamsOnline", "streams_online"], 0);
  const streamsOff = server.offline_streams ?? pickMetric(hardware, ["streams_off", "offline_streams", "streamsOffline", "streams_offline"], 0);
  const input = server.input_mbps ?? pickMetric(hardware, ["input_mbps", "input", "total_input", "bandwidth_in", "rx"], 0);
  const output = server.output_mbps ?? pickMetric(hardware, ["output_mbps", "output", "total_output", "bandwidth_out", "tx"], 0);
  const cpu = pickMetric(hardware, ["cpu_usage", "cpu_percent", "cpu"], 0);
  const ram = pickMetric(hardware, ["ram_usage", "ram_percent", "memory_usage"], 0);
  const network = formatNetworkSpeed(server.network_speed ?? hardware.network_speed ?? hardware.net_speed ?? hardware.network ?? hardware.speed);
  const uptime = formatUptime(hardware.uptime ?? hardware.last_check ?? server.last_check);

  return {
    connections,
    users,
    streamsLive,
    streamsOff,
    input,
    output,
    cpu,
    ram,
    network,
    uptime,
  };
}

function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "orange" | "blue";
}) {
  const fill =
    color === "green"
      ? "bg-emerald-500"
      : color === "orange"
        ? "bg-amber-500"
        : "bg-blue-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
        <span>{label}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  sublabel,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden border border-zinc-800 bg-[#0f1014] p-4 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-white/5 text-zinc-200">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="truncate text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</div>
            {sublabel ? <div className="truncate text-[8px] font-medium text-zinc-400">{sublabel}</div> : null}
          </div>
        </div>
        <div className="text-right leading-none">
          <div className="text-[18px] font-semibold tracking-tight text-zinc-100 md:text-[20px]">{value}</div>
        </div>
      </div>
    </div>
  );
}

function TrafficSummaryCard({ input, output }: { input: number; output: number }) {
  return (
    <div className="relative aspect-square overflow-hidden border border-zinc-800 bg-[#0f1014] p-4 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 flex-col items-center justify-center gap-1 border border-zinc-800 bg-white/5 text-zinc-200">
            <Download size={15} />
            <Upload size={15} />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="truncate text-[8px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Total Input</div>
            <div className="truncate text-[15px] font-semibold tracking-tight text-zinc-100 md:text-[18px]">{formatMbps(input)}</div>
          </div>
        </div>
        <div className="text-right leading-none">
          <div className="truncate text-[8px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Total Output</div>
          <div className="truncate text-[15px] font-semibold tracking-tight text-zinc-100 md:text-[18px]">{formatMbps(output)}</div>
        </div>
      </div>
    </div>
  );
}

function StreamSummaryCard({ online, offline }: { online: number; offline: number }) {
  return (
    <div className="relative aspect-square overflow-hidden border border-zinc-800 bg-[#0f1014] p-4 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-white/5 text-zinc-200">
            <EyeOff size={18} />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="truncate text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Streams</div>
            <div className="truncate text-[8px] font-medium text-zinc-400">Tempo real do Odin</div>
          </div>
        </div>

        <div className="space-y-2 text-right leading-none">
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Streams Online</div>
            <div className="text-[18px] font-semibold tracking-tight text-zinc-100 md:text-[20px]">{formatValue(online)}</div>
          </div>
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Streams Offline</div>
            <div className="text-[18px] font-semibold tracking-tight text-zinc-100 md:text-[20px]">{formatValue(offline)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerMirrorCard({ server }: { server: Server }) {
  const metrics = getServerMetrics(server);
  const online = Number(server.status) === 1;

  return (
    <section className="overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <header className="flex items-center justify-between gap-3 bg-zinc-900 px-3 py-2 text-white">
        <div className="min-w-0 truncate text-[12px] font-semibold tracking-wide">
          <span className="inline-flex items-center gap-1">
            <ServerIcon size={13} />
            {server.name}
          </span>
          <span className="ml-1 font-normal text-white/65">- {server.id}</span>
          <span className="ml-1 font-normal text-white/65">- {metrics.uptime}</span>
        </div>
        <div className="flex items-center gap-2 text-white/95">
          <button type="button" className="rounded p-1 hover:bg-white/10" aria-label={`Editar ${server.name}`}>
            <Pencil size={12} />
          </button>
          <button type="button" className="rounded p-1 hover:bg-white/10" aria-label={`Estatísticas ${server.name}`}>
            <Activity size={12} />
          </button>
        </div>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_1.2fr]">
        <div className="space-y-4 text-[12px] text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <span>Conns.</span>
            <span className="min-w-[40px] rounded bg-zinc-700 px-2 py-1 text-center font-semibold text-white">
              {Math.round(metrics.connections)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Streams Live</span>
            <span className="min-w-[40px] rounded bg-zinc-700 px-2 py-1 text-center font-semibold text-white">
              {Math.round(metrics.streamsLive)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Input</span>
            <span className="min-w-[40px] rounded-none bg-cyan-500 px-3 py-1 text-center font-semibold text-white">
              {Math.round(metrics.input || 0)}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-[12px] text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <span>Utilizadores</span>
            <span className="min-w-[40px] rounded bg-zinc-700 px-2 py-1 text-center font-semibold text-white">
              {Math.round(metrics.users)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Streams Off</span>
            <span className="min-w-[40px] rounded bg-zinc-700 px-2 py-1 text-center font-semibold text-white">
              {Math.round(metrics.streamsOff)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Output</span>
            <span className="min-w-[40px] rounded-none bg-cyan-500 px-3 py-1 text-center font-semibold text-white">
              {Math.round(metrics.output || 0)}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-[11px] text-zinc-400">
          <MetricBar label="Cpu" value={metrics.cpu} color="green" />
          <MetricBar label="Ram" value={metrics.ram} color="orange" />
          <MetricBar label="Input" value={metrics.input} color="blue" />
          <MetricBar label="Output" value={metrics.output} color="blue" />
          <div className="flex items-center justify-between pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            <span className={`rounded-none px-2 py-1 ${online ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}`}>
              {online ? "Online" : "Offline"}
            </span>
            <span>{metrics.network}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OdinDashboard({
  profile,
  stats,
  servers,
  loading,
  lastSyncLabel,
  onRefresh,
  onNavigate,
}: OdinDashboardProps) {
  const totalInput = servers.reduce((acc, server) => acc + getServerMetrics(server).input, 0);
  const totalOutput = servers.reduce((acc, server) => acc + getServerMetrics(server).output, 0);
  const offlineStreams = Math.max(0, stats.totalStreams - stats.activeStreams);

  return (
    <div className="space-y-6 bg-transparent p-0 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[34px] font-bold uppercase tracking-tight text-zinc-100">Dashboard</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-60"
          type="button"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Users} title="Utilizadores Online" value={String(stats.onlineUsers)} />
          <SummaryCard icon={LayoutDashboard} title="Conexões Abertas" value={String(stats.openConnections ?? stats.totalClients)} />
          <TrafficSummaryCard input={totalInput} output={totalOutput} />
          <StreamSummaryCard online={stats.activeStreams} offline={offlineStreams} />
        </div>

        <div className="grid gap-4">
          <div className="border border-zinc-800 bg-zinc-950/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Última sincronização</div>
                <div className="mt-2 text-xl font-semibold text-zinc-100">{lastSyncLabel}</div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${loading ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              <div className="border border-zinc-800 bg-zinc-900/60 px-3 py-3">Online: {stats.onlineUsers}</div>
              <div className="border border-zinc-800 bg-zinc-900/60 px-3 py-3">Clientes: {stats.totalUsers}</div>
              <div className="border border-zinc-800 bg-zinc-900/60 px-3 py-3">Streams: {stats.activeStreams}/{stats.totalStreams}</div>
              <div className="border border-zinc-800 bg-zinc-900/60 px-3 py-3">Revendas: {stats.totalResellers}</div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {servers.map((server) => (
          <ServerMirrorCard key={server.id} server={server} />
        ))}
        {servers.length === 0 && (
          <div className="col-span-full border border-zinc-800 bg-zinc-950/80 p-10 text-center text-zinc-500">
            Nenhum servidor de streaming detectado no ecossistema Odin.
          </div>
        )}
      </div>
    </div>
  );
}
