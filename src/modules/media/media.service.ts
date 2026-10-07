import type { Readable } from 'node:stream';
import { metaClient } from '../../common/services/metaClient.js';
import { ApiError } from '../../common/utils/ApiError.js';
import { assertAllowedMime, toMediaMetadata } from './media.utils.js';
import type { MediaMetadata } from './media.types.js';

export const mediaService = {
  async upload(file: Express.Multer.File): Promise<{
    mediaId: string;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing or empty file. Send the file in the "file" form field.');
    }
    assertAllowedMime(file.mimetype);

    const { id } = await metaClient.uploadMedia({
      buffer: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname || 'file',
    });

    return {
      mediaId: id,
      fileName: file.originalname || 'file',
      mimeType: file.mimetype,
      size: file.buffer.length,
    };
  },

  async getMetadata(mediaId: string): Promise<MediaMetadata> {
    const raw = await metaClient.getMedia(mediaId);
    return toMediaMetadata(raw);
  },

  async download(mediaId: string): Promise<{ stream: Readable; contentType: string }> {
    const metadata = await this.getMetadata(mediaId);
    if (!metadata.url) {
      throw ApiError.notFound('Media file URL is not available for this media id');
    }
    const { stream, contentType } = await metaClient.getMediaStream(metadata.url);
    return { stream, contentType };
  },
};
