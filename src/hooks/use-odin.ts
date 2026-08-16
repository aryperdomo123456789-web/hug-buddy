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
      const uRes = await fetchUsersFn().catch(e => {

        console.error("fetchUsersFn failed:", e);
        return { success: false, error: e.message };
      });
      if (uRes.success && 'data' in uRes) setCustomers(uRes.data as any);
      
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
    // Adicionamos um pequeno delay na hidratação para garantir que o DOM inicial 
    // seja renderizado corretamente antes de trocar para o estado hidratado.
    const t = setTimeout(() => {
      setHydrated(true);
    }, 100);
    return () => clearTimeout(t);
  }, []);
  return hydrated;
}