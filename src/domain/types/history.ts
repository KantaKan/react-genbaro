export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  cohort: number;
  method: string;
  path: string;
  route: string;
  status: number;
  ip_address: string;
  createdAt: string;
}

export interface HistoryQuery {
  page?: number;
  limit?: number;
  role?: string;
  cohort?: number;
  user_id?: string;
  method?: string;
  q?: string;
}

export interface HistoryPage {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}
