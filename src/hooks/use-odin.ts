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
  deleteReseller
} from "@/lib/server.functions";

/**
 * Hook central para gerenciamento de dados do Odin.
 * Implementa carga progressiva e tratamento de erros.
 */
export function useOdinData() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [bouquets, setBouquets] = useState<any[]>([]);
  const [resellers, setResellers] = useState<any[]>([]);
  const isFetching = useRef(false);
  const lastFetch = useRef(0);
  const pollInterval = useRef<any>(null);

  const fetchAll = async (quiet = false) => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    if (!quiet) setLoading(true);

    try {
      const response = await getOdinFullData().catch(err => {
        // Se falhar por 401/Unauthorized, retornamos erro amigável
        if (err.message?.includes('Unauthorized')) {
          return { success: false, error: 'Unauthorized' };
        }
        throw err;
      });
      
      if (response?.success && response.data) {
        console.log("[useOdinData] Data received:", {
          customers: response.data.customers?.length,
          servers: response.data.servers?.length,
          streams: response.data.streams?.length
        });
        const { customers, streams, bouquets, servers, resellers } = response.data;
        
        setCustomers(customers || []);
        setStreams(streams || []);
        setBouquets(bouquets || []);
        setServers(servers || []);
        setResellers(resellers || []);
        
        lastFetch.current = Date.now();
      } else if (!quiet) {

        console.error("[useOdinData] Response failure:", response?.error);
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
  };

  useEffect(() => {
    // Carga inicial
    fetchAll();

    // Polling real para "espelhamento" - a cada 30 segundos
    pollInterval.current = setInterval(() => {
      fetchAll(true);
    }, 30000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
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
