import { useState, useEffect, useRef, useCallback } from "react";
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
  deleteReseller
} from "@/lib/server.functions";
import { getPlans, savePlan, deletePlan, getAppSettings, saveAppSetting } from "@/lib/plans.functions";
import { User, Server, Stream, Bouquet, Reseller, DashboardStats, Plan } from "@/types/odin";

export function useOdinData() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  
  const [totalConns, setTotalConns] = useState(0);
  const isFetching = useRef(false);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    if (!quiet) setLoading(true);

    try {
      const [response, plansData, settingsData] = await Promise.all([
        getOdinFullData(),
        getPlans(),
        getAppSettings()
      ]);
      
      if (response?.success && response.data) {
        const { customers, streams, bouquets, servers, resellers, totalConns } = response.data as any;
        
        setCustomers(customers || []);
        setStreams(streams || []);
        setBouquets(bouquets || []);
        setServers(servers || []);
        setResellers(resellers || []);
        setTotalConns(totalConns || 0);
      } else if (!quiet) {
        if (response?.error !== 'Unauthorized') {
          console.error("[useOdinData] Response failure:", response?.error);
        }
      }

      setPlans(plansData || []);
      setSettings(settingsData || {});
      
    } catch (e: any) {
      if (!quiet) {
        toast.error("Erro na comunicação com o backend.");
      }
      console.error("[useOdinData] Catch error:", e);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAll();

    pollInterval.current = setInterval(() => {
      fetchAll(true);
    }, 30000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchAll]);

  const stats: DashboardStats = {
    totalUsers: customers.length,
    onlineUsers: customers.reduce((acc, curr) => acc + (curr.active_cons > 0 ? 1 : 0), 0),
    activeStreams: streams.filter(s => s.status === 1).length,
    totalStreams: streams.length,
    totalServers: servers.length,
    totalClients: servers.reduce((acc, s) => acc + (s.total_clients || 0), 0),
    totalResellers: resellers.length,
    totalConns: totalConns,
    totalInput: "0 Mbps",
    totalOutput: "0 Mbps"
  };

  return {
    loading,
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
      deleteReseller,
      savePlan,
      deletePlan,
      saveAppSetting
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
