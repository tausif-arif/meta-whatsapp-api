import { messageLogService } from '../../common/services/messageLog.service.js';
import { metaClient } from '../../common/services/metaClient.js';
import type {
  MarkReadInput,
  SendContactsInput,
  SendInteractiveInput,
  SendLocationInput,
  SendMediaInput,
  SendTemplateInput,
  SendTextInput,
  SendResult,
} from './message.types.js';
import {
  assertNotAudioCaption,
  buildBasePayload,
  extractSendResult,
  resolveRecipient,
} from './message.utils.js';

const logSend = async (
  messageType: string,
  peer: string,
  result: SendResult,
  payload: unknown,
): Promise<void> => {
  await messageLogService.recordOutbound({
    source: 'api',
    messageType,
    peer,
    metaMessageId: result.messageId || null,
    status: result.status,
    payload,
  });
};

export const messageService = {
  async sendText(input: SendTextInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: 'text',
      text: {
        body: input.text,
        ...(input.previewUrl !== undefined ? { preview_url: input.previewUrl } : {}),
      },
    });

    const result = extractSendResult(response, to);
    await logSend('text', to, result, input);
    return result;
  },

  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);

    let components = input.components;
    if (!components?.length && input.bodyParameters?.length) {
      components = [
        {
          type: 'body',
          parameters: input.bodyParameters.map((text) => ({ type: 'text', text })),
        },
      ];
    }

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.language },
        ...(components?.length ? { components } : {}),
      },
    });

    const result = extractSendResult(response, to);
    await logSend('template', to, result, input);
    return result;
  },

  async sendMedia(input: SendMediaInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);
    assertNotAudioCaption(input.type, input.caption);

    const media: Record<string, unknown> = {};
    if (input.link) media.link = input.link;
    if (input.mediaId) media.id = input.mediaId;
    if (input.caption && input.type !== 'audio') media.caption = input.caption;
    if (input.filename && input.type === 'document') media.filename = input.filename;

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: input.type,
      [input.type]: media,
    });

    const result = extractSendResult(response, to);
    await logSend(input.type, to, result, input);
    return result;
  },

  async sendInteractive(input: SendInteractiveInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: 'interactive',
      interactive: input.interactive,
    });

    const result = extractSendResult(response, to);
    await logSend('interactive', to, result, input);
    return result;
  },

  async sendLocation(input: SendLocationInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: 'location',
      location: input.location,
    });

    const result = extractSendResult(response, to);
    await logSend('location', to, result, input);
    return result;
  },

  async sendContacts(input: SendContactsInput): Promise<SendResult> {
    const to = resolveRecipient(input.to);

    const response = await metaClient.sendMessage({
      ...buildBasePayload(to),
      type: 'contacts',
      contacts: input.contacts,
    });

    const result = extractSendResult(response, to);
    await logSend('contacts', to, result, input);
    return result;
  },

  async markAsRead(input: MarkReadInput): Promise<{ messageId: string; status: string }> {
    await metaClient.markAsRead(input.messageId);
    return { messageId: input.messageId, status: 'read' };
  },
};
