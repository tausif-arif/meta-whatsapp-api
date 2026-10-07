import { useQuery } from '@tanstack/react-query';
import { fromDaysAgo } from '@/lib/format';
import { dashboardApi } from '../api/dashboard.api';

export const useProfile = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: dashboardApi.profile,
    staleTime: 5 * 60_000,
  });

export const useSummary = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['analytics', 'summary', from, to],
    queryFn: () => dashboardApi.summary({ from, to }),
    staleTime: 60_000,
  });

export const useTimeseries = (granularity: 'day' | 'hour' = 'day', days = 14) =>
  useQuery({
    queryKey: ['analytics', 'timeseries', granularity, days],
    queryFn: () => dashboardApi.timeseries({ granularity, from: fromDaysAgo(days) }),
    staleTime: 60_000,
  });

export const useTopContacts = (limit = 8) =>
  useQuery({
    queryKey: ['analytics', 'top-contacts', limit],
    queryFn: () => dashboardApi.topContacts(limit),
    staleTime: 60_000,
  });