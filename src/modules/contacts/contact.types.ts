import { z } from 'zod';

export const checkContactsSchema = z.object({
  numbers: z
    .array(z.string().trim().min(7).max(25))
    .min(1, 'Provide at least one phone number')
    .max(50, 'A maximum of 50 numbers can be checked per request'),
});

export type CheckContactsInput = z.infer<typeof checkContactsSchema>;

export interface ContactCheckResult {
  input: string;
  isOnWhatsApp: boolean;
  waId: string | null;
  status: string;
}
