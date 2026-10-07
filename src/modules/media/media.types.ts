import { z } from 'zod';

export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;

export const getMediaParamsSchema = z.object({
  mediaId: z.string().min(1),
});

export type GetMediaParams = z.infer<typeof getMediaParamsSchema>;

export interface MediaMetadata {
  mediaId: string;
  mimeType: string | null;
  fileSize: number | null;
  sha256: string | null;
  timestamp: string | null;
  url: string | null;
}
