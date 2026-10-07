import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { messageController } from './message.controller.js';
import {
  markReadSchema,
  sendContactsSchema,
  sendInteractiveSchema,
  sendLocationSchema,
  sendMediaSchema,
  sendTemplateSchema,
  sendTextSchema,
} from './message.types.js';

export const messageRouter = Router();

messageRouter.post('/text', validate(sendTextSchema), messageController.sendText);
messageRouter.post('/template', validate(sendTemplateSchema), messageController.sendTemplate);
messageRouter.post('/media', validate(sendMediaSchema), messageController.sendMedia);
messageRouter.post('/interactive', validate(sendInteractiveSchema), messageController.sendInteractive);
messageRouter.post('/location', validate(sendLocationSchema), messageController.sendLocation);
messageRouter.post('/contacts', validate(sendContactsSchema), messageController.sendContacts);
messageRouter.post('/read', validate(markReadSchema), messageController.markAsRead);
