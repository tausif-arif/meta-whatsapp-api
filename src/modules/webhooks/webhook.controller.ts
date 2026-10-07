import type { Request, Response } from 'express';
import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { webhookService } from './webhook.service.js';
import type { ListWebhookMessagesQuery, WebhookVerifyQuery } from './webhook.types.js';

export const webhookController = {
  verify: (req: Request, res: Response) => {
    const challenge = webhookService.verifyChallenge(req.query as unknown as WebhookVerifyQuery);
    if (!challenge) {
      return ApiResponse.error(
        res,
        403,
        'Webhook verification failed: check META_VERIFY_TOKEN in your .env',
      );
    }
    res.status(200).type('text/plain').send(challenge);
  },

  receive: asyncHandler(async (req, res) => {
    const result = webhookService.processWebhook(
      req.rawBody,
      req.header('x-hub-signature-256'),
      req.body,
    );
    return ApiResponse.success(res, result, 'Webhook processed');
  }),

  listMessages: asyncHandler(async (req, res) => {
    const result = webhookService.listMessages(req.query as unknown as ListWebhookMessagesQuery);
    return ApiResponse.success(res, result, 'Inbound messages retrieved');
  }),
};
