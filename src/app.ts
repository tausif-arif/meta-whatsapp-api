import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { authenticate, requireClient } from './common/middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware.js';
import { authRouter, clientRouter } from './modules/clients/index.js';
import { contactRouter } from './modules/contacts/contact.route.js';
import { healthController } from './modules/health/health.controller.js';
import { healthRouter } from './modules/health/health.route.js';
import { mediaRouter } from './modules/media/media.route.js';
import { messageRouter } from './modules/messages/message.route.js';
import { templateRouter } from './modules/templates/template.route.js';
import { webhookProtectedRouter, webhookRouter } from './modules/webhooks/webhook.route.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors());
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(pinoHttp({ logger }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Public routes
  app.get('/', healthController.check);
  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/auth', authRouter);

  // Client dashboard routes (bearer JWT session)
  app.use('/api/v1/clients/me', requireClient, clientRouter);

  // Authenticated routes (X-API-Key)
  app.use('/api/v1', authenticate);
  app.use('/api/v1/messages', messageRouter);
  app.use('/api/v1/templates', templateRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/contacts', contactRouter);
  app.use('/api/v1/webhooks', webhookProtectedRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
