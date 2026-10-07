import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { webhookController } from './webhook.controller.js';
import { listWebhookMessagesQuerySchema } from './webhook.types.js';

/** Public: Meta calls these to verify and push events (signature is verified in the service). */
export const webhookRouter = Router();
webhookRouter.get('/', webhookController.verify);
webhookRouter.post('/', webhookController.receive);

/** Protected: mounted behind API-key authentication. */
export const webhookProtectedRouter = Router();
webhookProtectedRouter.get(
  '/messages',
  validate(listWebhookMessagesQuerySchema, 'query'),
  webhookController.listMessages,
);
