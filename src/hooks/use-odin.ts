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

  const fetchAll = async (quiet = false) => {
    const now = Date.now();
    
    // Prevent multiple simultaneous fetches
    if (isFetching.current) return;
    
    // Manual refresh always bypasses cache
    if (quiet && now - lastFetch.current < 10000) return;

    isFetching.current = true;
    if (!quiet) setLoading(true);

    try {
      console.log("[useOdinData] Sincronizando com Odin...");
      
      const response = await getOdinFullData().catch(e => {
        console.error("[useOdinData] Request failed:", e);
        return { success: false, error: "Falha na conexão com o servidor. Verifique o SSH/MySQL." };
      }) as any;
      
      if (response?.success && response.data) {
        const { customers, streams, bouquets, servers, resellers } = response.data;
        if (customers) setCustomers(customers);
        if (streams) setStreams(streams);
        if (bouquets) setBouquets(bouquets);
        if (servers) setServers(servers);
        if (resellers) setResellers(resellers);
        
        lastFetch.current = Date.now();
      } else {
        const errorMsg = response?.error || "Falha na resposta do servidor";
        console.error("[useOdinData] Erro:", errorMsg);
        if (!quiet) toast.error(errorMsg);
      }
    } catch (e: any) {
      console.error("[useOdinData] Erro inesperado:", e);
      if (!quiet) toast.error("Falha crítica de comunicação.");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const stats = {
    totalUsers: customers.length,
    onlineUsers: customers.reduce((acc, curr) => acc + (curr.active_cons > 0 ? 1 : 0), 0),
    activeStreams: streams.filter(s => s.status === 1).length,
    totalStreams: streams.length,
    totalServers: servers.length,
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
