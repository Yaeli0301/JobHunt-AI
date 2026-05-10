/**
 * Apply Controller
 * Job match analysis and application submission
 */

import mongoose from "mongoose";
import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import { isUsingMongoDB } from "../db/mongo.js";
import {
  findApplicationByJobAndCandidate,
  saveApplication,
  bumpJobApplicationCount,
  listCandidateApplications,
  getApplicationForParties,
} from "../repositories/application.repository.js";
import { computeScore } from "../services/scoring.service.js";
import { generateInsights } from "../services/ai.service.js";
// import { generateAutoMessage } from "../services/coverLetter.service.js";
const generateAutoMessage = (job, profile) => {
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const top = skills.slice(0, 3).join(", ");
  const years = profile.experienceYears ?? 0;
  return `Hi, I'm interested in the ${job.title} position. I have ${years}+ years of experience${top ? ` and skills in ${top}` : ""}. Looking forward to discussing how I can contribute!`;
};

/**
 * POST /apply/match
 * Analyze match between user profile and job
 */
export async function matchHandler(req, res, next) {
  try {
    console.log("[Apply] Match request:", req.user.id);

    const { jobId, job } = req.body || {};

    if (!jobId && !job) {
      return res.status(400).json({
        success: false,
        error: "Job ID or job object is required.",
      });
    }

    // Get user profile
    let user;
    let candidateProfile = {};

    if (isUsingMongoDB()) {
      user = await User.findById(req.user.id).lean();
    }

    if (user) {
      candidateProfile = {
        skills: user.candidateProfile?.skills?.map((s) => s.name) || user.profile?.skills || [],
        experienceYears: user.candidateProfile?.experienceYears || user.profile?.experienceYears || 0,
      };
    }

    // Get job data
    let jobData;

    if (job) {
      // Direct job object provided
      jobData = job;
    } else if (isUsingMongoDB()) {
      // Fetch from database
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID.",
        });
      }

      jobData = await Job.findById(jobId).lean();
    }

    if (!jobData) {
      return res.status(404).json({
        success: false,
        error: "Job not found.",
      });
    }

    // Compute match score
    const requiredSkills = jobData.requiredSkills?.map((s) => s.name) || [];
    const jobInfo = {
      requiredSkills,
      experienceYears: jobData.experienceYears || 0,
    };

    const matchResult = await computeScore(jobInfo, candidateProfile);

    // Generate AI insights
    const insights = await generateInsights(
      jobData,
      candidateProfile,
      matchResult.score,
      matchResult.matchedSkills,
      matchResult.missingSkills
    );

    // Format response
    const response = {
      job: {
        _id: jobData._id,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        workType: jobData.workType,
        salaryRange: jobData.salaryRange,
        requiredSkills: jobData.requiredSkills,
        experienceLevel: jobData.experienceLevel,
        experienceYears: jobData.experienceYears,
      },
      match: {
        score: matchResult.score,
        skillScore: matchResult.skillScore,
        experienceScore: matchResult.experienceScore,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
      },
      insights: {
        strengths: insights.strengths || [],
        weaknesses: insights.weaknesses || [],
        summary: insights.summary,
        careerAdvice: insights.careerAdvice || [],
      },
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[Apply] Match error:", error);
    next(error);
  }
}

/**
 * POST /apply
 * Submit application to a job
 */
export async function applyHandler(req, res, next) {
  try {
    console.log("[Apply] Application request:", req.user.id);

    const { jobId, message } = req.body || {};

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "Job ID is required.",
      });
    }

    // Verify job exists
    let job;

    if (isUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID.",
        });
      }

      job = await Job.findById(jobId).lean();
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found.",
      });
    }

    // Get user profile
    let user;
    let candidateProfile = {};
    let resumeText = "";

    if (isUsingMongoDB()) {
      user = await User.findById(req.user.id).lean();
    }

    if (user) {
      candidateProfile = {
        skills: user.candidateProfile?.skills?.map((s) => s.name) || user.profile?.skills || [],
        experienceYears: user.candidateProfile?.experienceYears || user.profile?.experienceYears || 0,
        headline: user.candidateProfile?.headline || "",
      };
      resumeText = user.candidateProfile?.resumeText || user.profile?.resumeText || "";
    }

    // Compute match score
    const requiredSkills = job.requiredSkills?.map((s) => s.name) || [];
    const jobInfo = {
      requiredSkills,
      experienceYears: job.experienceYears || 0,
    };

    const matchResult = await computeScore(jobInfo, candidateProfile);

    // Generate auto message if not provided
    const autoMessage = message || generateAutoMessage(job, candidateProfile);

    // Check for existing application
    let existingApp;

    if (isUsingMongoDB()) {
      existingApp = await findApplicationByJobAndCandidate(jobId, req.user.id);
    }

    if (existingApp) {
      return res.status(409).json({
        success: false,
        error: "You have already applied to this job.",
      });
    }

    // Create application
    let application;

    if (isUsingMongoDB()) {
      application = await saveApplication({
        jobId,
        candidateId: req.user.id,
        recruiterId: job.recruiterId,
        status: "pending",
        message: autoMessage,
        matchScore: matchResult.score,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        resumeText,
      });

      await bumpJobApplicationCount(jobId);
    } else {
      return res.status(400).json({
        success: false,
        error: "Database not connected. Please set up MongoDB.",
      });
    }

    console.log("[Apply] Application created:", application._id);

    return res.status(201).json({
      success: true,
      data: {
        application: {
          _id: application._id,
          jobId: application.jobId,
          status: application.status,
          matchScore: application.matchScore,
          message: application.message,
          createdAt: application.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("[Apply] Application error:", error);
    next(error);
  }
}

/**
 * GET /apply
 * Get my applications
 */
export async function myApplicationsHandler(req, res, next) {
  try {
    console.log("[Apply] My applications:", req.user.id);

    const { jobId, status, page = 1, limit = 20 } = req.query;

    const filter = { candidateId: req.user.id };

    if (jobId) {
      filter.jobId = jobId;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    let applications;
    let total;

    if (isUsingMongoDB()) {
      const result = await listCandidateApplications(filter, {
        skip,
        limit: Number(limit),
      });
      total = result.total;
      applications = result.applications;
    } else {
      total = 0;
      applications = [];
    }

    // Format response
    const formatted = applications.map((app) => ({
      _id: app._id,
      status: app.status,
      matchScore: app.matchScore,
      matchedSkills: app.matchedSkills,
      missingSkills: app.missingSkills,
      message: app.message,
      createdAt: app.createdAt,
      job: app.jobId
        ? {
            _id: app.jobId._id,
            title: app.jobId.title,
            location: app.jobId.location,
            workType: app.jobId.workType,
            salaryRange: app.jobId.salaryRange,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        applications: formatted,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("[Apply] My applications error:", error);
    next(error);
  }
}

/**
 * GET /apply/:id
 * Get specific application details
 */
export async function getApplicationHandler(req, res, next) {
  try {
    console.log("[Apply] Get application:", req.params.id);

    const { id } = req.params;

    let application;

    if (isUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid application ID.",
        });
      }

      application = await getApplicationForParties(id, req.user.id);
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("[Apply] Get application error:", error);
    next(error);
  }
}
