import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../common/middleware/validate.middleware.js';
import { mediaController } from './media.controller.js';
import { getMediaParamsSchema, MAX_MEDIA_BYTES } from './media.types.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES, files: 1 },
});

export const mediaRouter = Router();

mediaRouter.post('/', upload.single('file'), mediaController.upload);
mediaRouter.get('/:mediaId', validate(getMediaParamsSchema, 'params'), mediaController.getMetadata);
mediaRouter.get(
  '/:mediaId/file',
  validate(getMediaParamsSchema, 'params'),
  mediaController.download,
);
