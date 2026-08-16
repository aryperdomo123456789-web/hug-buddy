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
    if (isFetching.current) return;
    
    isFetching.current = true;
    if (!quiet) setLoading(true);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 12000)
      );
      
      const response = await Promise.race([
        getOdinFullData(),
        timeoutPromise
      ]) as any;
      
      if (response?.success && response.data) {
        const { customers, streams, bouquets, servers, resellers } = response.data;
        
        setCustomers(customers || []);
        setStreams(streams || []);
        setBouquets(bouquets || []);
        setServers(servers || []);
        setResellers(resellers || []);
        
        lastFetch.current = Date.now();
      } else if (!quiet) {
        toast.error(response?.error || "Erro ao conectar com o servidor. Verifique a conexão.");
      }
    } catch (e: any) {
      if (!quiet) {
        if (e.message === "Timeout") {
          toast.error("O servidor demorou muito para responder. Tente novamente.");
        } else {
          toast.error("Erro na comunicação com o backend.");
        }
      }
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
