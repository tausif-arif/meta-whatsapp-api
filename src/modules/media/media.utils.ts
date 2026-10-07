import { ApiError } from '../../common/utils/ApiError.js';
import type { MediaObject } from '../../common/services/metaClient.js';
import type { MediaMetadata } from './media.types.js';

const ALLOWED_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];

export const assertAllowedMime = (mimeType: string): void => {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  const allowed =
    ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    ALLOWED_TYPES.includes(normalized);

  if (!allowed) {
    throw ApiError.badRequest(
      `Unsupported media type "${mimeType}". Allowed: images, video, audio, PDF and plain text.`,
    );
  }
};

export const toMediaMetadata = (raw: MediaObject): MediaMetadata => ({
  mediaId: raw.id,
  mimeType: raw.mime_type ?? null,
  fileSize: raw.file_size ?? null,
  sha256: raw.sha256 ?? null,
  timestamp: raw.timestamp ?? null,
  url: raw.url ?? null,
});
