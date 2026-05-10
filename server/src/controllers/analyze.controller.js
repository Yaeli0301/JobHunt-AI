/**
 * Analyze API — HTTP layer only.
 */

import User from "../models/User.model.js";
import { isUsingMongoDB } from "../db/mongo.js";
import { runAnalyzeMatch, listAnalyzeHistory } from "../services/analyze.service.js";
import { generateCoverLetter } from "../services/coverLetter.service.js";
import { findActiveJobs } from "../repositories/job.repository.js";

export async function analyzeMatchHandler(req, res, next) {
  try {
    const payload = await runAnalyzeMatch(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }
    next(err);
  }
}

export async function analyzeHistoryHandler(req, res, next) {
  try {
    const limit = req.query.limit || 50;
    const rows = await listAnalyzeHistory(req.user.id, { limit });
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}

function profileFromUser(user) {
  if (!user) return null;
  return {
    skills: user.candidateProfile?.skills?.map((s) => s.name) || [],
    experienceYears: user.candidateProfile?.experienceYears || 0,
  };
}

/**
 * POST body: { job, profile? } — profile defaults from logged-in candidate.
 */
export async function coverLetterHandler(req, res, next) {
  try {
    let { job, profile } = req.body;
    if (!job?.title) {
      return res.status(400).json({
        success: false,
        error: "job with title is required.",
      });
    }
    if (!profile && isUsingMongoDB()) {
      const user = await User.findById(req.user.id).lean();
      profile = profileFromUser(user);
    }
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: "profile is required (or complete your candidate profile).",
      });
    }
    const coverLetter = await generateCoverLetter(job, profile);
    return res.status(200).json({
      success: true,
      data: { coverLetter },
    });
  } catch (err) {
    next(err);
  }
}

/** “Jobs you may like” — active listings, newest first. */
export async function recommendationsHandler(req, res, next) {
  try {
    if (!isUsingMongoDB()) {
      return res.status(200).json({
        success: true,
        data: { jobs: [] },
      });
    }
    const jobs = await findActiveJobs(10);
    return res.status(200).json({
      success: true,
      data: { jobs },
    });
  } catch (err) {
    next(err);
  }
}
