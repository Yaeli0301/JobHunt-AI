/**
 * /api/v1/analyze
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { analyzeLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  analyzeMatchSchema,
  coverLetterSchema,
  analyzeHistoryQuerySchema,
} from "../validation/schemas.js";
import {
  analyzeMatchHandler,
  analyzeHistoryHandler,
  coverLetterHandler,
  recommendationsHandler,
} from "../controllers/analyze.controller.js";

const router = Router();

router.get("/recommendations", authenticate, recommendationsHandler);
router.post(
  "/cover-letter",
  analyzeLimiter,
  authenticate,
  validateBody(coverLetterSchema),
  coverLetterHandler
);
router.post(
  "/match",
  analyzeLimiter,
  authenticate,
  validateBody(analyzeMatchSchema),
  analyzeMatchHandler
);
router.get(
  "/history",
  authenticate,
  validateQuery(analyzeHistoryQuerySchema),
  analyzeHistoryHandler
);

export default router;
