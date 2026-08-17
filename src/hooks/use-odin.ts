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
import { User, Server, Stream, Bouquet, Reseller, DashboardStats } from "@/types/odin";

/**
 * Hook central para gerenciamento de dados do Odin.
 * Implementa carga progressiva e tratamento de erros.
 */
export function useOdinData() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  
  const [totalConns, setTotalConns] = useState(0);
  const isFetching = useRef(false);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    if (!quiet) setLoading(true);

    try {
      const response = await getOdinFullData();
      
      if (response?.success && response.data) {
        const { customers, streams, bouquets, servers, resellers } = response.data;
        
        setCustomers(customers || []);
        setStreams(streams || []);
        setBouquets(bouquets || []);
        setServers(servers || []);
        setResellers(resellers || []);
      } else if (!quiet) {
        if (response?.error !== 'Unauthorized') {
          console.error("[useOdinData] Response failure:", response?.error);
          toast.error("Falha ao carregar dados do servidor.");
        }
      }
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
  };

  return {
    loading,
    customers,
    servers,
    streams,
    bouquets,
    resellers,
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
