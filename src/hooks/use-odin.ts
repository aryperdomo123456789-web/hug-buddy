import { useState, useEffect } from "react";
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
    if (!quiet) setLoading(true);
    try {
      // Chamadas sequenciais com delay para evitar sobrecarga do servidor Odin e socket 'aborted'
      const uRes = await fetchUsersFn();
      if (uRes.success) setCustomers(uRes.data as any);
      await new Promise(r => setTimeout(r, 300));
      
      const sRes = await fetchServersFn();
      if (sRes.success) setServers(sRes.data || []);
      await new Promise(r => setTimeout(r, 300));
      
      const stRes = await fetchStreamsFn();
      if (stRes.success) setStreams(stRes.data || []);
      await new Promise(r => setTimeout(r, 300));
      
      const bRes = await fetchBouquetsFn();
      if (bRes.success) setBouquets(bRes.data || []);
    } catch (e) {
      console.error("Erro ao carregar dados do Odin:", e);
      // Evita spam de toast se o erro for abortado propositalmente pelo browser
      if (!quiet) toast.error("Erro na comunicação com o servidor");
    } finally {
      if (!quiet) setLoading(false);
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