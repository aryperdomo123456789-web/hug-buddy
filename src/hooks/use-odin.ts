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

  const fetchAll = async (quiet = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    console.log("[useOdinData] Iniciando sincronização...");
    if (!quiet) setLoading(true);

    try {
      // 1. Carregar Usuários (Prioridade Máxima)
      const uRes = await getUsers();
      console.log("[useOdinData] getUsers Resposta:", uRes);
      
      if (uRes?.success && Array.isArray(uRes.data)) {
        setCustomers(uRes.data);
      } else if (uRes && !uRes.success) {
        toast.error(`Falha no banco de dados: ${uRes.error}`);
      }

      // 3. Carregar Streams
      const stRes = await getStreams();
      if (stRes?.success && Array.isArray(stRes.data)) {
        setStreams(stRes.data);
      }

      // 4. Carregar Bouquets
      const bRes = await getBouquets();
      if (bRes?.success && Array.isArray(bRes.data)) {
        setBouquets(bRes.data);
      }

    } catch (e: any) {
      console.error("[useOdinData] Erro crítico:", e);
      toast.error("Erro de conexão com a API do servidor.");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const stats = {
    totalUsers: customers.length,
    onlineUsers: customers.reduce((acc, curr) => acc + (curr.active_cons || 0), 0),
    activeStreams: streams.filter(s => s.is_online === 1).length,
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
