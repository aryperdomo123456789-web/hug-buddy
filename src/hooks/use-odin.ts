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
      // Usando Promise.allSettled para que uma falha não bloqueie as outras
      const results = await Promise.allSettled([
        getUsers(),
        getStreams(),
        getBouquets(),
        getServers()
      ]);

      const [uRes, stRes, bRes, svRes] = results;

      if (uRes.status === 'fulfilled' && (uRes.value as any)?.success) {
        setCustomers((uRes.value as any).data);
      }

      if (stRes.status === 'fulfilled' && (stRes.value as any)?.success) {
        setStreams((stRes.value as any).data);
      }

      if (bRes.status === 'fulfilled' && (bRes.value as any)?.success) {
        setBouquets((bRes.value as any).data);
      }
      
      if (svRes.status === 'fulfilled' && (svRes.value as any)?.success) {
        setServers((svRes.value as any).data);
      }

      lastFetch.current = now;
    } catch (e: any) {
      console.error("[useOdinData] Erro crítico:", e);
      toast.error("Erro de conexão com o servidor.");
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
