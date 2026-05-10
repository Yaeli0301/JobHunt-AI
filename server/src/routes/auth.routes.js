/**
 * Auth Routes
 * POST /auth/register
 * POST /auth/login
 */

import { Router } from "express";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenBodySchema,
  logoutBodySchema,
} from "../validation/schemas.js";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, validateBody(registerSchema), registerHandler);
router.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
router.post("/refresh", authLimiter, validateBody(refreshTokenBodySchema), refreshHandler);
router.post("/logout", validateBody(logoutBodySchema), logoutHandler);

export default router;
