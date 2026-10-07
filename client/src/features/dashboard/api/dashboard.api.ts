import { api, type Query } from '@/lib/api';
import type {
  AnalyticsSummary,
  ApiKeyItem,
  ConnectLink,
  CreatedApiKey,
  MessagesResponse,
  ProfileResponse,
  TimeseriesPoint,
  TopContact,
  WaAccountItem,
} from '../types/dashboard';

export const dashboardApi = {
  profile: () => api.get<ProfileResponse>('/clients/me'),
  summary: (query?: Query) =>
    api.get<AnalyticsSummary>('/clients/me/analytics/summary', query),
  timeseries: (query?: Query) =>
    api.get<TimeseriesPoint[]>('/clients/me/analytics/timeseries', query),
  topContacts: (limit = 8) =>
    api.get<TopContact[]>('/clients/me/analytics/top-contacts', { limit }),
  messages: (query?: Query) => api.get<MessagesResponse>('/clients/me/messages', query),
  apiKeys: () => api.get<ApiKeyItem[]>('/clients/me/api-keys'),
  createApiKey: (label: string) => api.post<CreatedApiKey>('/clients/me/api-keys', { label }),
  revokeApiKey: (id: string) => api.del(`/clients/me/api-keys/${id}`),
  waAccounts: () => api.get<WaAccountItem[]>('/clients/me/whatsapp'),
  connectLink: () => api.get<ConnectLink>('/clients/me/connect-whatsapp/link'),
};