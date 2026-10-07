import { normalizePhone } from '../../common/utils/phone.js';
import type { ContactsCheckResponse } from '../../common/services/metaClient.js';
import type { ContactCheckResult } from './contact.types.js';

export const normalizeNumbers = (numbers: string[]): string[] => [
  ...new Set(numbers.map((number) => normalizePhone(number))),
];

export const toContactResults = (response: ContactsCheckResponse): ContactCheckResult[] =>
  (response.contacts ?? []).map((contact) => {
    const status = contact.wa_status ?? contact.status ?? 'unknown';
    return {
      input: contact.input,
      isOnWhatsApp: status === 'valid',
      waId: contact.wa_id ?? null,
      status,
    };
  });
