import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { messageService } from './message.service.js';
import type {
  MarkReadInput,
  SendContactsInput,
  SendInteractiveInput,
  SendLocationInput,
  SendMediaInput,
  SendTemplateInput,
  SendTextInput,
} from './message.types.js';

export const messageController = {
  sendText: asyncHandler(async (req, res) => {
    const result = await messageService.sendText(req.body as SendTextInput);
    return ApiResponse.success(res, result, 'Text message sent');
  }),

  sendTemplate: asyncHandler(async (req, res) => {
    const result = await messageService.sendTemplate(req.body as SendTemplateInput);
    return ApiResponse.success(res, result, 'Template message sent');
  }),

  sendMedia: asyncHandler(async (req, res) => {
    const result = await messageService.sendMedia(req.body as SendMediaInput);
    return ApiResponse.success(res, result, 'Media message sent');
  }),

  sendInteractive: asyncHandler(async (req, res) => {
    const result = await messageService.sendInteractive(req.body as SendInteractiveInput);
    return ApiResponse.success(res, result, 'Interactive message sent');
  }),

  sendLocation: asyncHandler(async (req, res) => {
    const result = await messageService.sendLocation(req.body as SendLocationInput);
    return ApiResponse.success(res, result, 'Location message sent');
  }),

  sendContacts: asyncHandler(async (req, res) => {
    const result = await messageService.sendContacts(req.body as SendContactsInput);
    return ApiResponse.success(res, result, 'Contact message sent');
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const result = await messageService.markAsRead(req.body as MarkReadInput);
    return ApiResponse.success(res, result, 'Message marked as read');
  }),
};
