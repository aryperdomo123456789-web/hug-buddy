import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  getOdinFullData,
  createUser,
  updateUser,
  deleteUser,
  killUserConnections,
  toggleUserStatus,
  createReseller,
  updateReseller,
  deleteReseller,
  getPlans,
  getAppSettings
} from "@/lib/server.functions";
import type { OdinSnapshot } from "@/types/odin";
import { publishRuntimeError } from "@/lib/runtime-error-bus";

/**
 * Hook central para gerenciamento de dados do Odin.
 * Implementa carga progressiva e tratamento de erros.
 */
function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function loadTrafficSnapshot(): Record<string, { ts: number; sent: number; received: number }> {
  try {
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return {};
    const raw = sessionStorage.getItem("mago-panel-traffic-snapshot");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { ts: number; sent: number; received: number }>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveTrafficSnapshot(snapshot: Record<string, { ts: number; sent: number; received: number }>) {
  try {
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return;
    sessionStorage.setItem("mago-panel-traffic-snapshot", JSON.stringify(snapshot));
  } catch {
    // Ignorar quando sessionStorage não estiver disponível.
  }
}

function toLegacyId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeBouquetValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim() || "[]";
  }

  if (Array.isArray(value)) {
    const ids = value
      .map((item) => {
        if (item && typeof item === "object") {
          const candidate = item as Record<string, unknown>;
          return toLegacyId(candidate["id"] ?? candidate["M_ID"] ?? candidate["m_id"]);
        }
        return toLegacyId(item);
      })
      .filter((id) => id > 0);
    return JSON.stringify(ids);
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const ids = [candidate["id"], candidate["M_ID"], candidate["m_id"]]
      .map((item) => toLegacyId(item))
      .filter((id) => id > 0);
    return JSON.stringify(ids);
  }

  return "[]";
}

function normalizeCustomerRecord(customer: any) {
  if (!customer || typeof customer !== "object") return null;
  const id = toLegacyId(customer.id ?? customer.M_ID ?? customer.m_id);
  if (!id) return null;

  return {
    ...customer,
    id,
    M_ID: id,
    m_id: id,
    owner_id: toLegacyId(customer.owner_id ?? customer.created_by ?? customer.M_ID_owner ?? 1) || 1,
    exp_date: toLegacyId(customer.exp_date),
    enabled: toLegacyId(customer.enabled),
    admin_enabled: toLegacyId(customer.admin_enabled),
    is_trial: toLegacyId(customer.is_trial),
    is_restreamer: toLegacyId(customer.is_restreamer),
    is_isplock: toLegacyId(customer.is_isplock),
    max_connections: toLegacyId(customer.max_connections),
    active_cons: toLegacyId(customer.active_cons),
    bouquet: normalizeBouquetValue(customer.bouquet),
    username: typeof customer.username === "string" ? customer.username : "",
    password: typeof customer.password === "string" ? customer.password : "",
    admin_notes: typeof customer.admin_notes === "string" ? customer.admin_notes : "",
    reseller_notes: typeof customer.reseller_notes === "string" ? customer.reseller_notes : "",
    allowed_ips: typeof customer.allowed_ips === "string" ? customer.allowed_ips : "",
    allowed_ua: typeof customer.allowed_ua === "string" ? customer.allowed_ua : "",
    forced_country: typeof customer.forced_country === "string" ? customer.forced_country : "Off",
  };
}

function normalizeSimpleRecord<T extends Record<string, any>>(record: T, fallbackId: unknown) {
  const id = toLegacyId(record?.["id"] ?? record?.["M_ID"] ?? record?.["m_id"] ?? fallbackId);
  return {
    ...record,
    id,
    M_ID: id,
    m_id: id,
  };
}

export function useOdinData(initialData: OdinSnapshot | null = null, initialSyncedAt: number | null = null) {
  const [loading, setLoading] = useState(!initialData);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(initialSyncedAt);
  const [customers, setCustomers] = useState<any[]>(initialData?.customers || []);
  const [servers, setServers] = useState<any[]>(initialData?.servers || []);
  const [streams, setStreams] = useState<any[]>(initialData?.streams || []);
  const [bouquets, setBouquets] = useState<any[]>(initialData?.bouquets || []);
  const [resellers, setResellers] = useState<any[]>(initialData?.resellers || []);
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const isFetching = useRef(false);
  const lastFetch = useRef(0);
  const pollInterval = useRef<any>(null);
  const retryTimeout = useRef<any>(null);
  const consecutiveFailures = useRef(0);
  const trafficSnapshot = useRef<Record<string, { ts: number; sent: number; received: number }>>(loadTrafficSnapshot());
  const pollIntervalMs = 60000;
  const maxQuietRetries = 3;

  const clearRetryTimeout = () => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
  };

  const isTransportError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    const signature = `${error.name}: ${error.message}`.toLowerCase();
    return (
      signature.includes("failed to fetch") ||
      signature.includes("networkerror") ||
      signature.includes("load failed") ||
      signature.includes("fetch failed")
    );
  };

  const fetchAll = async (quiet = false, meta?: { trigger?: string }) => {
    if (isFetching.current) return;

    isFetching.current = true;
    if (!quiet) setLoading(true);
    const hadDataBeforeFetch =
      customers.length > 0 || servers.length > 0 || streams.length > 0 || bouquets.length > 0 || resellers.length > 0;

    try {
      const response = await getOdinFullData().catch(e => {
        console.error("[useOdinData] Critical RPC error:", e);
        return { success: false, error: e.message };
      });

      if (response && (response as any).success && (response as any).data) {
        console.log("[useOdinData] Data received:", {
          customers: (response as any).data.customers?.length,
          servers: (response as any).data.servers?.length,
          streams: (response as any).data.streams?.length
        });
        const { customers, streams, bouquets, servers, resellers } = (response as any).data;
        const now = Date.now();
        const normalizedCustomers = (customers || [])
          .map((customer: any) => normalizeCustomerRecord(customer))
          .filter(Boolean);
        const normalizedStreams = (streams || [])
          .map((stream: any) => normalizeSimpleRecord(stream, stream?.id))
          .filter(Boolean);
        const normalizedBouquets = (bouquets || [])
          .map((bouquet: any) => normalizeSimpleRecord(bouquet, bouquet?.id))
          .filter(Boolean);
        const normalizedResellers = (resellers || [])
          .map((reseller: any) => normalizeSimpleRecord(reseller, reseller?.id))
          .filter(Boolean);

        const enrichedServers = (servers || []).map((server: any) => {
          const hardware = server?.hardware && typeof server.hardware === "object" ? server.hardware : {};
          const serverId = String(server?.id ?? server?.server_id ?? server?.name ?? "");
          const sent = toFiniteNumber(server?.bytes_sent ?? hardware.bytes_sent);
          const received = toFiniteNumber(server?.bytes_received ?? hardware.bytes_received);
          const previous = trafficSnapshot.current[serverId];

          let input_mbps = toFiniteNumber(server?.input_mbps ?? hardware.input_mbps);
          let output_mbps = toFiniteNumber(server?.output_mbps ?? hardware.output_mbps);

          if (previous && now > previous.ts) {
            const elapsedSeconds = (now - previous.ts) / 1000;
            const inputDelta = Math.max(0, received - previous.received);
            const outputDelta = Math.max(0, sent - previous.sent);
            const computedInput = elapsedSeconds > 0 ? (inputDelta * 8) / elapsedSeconds / 1_000_000 : 0;
            const computedOutput = elapsedSeconds > 0 ? (outputDelta * 8) / elapsedSeconds / 1_000_000 : 0;

            if (computedInput > 0) input_mbps = computedInput;
            if (computedOutput > 0) output_mbps = computedOutput;
          }

          trafficSnapshot.current[serverId] = { ts: now, sent, received };

          return {
            ...server,
            id: server?.id ?? server?.M_ID ?? server?.m_id ?? serverId,
            M_ID: server?.id ?? server?.M_ID ?? server?.m_id ?? serverId,
            m_id: server?.id ?? server?.M_ID ?? server?.m_id ?? serverId,
            input_mbps,
            output_mbps,
            bytes_sent: sent,
            bytes_received: received,
          };
        });
        saveTrafficSnapshot(trafficSnapshot.current);

        setCustomers(normalizedCustomers as any[]);
        setStreams(normalizedStreams as any[]);
        setBouquets(normalizedBouquets as any[]);
        setServers(enrichedServers || []);
        setResellers(normalizedResellers as any[]);

        lastFetch.current = Date.now();
        setLastSyncAt(lastFetch.current);
        consecutiveFailures.current = 0;
        clearRetryTimeout();

        // Fetch local Supabase data (Plans/Settings)
        try {
          const [plansData, settingsData] = await Promise.all([
            getPlans(),
            getAppSettings()
          ]);
          setPlans(plansData);
          setSettings(settingsData);
        } catch (err) {
          console.error("[useOdinData] Supabase fetch error:", err);
        }
      } else if (!quiet) {
        const message = (response as any)?.error || "Falha ao carregar dados do Odin.";
        console.error("[useOdinData] Response failure:", message);
        publishRuntimeError(new Error(String(message)), {
          source: "manual",
          phase: "effect",
          route: typeof window !== "undefined" ? window.location.pathname : "/",
        });
      }
    } catch (e: any) {
      consecutiveFailures.current += 1;
      const transient = isTransportError(e);
      const contextDetails = [
        `quiet=${quiet ? "true" : "false"}`,
        `trigger=${meta?.trigger || "unspecified"}`,
        `attempt=${consecutiveFailures.current}`,
        `hadDataBeforeFetch=${hadDataBeforeFetch ? "true" : "false"}`,
        `transient=${transient ? "true" : "false"}`,
      ].join("\n");

      console.error("[useOdinData] Catch error:", {
        message: e?.message,
        name: e?.name,
        trigger: meta?.trigger,
        quiet,
        attempt: consecutiveFailures.current,
        transient,
      }, e);

      if (!quiet) {
        toast.error("Erro na comunicação com o backend.");
      }

      const shouldReport = !quiet || !hadDataBeforeFetch || !transient || consecutiveFailures.current >= maxQuietRetries;
      if (shouldReport) {
        const error = e instanceof Error ? e : new Error(typeof e === "string" ? e : "Falha ao sincronizar dados do Odin.");
        if (!error.message.includes(contextDetails)) {
          error.message = `${error.message}\n${contextDetails}`;
        }
        publishRuntimeError(error, {
          source: "manual",
          phase: "effect",
          route: typeof window !== "undefined" ? window.location.pathname : "/",
        });
      } else {
        if (!retryTimeout.current) {
          const delay = Math.min(30000, 2500 * consecutiveFailures.current);
          retryTimeout.current = window.setTimeout(() => {
            retryTimeout.current = null;
            void fetchAll(true, { trigger: "retry" });
          }, delay);
        }
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (initialData) {
      pollInterval.current = setInterval(() => {
        void fetchAll(true, { trigger: "poll" });
      }, pollIntervalMs);

      return () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        clearRetryTimeout();
      };
    }

    void fetchAll(false, { trigger: "initial" });

    pollInterval.current = setInterval(() => {
      void fetchAll(true, { trigger: "poll" });
    }, pollIntervalMs);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
      clearRetryTimeout();
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchAll(true, { trigger: "focus" });
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);


  const stats = {
    totalUsers: customers.length,
    onlineUsers: customers.reduce((acc, curr) => acc + (curr.active_cons > 0 ? 1 : 0), 0),
    activeStreams: streams.filter(s => s.status === 1).length,
    totalStreams: streams.length,
    totalServers: servers.length,
    totalClients: servers.reduce((acc, s) => acc + (s.total_clients || 0), 0),
    totalResellers: resellers.length,
    openConnections: servers.reduce((acc, s) => acc + (s.live_connections || 0), 0),
  };

  return {
    loading,
    lastSyncAt,
    customers,
    servers,
    streams,
    bouquets,
    resellers,
    plans,
    settings,
    stats,
    fetchAll,
    actions: {
      createUser,
      updateUser,
      deleteUser,
      killConnections: killUserConnections,
      toggleStatus: toggleUserStatus,
      createReseller,
      updateReseller,
      deleteReseller
    }
  };
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
