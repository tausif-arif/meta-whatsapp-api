import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { requireTenantId } from '../../common/context/requestContext.js';
import { authService } from './auth.service.js';
import type { LoginInput, SignupInput } from './client.types.js';

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body as SignupInput);
    return ApiResponse.success(res, result, 'Account created');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body as LoginInput);
    return ApiResponse.success(res, result, 'Signed in');
  }),

  me: asyncHandler(async (req, res) => {
    const tenantId = requireTenantId();
    const result = await authService.me(tenantId, req.clientUserId as string);
    return ApiResponse.success(res, result);
  }),
};