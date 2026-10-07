export {};

declare global {
  namespace Express {
    interface Request {
      /** Raw request body captured for webhook signature verification. */
      rawBody?: Buffer;
      /** API key used to authenticate the request. */
      apiKey?: string;
    }
  }
}
