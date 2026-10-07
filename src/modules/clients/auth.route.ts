import { Router } from 'express';
import { validate } from '../../common/middleware/validate.middleware.js';
import { loginSchema, signupSchema } from './client.types.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), authController.signup);
authRouter.post('/login', validate(loginSchema), authController.login);