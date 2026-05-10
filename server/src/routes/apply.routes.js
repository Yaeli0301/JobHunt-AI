/**
 * Apply Routes
 * Job match analysis and application submission
 */

import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  analyzeMatchSchema,
  submitApplicationSchema,
  applicationsListQuerySchema,
} from "../validation/schemas.js";
import { 
  matchHandler, 
  applyHandler, 
  myApplicationsHandler,
  getApplicationHandler
} from "../controllers/apply.controller.js";

const router = express.Router();

/**
 * POST /apply/match
 * Analyze match between user profile and job
 * Body: { jobId } or { job: {...} }
 */
router.post(
  "/match",
  authenticate,
  validateBody(analyzeMatchSchema),
  matchHandler
);

/**
 * POST /apply
 * Submit application to a job
 * Body: { jobId, message? }
 */
router.post(
  "/",
  authenticate,
  validateBody(submitApplicationSchema),
  applyHandler
);

/**
 * GET /apply
 * Get my applications
 * Query: ?jobId=&status=&page=&limit=
 */
router.get(
  "/",
  authenticate,
  validateQuery(applicationsListQuerySchema),
  myApplicationsHandler
);

/**
 * GET /apply/:id
 * Get specific application details
 */
router.get("/:id", authenticate, getApplicationHandler);

export default router;
