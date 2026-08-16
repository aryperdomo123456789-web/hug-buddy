import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { User, DashboardStats } from "@/types/odin";

export function useOdinData() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [bouquets, setBouquets] = useState<any[]>([]);
  const isFetching = useRef(false);

  const fetchUsersFn = useServerFn(getUsers);
  const fetchServersFn = useServerFn(getServers);
  const fetchStreamsFn = useServerFn(getStreams);
  const fetchBouquetsFn = useServerFn(getBouquets);
  const createUserFn = useServerFn(createUser);
  const updateUserFn = useServerFn(updateUser);
  const deleteUserFn = useServerFn(deleteUser);
  const killConnectionsFn = useServerFn(killUserConnections);
  const toggleStatusFn = useServerFn(toggleUserStatus);

  const fetchAll = async (quiet = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    if (!quiet) setLoading(true);
    try {
      console.log("[Odin Hook] Calling fetchUsersFn...");
      const uRes = await fetchUsersFn();
      console.log("[Odin Hook] fetchUsersFn response:", uRes);
      if (uRes && uRes.success && 'data' in uRes) {
        setCustomers(uRes.data as any);
      } else if (uRes && !uRes.success) {
        toast.error(`Erro Usuários: ${uRes.error}`);
      }
      
      // Delay entre chamadas para não saturar o túnel SSH
      await new Promise(r => setTimeout(r, 800));
      
      const sRes = await fetchServersFn().catch(e => ({ success: false, error: e.message }));
      if (sRes.success && 'data' in sRes) setServers(sRes.data || []);
      
      await new Promise(r => setTimeout(r, 800));
      
      const stRes = await fetchStreamsFn().catch(e => ({ success: false, error: e.message }));
      if (stRes.success && 'data' in stRes) setStreams(stRes.data || []);
      
      await new Promise(r => setTimeout(r, 800));
      
      const bRes = await fetchBouquetsFn().catch(e => ({ success: false, error: e.message }));
      if (bRes.success && 'data' in bRes) setBouquets(bRes.data || []);
      
    } catch (e: any) {
      console.error("Erro crítico ao carregar dados do Odin:", e);
      toast.error("Falha na conexão com servidor Odin");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const stats: DashboardStats = {
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
      createUser: createUserFn,
      updateUser: updateUserFn,
      deleteUser: deleteUserFn,
      killConnections: killConnectionsFn,
      toggleStatus: toggleStatusFn,
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