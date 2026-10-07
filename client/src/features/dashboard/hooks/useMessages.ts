import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export interface MessageFilters {
  page: number;
  limit: number;
  direction?: string;
  type?: string;
  status?: string;
}

export const useMessages = (filters: MessageFilters) =>
  useQuery({
    queryKey: ['messages', filters],
    queryFn: () =>
      dashboardApi.messages({
        page: filters.page,
        limit: filters.limit,
        direction: filters.direction,
        type: filters.type,
        status: filters.status,
      }),
    placeholderData: keepPreviousData,
  });