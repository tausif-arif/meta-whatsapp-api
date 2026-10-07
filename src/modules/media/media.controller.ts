import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/ApiError.js';
import { mediaService } from './media.service.js';

export const mediaController = {
  upload: asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('Missing file. Upload the file in the "file" form field.');
    }
    const result = await mediaService.upload(file);
    return ApiResponse.created(res, result, 'Media uploaded to WhatsApp');
  }),

  getMetadata: asyncHandler(async (req, res) => {
    const { mediaId } = req.params as { mediaId: string };
    const metadata = await mediaService.getMetadata(mediaId);
    return ApiResponse.success(res, metadata, 'Media metadata retrieved');
  }),

  download: asyncHandler(async (req, res) => {
    const { mediaId } = req.params as { mediaId: string };
    const { stream, contentType } = await mediaService.download(mediaId);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    stream.on('error', () => {
      if (!res.headersSent) res.status(502);
      res.end();
    });
    stream.pipe(res);
    await new Promise<void>((resolve) => res.on('finish', resolve));
  }),
};
