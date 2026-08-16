import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  getOdinFullData,
  createUser,
  updateUser,
  deleteUser,
  killUserConnections,
  toggleUserStatus
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
  const isFetching = useRef(false);
  const lastFetch = useRef(0);

  const fetchAll = async (quiet = false) => {
    // Cache de 30 segundos para evitar sobrecarga SSH se não for "quiet" (refresh manual)
    const now = Date.now();
    if (!quiet && now - lastFetch.current < 30000) return;

    if (isFetching.current) return;
    isFetching.current = true;
    
    console.log("[useOdinData] Iniciando sincronização...");
    if (!quiet) setLoading(true);

    try {
      // SINGLE fetch for all data to reduce SSH overhead and prevent "aborted" errors
      const response = await getOdinFullData().catch(e => ({ success: false, error: e.message })) as any;
      
      if (response?.success && response.data) {
        const { customers, streams, bouquets, servers } = response.data;
        if (customers) setCustomers(customers);
        if (streams) setStreams(streams);
        if (bouquets) setBouquets(bouquets);
        if (servers) setServers(servers);
      } else if (!quiet) {
        console.error("[useOdinData] Response failure:", response?.error);
        toast.error("Erro ao sincronizar dados: " + (response?.error || "Desconhecido"));
      }

      lastFetch.current = now;
    } catch (e: any) {
      console.error("[useOdinData] Erro crítico:", e);
      if (!quiet) toast.error("Erro de conexão com o servidor.");
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
  };

  return {
    loading,
    customers,
    servers,
    streams,
    bouquets,
    stats,
    fetchAll,
    actions: {
      createUser,
      updateUser,
      deleteUser,
      killConnections: killUserConnections,
      toggleStatus: toggleUserStatus,
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
