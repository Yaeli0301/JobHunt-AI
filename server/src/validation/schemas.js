/**
 * Zod schemas for API request validation
 */

import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(6).max(256),
  name: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  role: z.enum(["candidate", "recruiter"]).optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1).max(256),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(32).max(1024),
});

/** Logout: optional refresh in body; Bearer alone is valid (controller). */
export const logoutBodySchema = z
  .object({
    refreshToken: z.string().min(32).max(1024).optional(),
  })
  .strict();

export const analyzeMatchSchema = z
  .object({
    jobId: z.string().min(1).optional(),
    job: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => Boolean(v.jobId || v.job), {
    message: "Either jobId or job is required.",
  });

export const jobsListQuerySchema = z.object({
  owner: z.enum(["me"]).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.string().max(300).optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  experience: z.string().max(100).optional(),
  workType: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
});

export const analyzeHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const applicationsListQuerySchema = z.object({
  jobId: z.string().max(100).optional(),
  status: z
    .enum([
      "pending",
      "reviewing",
      "shortlisted",
      "rejected",
      "interview",
      "offer",
      "hired",
      "withdrawn",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const submitApplicationSchema = z.object({
  jobId: z.string().min(1).max(100),
  message: z.string().max(20000).optional(),
  analysisId: z.string().max(100).optional(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
    bio: z.string().max(20000).optional(),
    skills: z.array(z.union([z.string(), z.any()])).optional(),
    experienceYears: z.coerce.number().min(0).max(80).optional(),
    resumeText: z.string().max(500000).optional(),
    location: z.string().max(500).optional(),
    candidateProfile: z.any().optional(),
  })
  .strict();

export const generateBioSchema = z.object({
  profile: z.any(),
  targetRole: z.string().max(200).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(100000),
  requiredSkills: z.array(z.union([z.string(), z.any()])).optional(),
  experienceLevel: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  salaryRange: z.any().optional(),
  location: z.string().max(500).optional(),
  workType: z.string().optional(),
  jobType: z.string().optional(),
  category: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export const coverLetterSchema = z.object({
  job: z.object({ title: z.string().min(1) }).passthrough(),
  profile: z
    .object({
      skills: z.array(z.any()).optional(),
      experienceYears: z.coerce.number().optional(),
    })
    .passthrough()
    .optional(),
});
