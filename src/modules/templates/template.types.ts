import { z } from 'zod';

export const listTemplatesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().min(1).optional(),
  after: z.string().min(1).optional(),
});

export const getTemplateParamsSchema = z.object({
  templateId: z.string().min(1),
});

export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;

export interface TemplateSummary {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  subCategory: string;
  components: unknown[];
}
