import { metaClient } from '../../common/services/metaClient.js';
import { normalizeNumbers, toContactResults } from './contact.utils.js';
import type { CheckContactsInput, ContactCheckResult } from './contact.types.js';

export const contactService = {
  async check(input: CheckContactsInput): Promise<ContactCheckResult[]> {
    const numbers = normalizeNumbers(input.numbers);
    const response = await metaClient.checkContacts(numbers);
    return toContactResults(response);
  },
};
