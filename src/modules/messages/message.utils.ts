import type { SendMessageResponse } from '../../common/services/metaClient.js';
import { ApiError } from '../../common/utils/ApiError.js';
import { normalizePhone } from '../../common/utils/phone.js';

export const resolveRecipient = (to: string): string => normalizePhone(to);

export const buildBasePayload = (to: string): Record<string, unknown> => ({
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to,
});

export const extractSendResult = (
  response: SendMessageResponse,
  inputTo: string,
): { messageId: string; recipient: string; status: string } => ({
  messageId: response.messages?.[0]?.id ?? '',
  recipient: response.contacts?.[0]?.wa_id ?? inputTo,
  status: response.messages?.[0]?.status ?? 'sent',
});

export const assertNotAudioCaption = (type: string, caption?: string): void => {
  if (type === 'audio' && caption) {
    throw ApiError.badRequest('Audio messages cannot have a caption');
  }
};
