export interface AuditLog {
  id?: number;
  name?: string;
  resource: string;
  action: 'create' | 'update' | 'delete' | 'read';
  timestamp?: string;
  author?: {
    id?: number;
    username?: string;
    name?: string;
    email?: string;
  };
  author_name?: string;
  data: Record<string, unknown>;
  previous_data?: Record<string, unknown>;
  meta: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogParams {
  resource: string;
  action: string;
  author?: {
    id?: number;
    username?: string;
    name?: string;
    email?: string;
  };
  data?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface AuditLogResponse {
  id: number;
  name: string;
  author_info: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  resource: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
  author_name: string;
  object_id: number;
  data: Record<string, unknown>;
  previous_data: Record<string, unknown>;
  meta: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  author: number;
  content_type: number;
}
