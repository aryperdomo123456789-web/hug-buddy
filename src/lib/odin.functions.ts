import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("!!! SERVER FN getUsers INICIO !!!");
    return { success: true, data: [{ id: 1, username: "MAGO_TESTE", active_cons: 99 }] };
  });

export const getServers = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const getStreams = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const getBouquets = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const createUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const updateUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const deleteUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const toggleUserStatus = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const killUserConnections = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const getInstallScript = createServerFn({ method: "GET" }).handler(async () => "echo 'Mago Installer'");
export const generateBashScript = (t: string, i: string) => "echo 'Bash Script'";
