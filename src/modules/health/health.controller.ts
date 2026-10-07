import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiResponse } from '../../common/utils/ApiResponse.js';
import { pingDb } from '../../db/client.js';

export const healthController = {
  check: async (_req: Request, res: Response) => {
    const databaseConnected = await pingDb();

    return ApiResponse.success(res, {
      status: databaseConnected ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: databaseConnected ? 'connected' : 'down',
      meta: {
        graphVersion: env.META_GRAPH_VERSION,
        agentTimeoutMs: env.AGENT_TIMEOUT_MS,
      },
      authentication: 'api-key (database)',
    });
  },
};
