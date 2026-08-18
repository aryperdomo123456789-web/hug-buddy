import React from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Server as ServerIcon,
  Users,
  Download,
  Upload,
  EyeOff,
} from "lucide-react";

import type { Server } from "@/types/odin";

interface ServerListProps {
  servers: Server[];
  loading: boolean;
  onRefresh: () => void;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatValue(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
}

function formatSpeed(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value >= 1000 ? `${formatValue(value / 1000, 2)} Gbit/s` : `${formatValue(value, 0)} Mbit/s`;
  }
  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim();
    if (normalized === "-1" || normalized === "0" || normalized === "0.0") return "N/A";
    return normalized;
  }
  return "N/A";
}

function formatUptime(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    if (value > 1_000_000_000) {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value * 1000));
    }
    return `${formatValue(value, 0)}s`;
  }
  return "N/A";
}

function getHardware(server: Server): Record<string, unknown> {
  return server.hardware && typeof server.hardware === "object" ? (server.hardware as Record<string, unknown>) : {};
}

function pickMetric(source: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = source[key];
    const parsed = toNumber(value);
    if (parsed !== 0 || value === 0 || value === "0" || value === "0.0") return parsed;
  }
  return fallback;
}

function getServerMetrics(server: Server) {
  const hardware = getHardware(server);
  const connections =
    server.live_connections ??
    pickMetric(hardware, ["conns", "connections", "current_connections", "active_connections", "users"], 0);
  const users = server.live_users ?? pickMetric(hardware, ["users", "online_users", "current_users", "utilizadores"], 0);
  const streamsLive =
    server.live_streams ?? pickMetric(hardware, ["streams_live", "live_streams", "streamsOnline", "streams_online"], 0);
  const streamsOff =
    server.offline_streams ?? pickMetric(hardware, ["streams_off", "offline_streams", "streamsOffline", "streams_offline"], 0);
  const input = server.input_mbps ?? pickMetric(hardware, ["input_mbps", "input", "total_input", "bandwidth_in", "rx"], 0);
  const output = server.output_mbps ?? pickMetric(hardware, ["output_mbps", "output", "total_output", "bandwidth_out", "tx"], 0);
  const cpu = pickMetric(hardware, ["cpu_usage", "cpu_percent", "cpu"], 0);
  const ram = pickMetric(hardware, ["ram_usage", "ram_percent", "memory_usage"], 0);
  const totalRam = pickMetric(hardware, ["total_ram", "ram_total", "memory_total"], 0);
  const usedRam = pickMetric(hardware, ["total_used", "ram_used", "memory_used"], 0);
  const network = formatSpeed(server.network_speed ?? hardware["network_speed"] ?? hardware["net_speed"] ?? hardware["network"] ?? hardware["speed"]);
  const uptime = formatUptime(hardware["uptime"] ?? hardware["last_check"] ?? server.last_check);

  return {
    connections,
    users,
    streamsLive,
    streamsOff,
    input,
    output,
    cpu,
    ram: ram || (totalRam > 0 ? (usedRam / totalRam) * 100 : 0),
    network,
    uptime,
  };
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "pink" | "slate";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
      : tone === "green"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        : tone === "pink"
          ? "border-pink-500/20 bg-pink-500/10 text-pink-300"
          : "border-zinc-700 bg-zinc-950/80 text-zinc-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-inherit/70">{label}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function ServerMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
        <Icon size={12} className="text-zinc-500" />
        {label}
      </div>
      <div className="mt-2 text-lg font-black tracking-tight text-zinc-100">{value}</div>
    </div>
  );
}

function ServerCard({ server }: { server: Server }) {
  const metrics = getServerMetrics(server);
  const online = Number(server.status) === 1;
  const hardware = getHardware(server);
  const cpuName =
    typeof hardware["cpu_name"] === "string" && hardware["cpu_name"].trim() ? hardware["cpu_name"].trim() : "Desconhecido";
  const kernel = typeof hardware["kernel"] === "string" && hardware["kernel"].trim() ? hardware["kernel"].trim() : "N/A";

  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-[#0f1014] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${
        online ? "border-blue-500/30" : "border-zinc-800"
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <ServerIcon size={28} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
              ID: #{server.id} • Porta: {server.port || "N/A"}
            </div>
            <h3 className="truncate text-[22px] font-black uppercase tracking-tight text-zinc-100">
              {server.name || "Servidor"}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <span>Kernel: {kernel}</span>
              <span className="text-zinc-700">•</span>
              <span>CPU: {cpuName}</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${
            online ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {online ? "Online" : "Offline"}
        </div>
      </header>

      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        <ServerMetric icon={Users} label="Clientes" value={formatValue(server.total_clients)} />
        <ServerMetric icon={Cpu} label="CPU" value={`${formatValue(metrics.cpu, 1)}%`} />
        <ServerMetric icon={HardDrive} label="RAM" value={`${formatValue(metrics.ram, 1)}%`} />
        <ServerMetric icon={Network} label="Rede" value={metrics.network} />
      </div>

      <div className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-4">
        <ServerMetric icon={Activity} label="Conns" value={formatValue(metrics.connections)} />
        <ServerMetric icon={Users} label="Usuários" value={formatValue(metrics.users)} />
        <ServerMetric icon={EyeOff} label="Streams Live" value={formatValue(metrics.streamsLive)} />
        <ServerMetric icon={EyeOff} label="Streams Off" value={formatValue(metrics.streamsOff)} />
      </div>

      <div className="grid gap-3 border-t border-white/5 px-5 py-5 md:grid-cols-2">
        <MetricPill label="Input" value={`${formatValue(metrics.input, 3)} Mbps`} tone="pink" />
        <MetricPill label="Output" value={`${formatValue(metrics.output, 3)} Mbps`} tone="blue" />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span>Última verificação: {formatUptime(server.last_check)}</span>
          <span className="text-zinc-700">•</span>
          <span>Uptime: {metrics.uptime}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>Conexões: {formatValue(metrics.connections)}</span>
          <span className="text-zinc-700">•</span>
          <span>Utilizadores: {formatValue(metrics.users)}</span>
        </div>
      </div>
    </section>
  );
}

export function ServerList({ servers, loading, onRefresh }: ServerListProps) {
  const onlineServers = servers.filter((server) => Number(server.status) === 1).length;
  const totalUsersOnline = servers.reduce((acc, server) => acc + (server.live_users ?? 0), 0);
  const totalClients = servers.reduce((acc, server) => acc + toNumber(server.total_clients), 0);
  const totalInput = servers.reduce((acc, server) => acc + (server.input_mbps ?? 0), 0);
  const totalOutput = servers.reduce((acc, server) => acc + (server.output_mbps ?? 0), 0);
  const totalConnections = servers.reduce((acc, server) => acc + (server.live_connections ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[34px] font-black uppercase tracking-tight text-zinc-100">Servidores</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
            Espelho em tempo real das métricas do Odin
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-60"
          type="button"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/90 to-sky-500/70 p-5 text-white shadow-lg">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">Utilizadores Online</div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <Users size={28} className="text-white" />
            <div className="text-right">
              <div className="text-[44px] font-light leading-none">{formatValue(totalUsersOnline)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/90">usuários em tempo real</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/90 to-green-500/70 p-5 text-white shadow-lg">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">Conexões Abertas</div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <Activity size={28} className="text-white" />
            <div className="text-right">
              <div className="text-[44px] font-light leading-none">{formatValue(totalConnections)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/90">sessões em tempo real</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/90 to-rose-500/70 p-5 text-white shadow-lg">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">Total Input</div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <Download size={28} className="text-white" />
            <div className="text-right">
              <div className="text-[44px] font-light leading-none">{formatValue(totalInput, 2)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/90">Mbps recebidos</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-400/20 bg-gradient-to-br from-slate-400 to-slate-500 p-5 text-white shadow-lg">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">Total Output</div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <Upload size={28} className="text-white" />
            <div className="text-right">
              <div className="text-[44px] font-light leading-none">{formatValue(totalOutput, 2)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/90">
                {formatValue(totalClients)} clientes no ecossistema
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-[#0b0b0f] p-4 md:p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <ServerIcon className="text-blue-500" size={22} />
            <h3 className="text-[22px] font-black uppercase tracking-tight text-zinc-100">Gestão de Servidores</h3>
          </div>
          <div className="hidden text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 md:block">
            {servers.length} servidores • {onlineServers} online
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}

          {servers.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-16 text-center text-zinc-500">
              <ServerIcon className="mx-auto mb-4 text-zinc-700" size={48} />
              <div className="text-base font-semibold">Nenhum servidor de streaming detectado no ecossistema Odin.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
