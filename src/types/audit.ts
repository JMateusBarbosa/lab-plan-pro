import type { Json } from "@/types/database";

export type AuditAction =
  | "insert"
  | "update"
  | "soft_delete"
  | "restore"
  | "admin_update"
  | "status_change"
  | "provision";

export interface AuditFilters {
  from?: string;
  to?: string;
  laboratoryId?: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  page: number;
  pageSize: number;
}

export interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  actorEmail: string | null;
  laboratoryId: string | null;
  laboratoryName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: Json | null;
  afterData: Json | null;
  metadata: Json;
  createdAt: string;
}

export interface AuditListResult {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditFilterOptions {
  laboratories: Array<{ id: string; name: string }>;
  actors: Array<{ id: string; email: string; role: string }>;
  actions: string[];
  entityTypes: string[];
}
