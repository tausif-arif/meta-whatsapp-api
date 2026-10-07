import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(8).max(20).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  })
  .refine((value) => value.email || value.phone, {
    message: 'Provide either an email or a phone number',
  });

export const loginSchema = z.object({
  identity: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createApiKeySchema = z.object({
  label: z.string().trim().min(1).max(60).default('default'),
});

export const revokeApiKeyParamsSchema = z.object({ id: z.string().uuid() });

const dateParamSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid ISO date')
  .optional();

export const analyticsSummaryQuerySchema = z.object({
  from: dateParamSchema,
  to: dateParamSchema,
});

export const timeseriesQuerySchema = analyticsSummaryQuerySchema.extend({
  granularity: z.enum(['day', 'hour']).default('day'),
});

export const topContactsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  direction: z.enum(['inbound', 'outbound']).optional(),
  type: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type RevokeApiKeyParams = z.infer<typeof revokeApiKeyParamsSchema>;
export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;
export type TimeseriesQuery = z.infer<typeof timeseriesQuerySchema>;
export type TopContactsQuery = z.infer<typeof topContactsQuerySchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;