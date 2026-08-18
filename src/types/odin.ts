import { z } from "zod";

export interface Plan {
  id?: string;
  name: string;
  odin_server_id?: string | null;
  odin_package_id?: number | null;
  bouquets: number[];
  connections: number;
  duration: number;
  duration_unit: 'minutes' | 'hours' | 'days' | 'months' | 'years';
  price: number;
  is_trial: boolean;
  has_adult_content: boolean;
  status: 'active' | 'inactive';
  sort_order: number;
  template?: string | null;
  created_at?: string;
}

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
  package_name: z.string().optional(),
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
  member_group_id: z.number().int().default(2), // 2 = Reseller, 5 = Subreseller?
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
  bitrate_mbps?: number;
}

export interface Server {
  id: string;
  name: string;
  status: number;
  last_check: number;
  hardware: Record<string, any>;
  total_clients: number;
  port: string;
  server_type?: number;
  live_connections?: number;
  live_users?: number;
  live_streams?: number;
  offline_streams?: number;
  total_streams?: number;
  input_mbps?: number;
  output_mbps?: number;
  avg_bitrate_mbps?: number;
  bytes_sent?: number;
  bytes_received?: number;
  network_speed?: string | number;
}

export interface Bouquet {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  role: "admin" | "reseller";
  odin_reseller_id: number | null;
  full_name: string | null;
  updated_at?: string | null;
}

export interface OdinSnapshot {
  customers: User[];
  streams: Stream[];
  bouquets: Bouquet[];
  servers: Server[];
  resellers: Reseller[];
}

export interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeStreams: number;
  totalStreams: number;
  totalServers: number;
  totalClients: number;
  totalResellers: number;
  openConnections?: number;
}

export interface SSHResponse<T = any> {
  success: boolean;
  data?: T;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: string;
}
