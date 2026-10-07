import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { templateService } from './template.service.js';
import type { ListTemplatesQuery } from './template.types.js';

export const templateController = {
  list: asyncHandler(async (req, res) => {
    const result = await templateService.list(req.query as unknown as ListTemplatesQuery);
    return ApiResponse.success(res, result, 'Templates retrieved');
  }),

  getById: asyncHandler(async (req, res) => {
    const { templateId } = req.params as { templateId: string };
    const template = await templateService.getById(templateId);
    return ApiResponse.success(res, template, 'Template retrieved');
  }),
};
