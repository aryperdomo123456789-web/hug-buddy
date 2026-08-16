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
    if (!quiet) setLoading(true);

    try {
      console.log("[useOdinData] Iniciando carga...");
      const uRes = await getUsers();
      console.log("[useOdinData] Resposta usuários:", uRes);
      
      if (uRes?.success && Array.isArray(uRes.data)) {
        setCustomers(uRes.data);
      } else if (uRes && !uRes.success) {
        toast.error(`Erro: ${(uRes as any).error || 'Desconhecido'}`);
      }
    } catch (e: any) {
      console.error("[useOdinData] Erro fatal:", e);
      toast.error("Falha na comunicação com o servidor");
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
