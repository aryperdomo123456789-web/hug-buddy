import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().optional(),
  username: z.string().default(""),
  password: z.string().default(""),
  owner_id: z.number().int().default(1),
  exp_date: z.number().optional(),
  exp_days: z.number().default(30),
  max_connections: z.number().int().min(0).default(1),
  enabled: z.number().int().min(0).max(1).default(1),
  admin_enabled: z.number().int().min(0).max(1).default(1),
  is_trial: z.number().int().min(0).max(1).default(0),
  is_restreamer: z.number().int().min(0).max(1).default(0),
  is_isplock: z.number().int().min(0).max(1).default(0),
  allowed_ips: z.string().default(""),
  allowed_ua: z.string().default(""),
  admin_notes: z.string().default(""),
  reseller_notes: z.string().default(""),
  bouquet: z.string().default("[]"),
  forced_country: z.string().default("Off"),
  active_cons: z.number().default(0),
  isp_info: z.string().default(""),
  last_ip: z.string().default(""),
  last_ua: z.string().default(""),
});

export type User = z.infer<typeof UserSchema>;

export const ResellerSchema = z.object({
  id: z.number().optional(),
  username: z.string().default(""),
  password: z.string().default(""),
  email: z.string().default(""),
  owner_id: z.number().int().default(1),
  credits: z.number().default(0),
  active: z.number().int().default(1),
  member_group_id: z.number().int().default(2),
  last_login: z.number().optional(),
  user_count: z.number().default(0),
});

export type Reseller = z.infer<typeof ResellerSchema>;

export interface Stream {
  id: number;
  name: string;
  category_id: number;
  icon: string;
  source: string;
  status: number;
}

export interface Server {
  id: string;
  name: string;
  status: number;
  last_check: number;
  hardware: any;
  total_clients: number;
  port: string;
}

export interface Bouquet {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  role: 'admin' | 'reseller';
  odin_reseller_id: number | null;
  full_name: string | null;
  created_at?: string;
}

export interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeStreams: number;
  totalStreams: number;
  totalServers: number;
  totalClients: number;
  totalResellers: number;
}

export interface SSHResponse<T = any> {
  success: boolean;
  data?: T;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: string;
}
