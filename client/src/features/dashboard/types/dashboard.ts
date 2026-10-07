export interface AnalyticsSummary {
  period: { from: string | null; to: string | null };
  totals: { outbound: number; inbound: number; total: number };
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  rates: { deliveredRate: number; readRate: number; failedRate: number };
}

export interface TimeseriesPoint {
  bucket: string;
  direction: 'inbound' | 'outbound';
  value: number;
}

export interface TopContact {
  peer: string;
  value: number;
}

export interface ApiKeyItem {
  id: string;
  label: string;
  keyPrefix: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKeyItem {
  apiKey: string;
}

export interface MessageRow {
  id: string;
  direction: 'inbound' | 'outbound';
  source: 'api' | 'agent' | 'webhook';
  messageType: string;
  peer: string;
  metaMessageId: string | null;
  status: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  messages: MessageRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WaAccountItem {
  id: string;
  phoneNumberId: string;
  phoneNumber: string | null;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ConnectLink {
  status: 'ready' | 'not_configured';
  message?: string;
  url?: string;
  appId?: string;
}

export interface ProfileResponse {
  user: { id: string; email: string | null; phone: string | null; createdAt: string };
  tenant: { id: string; name: string; slug: string; plan: string; agentEnabled: boolean };
  counts: { apiKeys: number; waAccounts: number };
}