import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const useApiKeys = () =>
  useQuery({
    queryKey: ['api-keys'],
    queryFn: dashboardApi.apiKeys,
  });

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => dashboardApi.createApiKey(label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dashboardApi.revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });
};