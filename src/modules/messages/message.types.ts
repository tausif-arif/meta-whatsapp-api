import { z } from 'zod';

const toField = z
  .string()
  .trim()
  .min(7)
  .max(25)
  .describe('Recipient phone number in E.164 format (with or without "+")');

export const sendTextSchema = z.object({
  to: toField,
  text: z.string().min(1).max(4096),
  previewUrl: z.boolean().optional(),
});

export const sendTemplateSchema = z.object({
  to: toField,
  templateName: z.string().min(1).max(64),
  language: z.string().min(2).max(10),
  bodyParameters: z.array(z.string()).max(10).optional(),
  components: z
    .array(z.unknown())
    .optional()
    .describe('Raw Meta template components; overrides bodyParameters when present'),
});

export const sendMediaSchema = z
  .object({
    to: toField,
    type: z.enum(['image', 'video', 'audio', 'document']),
    link: z.url().optional(),
    mediaId: z.string().min(1).optional(),
    caption: z.string().max(1024).optional(),
    filename: z.string().max(256).optional(),
  })
  .refine((value) => Boolean(value.link || value.mediaId), {
    message: 'Either link (public URL) or mediaId (uploaded media id) is required',
    path: ['link'],
  });

export const sendInteractiveSchema = z.object({
  to: toField,
  interactive: z
    .record(z.string(), z.unknown())
    .refine((value) => typeof value.type === 'string', {
      message: 'interactive.type is required (button, list, flow, cta_url, ...)',
    }),
});

export const sendLocationSchema = z.object({
  to: toField,
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().max(256).optional(),
    address: z.string().max(256).optional(),
    url: z.string().url().max(2048).optional(),
  }),
});

export const sendContactsSchema = z.object({
  to: toField,
  contacts: z
    .array(
      z.object({
        name: z
          .record(z.string(), z.unknown())
          .refine((value) => typeof value.formatted_name === 'string' && value.formatted_name.length > 0, {
            message: 'name.formatted_name is required',
          }),
        phones: z
          .array(
            z.object({
              phone: z.string().min(7).max(25),
              type: z.string().max(20).optional(),
            }),
          )
          .max(5)
          .optional(),
        emails: z.array(z.object({ email: z.string().email() })).max(5).optional(),
        urls: z.array(z.object({ url: z.string().url() })).max(5).optional(),
      }),
    )
    .min(1)
    .max(10),
});

export const markReadSchema = z.object({
  messageId: z.string().min(1),
});

export type SendTextInput = z.infer<typeof sendTextSchema>;
export type SendTemplateInput = z.infer<typeof sendTemplateSchema>;
export type SendMediaInput = z.infer<typeof sendMediaSchema>;
export type SendInteractiveInput = z.infer<typeof sendInteractiveSchema>;
export type SendLocationInput = z.infer<typeof sendLocationSchema>;
export type SendContactsInput = z.infer<typeof sendContactsSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;

export interface SendResult {
  messageId: string;
  recipient: string;
  status: string;
}
