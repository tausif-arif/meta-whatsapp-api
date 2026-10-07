import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { templateController } from './template.controller.js';
import { getTemplateParamsSchema, listTemplatesQuerySchema } from './template.types.js';

export const templateRouter = Router();

templateRouter.get('/', validate(listTemplatesQuerySchema, 'query'), templateController.list);
templateRouter.get(
  '/:templateId',
  validate(getTemplateParamsSchema, 'params'),
  templateController.getById,
);
