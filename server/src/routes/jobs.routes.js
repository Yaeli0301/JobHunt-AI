/**
 * Jobs Routes
 * Public job listing and details (no auth required)
 * Recruiter job management (auth required)
 */

import express from "express";
import { authenticate, requireRole, optionalAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import { createJobSchema, jobsListQuerySchema } from "../validation/schemas.js";
import { 
  listJobsHandler, 
  getJobHandler, 
  createJobHandler, 
  updateJobHandler, 
  deleteJobHandler,
  listMyJobsHandler,
  getApplicantsHandler
} from "../controllers/jobs.controller.js";

const router = express.Router();

// ----- PUBLIC ROUTES (No Auth Required) -----

/**
 * GET /jobs
 * List public jobs with filters
 * Query: ?role=&salaryMin=&salaryMax=&experience=&workType=&location=&page=&limit=
 */
router.get(
  "/",
  optionalAuth,
  validateQuery(jobsListQuerySchema),
  listJobsHandler
);

/**
 * GET /jobs/:id
 * Get job details (public)
 */
router.get("/:id", getJobHandler);

/**
 * POST /jobs
 * Create a new job posting
 */
router.post(
  "/",
  authenticate,
  requireRole("recruiter"),
  validateBody(createJobSchema),
  createJobHandler
);

/**
 * PUT /jobs/:id
 * Update job posting (owner only)
 */
router.put("/:id", authenticate, requireRole("recruiter"), updateJobHandler);

/**
 * DELETE /jobs/:id
 * Delete job posting (owner only)
 */
router.delete("/:id", authenticate, requireRole("recruiter"), deleteJobHandler);

/**
 * GET /jobs/:id/applicants
 * Get applicants for a job
 */
router.get("/:id/applicants", authenticate, requireRole("recruiter"), getApplicantsHandler);

export default router;
