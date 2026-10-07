import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { contactController } from './contact.controller.js';
import { checkContactsSchema } from './contact.types.js';

export const contactRouter = Router();

contactRouter.post('/check', validate(checkContactsSchema), contactController.check);
