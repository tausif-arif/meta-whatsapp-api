import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { requireTenantId } from '../../common/context/requestContext.js';
import { clientService } from './client.service.js';
import type {
  AnalyticsSummaryQuery,
  CreateApiKeyInput,
  MessagesQuery,
  RevokeApiKeyParams,
  TimeseriesQuery,
  TopContactsQuery,
} from './client.types.js';

export const clientController = {
  listApiKeys: asyncHandler(async (_req, res) => {
    const result = await clientService.listApiKeys(requireTenantId());
    return ApiResponse.success(res, result);
  }),

  createApiKey: asyncHandler(async (req, res) => {
    const result = await clientService.createApiKey(
      requireTenantId(),
      (req.body as CreateApiKeyInput).label ?? 'default',
    );
    return ApiResponse.success(res, result, 'API key created (shown once)');
  }),

  revokeApiKey: asyncHandler(async (req, res) => {
    const result = await clientService.revokeApiKey(
      requireTenantId(),
      (req.params as RevokeApiKeyParams).id,
    );
    return ApiResponse.success(res, result, 'API key revoked');
  }),

  listWaAccounts: asyncHandler(async (_req, res) => {
    const result = await clientService.listWaAccounts(requireTenantId());
    return ApiResponse.success(res, result);
  }),

  connectWhatsappLink: asyncHandler(async (_req, res) => {
    const result = clientService.connectWhatsappLink();
    return ApiResponse.success(res, result);
  }),

  analyticsSummary: asyncHandler(async (req, res) => {
    const result = await clientService.analyticsSummary(
      requireTenantId(),
      req.query as unknown as AnalyticsSummaryQuery,
    );
    return ApiResponse.success(res, result);
  }),

  analyticsTimeseries: asyncHandler(async (req, res) => {
    const result = await clientService.analyticsTimeseries(
      requireTenantId(),
      req.query as unknown as TimeseriesQuery,
    );
    return ApiResponse.success(res, result);
  }),

  analyticsTopContacts: asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as TopContactsQuery;
    const result = await clientService.analyticsTopContacts(requireTenantId(), limit);
    return ApiResponse.success(res, result);
  }),

  listMessages: asyncHandler(async (req, res) => {
    const result = await clientService.listMessages(
      requireTenantId(),
      req.query as unknown as MessagesQuery,
    );
    return ApiResponse.success(res, result);
  }),
};