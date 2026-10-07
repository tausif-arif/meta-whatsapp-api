import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import {
  analyticsSummaryQuerySchema,
  createApiKeySchema,
  messagesQuerySchema,
  revokeApiKeyParamsSchema,
  timeseriesQuerySchema,
  topContactsQuerySchema,
} from './client.types.js';
import { authController } from './auth.controller.js';
import { clientController } from './client.controller.js';

export const clientRouter = Router();

clientRouter.get('/', authController.me);

clientRouter.get('/api-keys', clientController.listApiKeys);
clientRouter.post('/api-keys', validate(createApiKeySchema), clientController.createApiKey);
clientRouter.delete(
  '/api-keys/:id',
  validate(revokeApiKeyParamsSchema, 'params'),
  clientController.revokeApiKey,
);

clientRouter.get('/whatsapp', clientController.listWaAccounts);
clientRouter.get('/connect-whatsapp/link', clientController.connectWhatsappLink);

clientRouter.get(
  '/analytics/summary',
  validate(analyticsSummaryQuerySchema, 'query'),
  clientController.analyticsSummary,
);
clientRouter.get(
  '/analytics/timeseries',
  validate(timeseriesQuerySchema, 'query'),
  clientController.analyticsTimeseries,
);
clientRouter.get(
  '/analytics/top-contacts',
  validate(topContactsQuerySchema, 'query'),
  clientController.analyticsTopContacts,
);
clientRouter.get('/messages', validate(messagesQuerySchema, 'query'), clientController.listMessages);