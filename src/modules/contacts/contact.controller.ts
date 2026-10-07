import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { contactService } from './contact.service.js';
import type { CheckContactsInput } from './contact.types.js';

export const contactController = {
  check: asyncHandler(async (req, res) => {
    const results = await contactService.check(req.body as CheckContactsInput);
    return ApiResponse.success(res, { results }, 'Contact check completed');
  }),
};
