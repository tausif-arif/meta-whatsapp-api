import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';

export interface ClientJwtPayload {
  sub: string;
  tenantId: string;
}

export const signClientToken = (payload: ClientJwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);

export const verifyClientToken = (token: string): ClientJwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as ClientJwtPayload;