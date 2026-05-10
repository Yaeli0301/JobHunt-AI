/**
 * User Routes
 * GET /user/profile (protected)
 * PUT /user/profile (protected)
 * POST /user/upload-cv (protected)
 */

import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { updateProfileSchema, generateBioSchema } from "../validation/schemas.js";
import {
  getProfileHandler,
  updateProfileHandler,
  uploadCVHandler,
  generateBioHandler,
} from "../controllers/user.controller.js";

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx"];
    const ext = file.originalname.toLowerCase().split(".").pop();
    if (allowedTypes.includes("." + ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed."));
    }
  },
});

const router = Router();

router.get("/profile", authenticate, getProfileHandler);
router.put(
  "/profile",
  authenticate,
  validateBody(updateProfileSchema),
  updateProfileHandler
);
router.post("/upload-cv", authenticate, uploadLimiter, upload.single("file"), uploadCVHandler);
router.post(
  "/generate-bio",
  authenticate,
  validateBody(generateBioSchema),
  generateBioHandler
);

export default router;
