/**
 * Jobs Controller
 * Handles job listings and management.
 */

import mongoose from "mongoose";
import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";
import User from "../models/User.model.js";
import { isUsingMongoDB } from "../db/mongo.js";
import { findJobsPaginated } from "../repositories/job.repository.js";

/**
 * GET /jobs
 * List public jobs with filters (no auth required)
 */
export async function listJobsHandler(req, res, next) {
  try {
    console.log("[Jobs] List jobs request:", req.query);

    if (req.query.owner === "me") {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: "Authentication required.",
        });
      }
      if (req.user.role !== "recruiter") {
        return res.status(403).json({
          success: false,
          error: "Access denied. Recruiter role required.",
        });
      }
      return listMyJobsHandler(req, res, next);
    }

    const {
      role,
      salaryMin,
      salaryMax,
      experience,
      workType,
      location,
      page = 1,
      limit = 20,
    } = req.query;

    const andParts = [{ status: "active" }];

    if (role) {
      andParts.push({ title: { $regex: role, $options: "i" } });
    }

    // "Min salary" = show jobs whose band reaches at least this (min or max >= filter)
    if (salaryMin) {
      const n = Number(salaryMin);
      if (!Number.isNaN(n)) {
        andParts.push({
          $or: [
            { "salaryRange.max": { $gte: n } },
            { "salaryRange.min": { $gte: n } },
          ],
        });
      }
    }

    if (experience && experience !== "any") {
      andParts.push({ experienceLevel: experience });
    }

    if (workType && workType !== "any") {
      andParts.push({ workType });
    }

    if (location) {
      andParts.push({ location: { $regex: location, $options: "i" } });
    }

    const filter = andParts.length === 1 ? andParts[0] : { $and: andParts };

    const skip = (Number(page) - 1) * Number(limit);

    let jobs;
    let total = 0;

    if (isUsingMongoDB()) {
      const pageResult = await findJobsPaginated(filter, {
        skip,
        limit: Number(limit),
      });
      total = pageResult.total;
      jobs = pageResult.jobs;

      const ids = [
        ...new Set(
          jobs
            .map((j) => j.recruiterId)
            .filter(Boolean)
            .map((id) => id.toString())
        ),
      ];
      if (ids.length > 0) {
        const recruiters = await User.find({
          _id: { $in: ids },
        }).lean();
        const byId = Object.fromEntries(
          recruiters.map((u) => [u._id.toString(), u])
        );
        jobs = jobs.map((job) => {
          const u = byId[job.recruiterId?.toString()];
          return {
            ...job,
            recruiterInfo: {
              name: u?.profile?.name || "",
              company: u?.recruiterProfile?.companyName || "",
              industry: u?.recruiterProfile?.industry || "",
            },
          };
        });
      }
    } else {
      // Memory store fallback - return demo jobs
      const DemoJobs = getDemoJobs();
      jobs = DemoJobs.filter((job) => job.status === "active");
      total = jobs.length;
      const skipMem = (Number(page) - 1) * Number(limit);
      jobs = jobs.slice(skipMem, skipMem + Number(limit));
    }

    return res.status(200).json({
      success: true,
      data: {
        jobs: jobs || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("[Jobs] List error:", error);
    next(error);
  }
}

/**
 * GET /jobs/:id
 * Get job details (public)
 */
export async function getJobHandler(req, res, next) {
  try {
    console.log("[Jobs] Get job:", req.params.id);

    const { id } = req.params;

    let job;

    if (isUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID.",
        });
      }

      job = await Job.findById(id).lean();

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found.",
        });
      }
    } else {
      // Memory store - find demo job
      const demoJobs = getDemoJobs();
      job = demoJobs.find((j) => j._id.toString() === id);
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found.",
      });
    }

    // Get recruiter info
    let recruiterInfo = {};
    
    if (isUsingMongoDB()) {
      const recruiter = await User.findById(job.recruiterId).lean();
      if (recruiter) {
        recruiterInfo = {
          name: recruiter.profile?.name || "",
          company: recruiter.recruiterProfile?.companyName || "",
          industry: recruiter.recruiterProfile?.industry || "",
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...job,
        recruiterInfo,
      },
    });
  } catch (error) {
    console.error("[Jobs] Get error:", error);
    next(error);
  }
}

/**
 * GET /recruiter/my-jobs
 * List recruiter's own jobs
 */
export async function listMyJobsHandler(req, res, next) {
  try {
    console.log("[Jobs] List my jobs:", req.user.id);

    const { status, page = 1, limit = 20 } = req.query;

    const filter = { recruiterId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    let jobs;
    let total;

    if (isUsingMongoDB()) {
      total = await Job.countDocuments(filter);
      jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();
    } else {
      total = 0;
      jobs = [];
    }

    return res.status(200).json({
      success: true,
      data: {
        jobs: jobs || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("[Jobs] List my jobs error:", error);
    next(error);
  }
}

/**
 * POST /jobs
 * Create a new job posting
 */
export async function createJobHandler(req, res, next) {
  try {
    console.log("[Jobs] Create job:", req.user.id);

    const {
      title,
      description,
      requiredSkills,
      experienceLevel,
      experienceYears,
      salaryRange,
      location,
      workType,
      jobType,
      category,
      requirements,
      responsibilities,
      benefits,
    } = req.body || {};

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Title and description are required.",
      });
    }

    const normalizedSkills = Array.isArray(requiredSkills)
      ? requiredSkills
          .map((s) =>
            typeof s === "string"
              ? { name: s.trim(), level: "intermediate", required: true }
              : { ...s, name: String(s.name || "").trim(), required: s.required !== false }
          )
          .filter((s) => s.name)
      : [];

    let job;

    if (isUsingMongoDB()) {
      job = new Job({
        recruiterId: req.user.id,
        title,
        description,
        requiredSkills: normalizedSkills,
        experienceLevel: experienceLevel || "any",
        experienceYears: experienceYears || 0,
        salaryRange: salaryRange || {},
        location: location || "",
        workType: workType || "any",
        jobType: jobType || "full-time",
        category: category || "",
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        benefits: benefits || [],
        status: "active",
      });

      await job.save();
    } else {
      // Memory store not supported for jobs
      return res.status(400).json({
        success: false,
        error: "Database not connected. Please set up MongoDB.",
      });
    }

    console.log("[Jobs] Job created:", job._id);

    return res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("[Jobs] Create error:", error);
    next(error);
  }
}

/**
 * PUT /jobs/:id
 * Update job posting
 */
export async function updateJobHandler(req, res, next) {
  try {
    console.log("[Jobs] Update job:", req.params.id);

    const { id } = req.params;
    const updates = req.body || {};

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.recruiterId;
    delete updates.createdAt;
    delete updates.updatedAt;

    let job;

    if (isUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID.",
        });
      }

      // Verify ownership
      job = await Job.findOne({ _id: id, recruiterId: req.user.id });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or access denied.",
        });
      }

      // Update fields
      Object.assign(job, updates);
      await job.save();
    } else {
      return res.status(400).json({
        success: false,
        error: "Database not connected.",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("[Jobs] Update error:", error);
    next(error);
  }
}

/**
 * DELETE /jobs/:id
 * Delete job posting
 */
export async function deleteJobHandler(req, res, next) {
  try {
    console.log("[Jobs] Delete job:", req.params.id);

    const { id } = req.params;

    let result;

    if (isUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID.",
        });
      }

      // Verify ownership and delete
      result = await Job.findOneAndDelete({
        _id: id,
        recruiterId: req.user.id,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Job not found or access denied.",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Database not connected.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("[Jobs] Delete error:", error);
    next(error);
  }
}

/**
 * GET /jobs/:id/applicants
 * Get applicants for a job
 */
export async function getApplicantsHandler(req, res, next) {
  try {
    console.log("[Jobs] Get applicants:", req.params.id);

    const { id } = req.params;
    const { status, minScore, sort: sortField = "matchScore" } = req.query;
    const allowedSort = ["matchScore", "createdAt"];
    const sortKey = allowedSort.includes(sortField) ? sortField : "matchScore";

    // Verify job ownership
    let job;

    if (isUsingMongoDB()) {
      job = await Job.findOne({ _id: id, recruiterId: req.user.id });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or access denied.",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Database not connected.",
      });
    }

    // Build filter
    const filter = { jobId: id };
    if (status) {
      filter.status = status;
    }
    if (minScore) {
      filter.matchScore = { $gte: Number(minScore) };
    }

    // Get applications
    let applications;

    if (isUsingMongoDB()) {
      applications = await Application.find(filter)
        .sort({ [sortKey]: -1 })
        .populate("candidateId", "email profile candidateProfile")
        .lean();
    } else {
      applications = [];
    }

    // Format response
    const applicants = applications.map((app) => ({
      _id: app._id,
      status: app.status,
      matchScore: app.matchScore,
      matchedSkills: app.matchedSkills,
      missingSkills: app.missingSkills,
      message: app.message,
      createdAt: app.createdAt,
      candidate: app.candidateId
        ? {
            _id: app.candidateId._id,
            email: app.candidateId.email,
            name: app.candidateId.profile?.name || "",
            title: app.candidateId.candidateProfile?.headline || "",
            skills: app.candidateId.candidateProfile?.skills || [],
            experienceYears: app.candidateId.candidateProfile?.experienceYears || 0,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        job: {
          _id: job._id,
          title: job.title,
          applications: job.applications,
        },
        applicants,
        total: applicants.length,
      },
    });
  } catch (error) {
    console.error("[Jobs] Get applicants error:", error);
    next(error);
  }
}

/**
 * Demo jobs for memory store
 */
function getDemoJobs() {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      recruiterId: new mongoose.Types.ObjectId(),
      recruiterInfo: {
        name: "Demo Recruiting",
        company: "TechCorp",
        industry: "Software",
      },
      title: "Senior React Developer",
      description: "We are looking for an experienced React developer to join our team. You will work on building scalable web applications using modern technologies.",
      requiredSkills: [
        { name: "React", level: "advanced", required: true },
        { name: "JavaScript", level: "advanced", required: true },
        { name: "TypeScript", level: "intermediate", required: false },
        { name: "Node.js", level: "intermediate", required: false },
      ],
      experienceLevel: "senior",
      experienceYears: 3,
      salaryRange: { min: 120000, max: 160000, currency: "USD", period: "yearly" },
      location: "San Francisco, CA",
      workType: "remote",
      jobType: "full-time",
      category: "Software Engineering",
      status: "active",
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      recruiterId: new mongoose.Types.ObjectId(),
      recruiterInfo: {
        name: "Demo Recruiting",
        company: "StackWorks",
        industry: "Software",
      },
      title: "Full Stack Engineer",
      description: "Join our dynamic team as a Full Stack Engineer. You'll work on both frontend and backend technologies to build innovative products.",
      requiredSkills: [
        { name: "JavaScript", level: "advanced", required: true },
        { name: "Node.js", level: "advanced", required: true },
        { name: "React", level: "intermediate", required: true },
        { name: "MongoDB", level: "intermediate", required: false },
      ],
      experienceLevel: "mid",
      experienceYears: 2,
      salaryRange: { min: 90000, max: 130000, currency: "USD", period: "yearly" },
      location: "New York, NY",
      workType: "hybrid",
      jobType: "full-time",
      category: "Software Engineering",
      status: "active",
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      recruiterId: new mongoose.Types.ObjectId(),
      recruiterInfo: {
        name: "Design Lead",
        company: "Creative Labs",
        industry: "Design",
      },
      title: "UX Designer",
      description: "We're seeking a talented UX Designer to create intuitive and beautiful user experiences for our products.",
      requiredSkills: [
        { name: "Figma", level: "advanced", required: true },
        { name: "UI Design", level: "advanced", required: true },
        { name: "User Research", level: "intermediate", required: true },
        { name: "Prototyping", level: "intermediate", required: false },
      ],
      experienceLevel: "mid",
      experienceYears: 2,
      salaryRange: { min: 80000, max: 120000, currency: "USD", period: "yearly" },
      location: "Austin, TX",
      workType: "onsite",
      jobType: "full-time",
      category: "Design",
      status: "active",
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      recruiterId: new mongoose.Types.ObjectId(),
      recruiterInfo: {
        name: "Data Hiring",
        company: "InsightAI",
        industry: "Data",
      },
      title: "Python Data Scientist",
      description: "Looking for a Data Scientist to analyze data and build machine learning models. You'll work with large datasets to derive insights.",
      requiredSkills: [
        { name: "Python", level: "advanced", required: true },
        { name: "Machine Learning", level: "advanced", required: true },
        { name: "SQL", level: "intermediate", required: true },
        { name: "TensorFlow", level: "intermediate", required: false },
      ],
      experienceLevel: "senior",
      experienceYears: 4,
      salaryRange: { min: 130000, max: 180000, currency: "USD", period: "yearly" },
      location: "Seattle, WA",
      workType: "remote",
      jobType: "full-time",
      category: "Data Science",
      status: "active",
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      recruiterId: new mongoose.Types.ObjectId(),
      recruiterInfo: {
        name: "Infra Team",
        company: "CloudScale",
        industry: "Infrastructure",
      },
      title: "DevOps Engineer",
      description: "Join our infrastructure team to manage cloud deployments and CI/CD pipelines. Experience with AWS and Kubernetes required.",
      requiredSkills: [
        { name: "AWS", level: "advanced", required: true },
        { name: "Kubernetes", level: "advanced", required: true },
        { name: "Docker", level: "advanced", required: true },
        { name: "Terraform", level: "intermediate", required: false },
      ],
      experienceLevel: "senior",
      experienceYears: 4,
      salaryRange: { min: 140000, max: 190000, currency: "USD", period: "yearly" },
      location: "Denver, CO",
      workType: "hybrid",
      jobType: "full-time",
      category: "DevOps",
      status: "active",
      createdAt: new Date(),
    },
  ];
}
