export {};

declare global {
  namespace Express {
    interface Request {
      /** Raw request body captured for webhook signature verification. */
      rawBody?: Buffer;
      /** API key used to authenticate the request. */
      apiKey?: string;
      /** Client user id from a dashboard session JWT. */
      clientUserId?: string;
      /** Tenant id injected by authentication (API key or session). */
      tenantId?: string;
    }
  }
}
