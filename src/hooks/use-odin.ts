import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  getUsers, 
  getServers, 
  getStreams, 
  getBouquets,
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
      // SEQUENTIAL execution to prevent socket saturation and "aborted" errors
      const uRes = await getUsers().catch(e => ({ success: false, error: e.message })) as any;
      if (uRes?.success) setCustomers(uRes.data);

      const stRes = await getStreams().catch(e => ({ success: false, error: e.message })) as any;
      if (stRes?.success) setStreams(stRes.data);

      const bRes = await getBouquets().catch(e => ({ success: false, error: e.message })) as any;
      if (bRes?.success) setBouquets(bRes.data);
      
      const svRes = await getServers().catch(e => ({ success: false, error: e.message })) as any;
      if (svRes?.success) setServers(svRes.data);

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
