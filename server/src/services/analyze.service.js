/**
 * Analyze orchestration — match scoring + AI insights + persistence.
 */

import mongoose from "mongoose";
import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import Analysis from "../models/Analysis.model.js";
import { isUsingMongoDB } from "../db/mongo.js";
import { computeScore } from "./scoring.service.js";
import { generateInsights } from "./ai.service.js";
import { OPENAI_API_KEY } from "../config/env.js";
import { normalizeSkills as canonicalSkills } from "./skillsNormalizer.service.js";

function profileToCandidateSkills(user) {
  const raw =
    user?.candidateProfile?.skills?.map((s) => s.name) ||
    user?.profile?.skills ||
    [];
  return canonicalSkills(Array.isArray(raw) ? raw : []);
}

function educationScoreFromProfile(candidateProfile) {
  const edu = candidateProfile?.education;
  if (Array.isArray(edu) && edu.some((e) => e?.degree || e?.institution)) {
    return 78;
  }
  return 52;
}

function isFallbackInsights(insights) {
  const s = insights?.strengths?.[0] || "";
  return String(s).includes("Unable to analyze");
}

/**
 * Weighted score (0–100): skills 50%, experience 20%, education 10%, AI 20%.
 */
function combineScore(skillScore, experienceScore, educationMatch100, aiScore100) {
  const skillsPct = (skillScore / 70) * 100;
  const expPct = (experienceScore / 30) * 100;
  const combined =
    skillsPct * 0.5 +
    expPct * 0.2 +
    educationMatch100 * 0.1 +
    aiScore100 * 0.2;
  return Math.max(0, Math.min(100, Math.round(combined)));
}

/**
 * Run match analysis for a candidate user and a job.
 * @returns {Promise<object>} API payload (score, breakdown, missingSkills, strengths, aiUsed, job, analysisId?)
 */
export async function runAnalyzeMatch(userId, body) {
  const { jobId, job: jobPayload } = body || {};

  if (!jobId && !jobPayload) {
    const err = new Error("Job ID or job object is required.");
    err.statusCode = 400;
    throw err;
  }

  let user;
  if (isUsingMongoDB()) {
    user = await User.findById(userId).lean();
  }

  const candidateSkillsArr = user
    ? profileToCandidateSkills(user)
    : [];
  const experienceYears =
    user?.candidateProfile?.experienceYears ||
    user?.profile?.experienceYears ||
    0;

  const candidateProfile = {
    skills: candidateSkillsArr,
    experienceYears,
  };

  let jobData;
  if (jobPayload) {
    jobData = jobPayload;
  } else if (isUsingMongoDB()) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const err = new Error("Invalid job ID.");
      err.statusCode = 400;
      throw err;
    }
    jobData = await Job.findById(jobId).lean();
  }

  if (!jobData) {
    const err = new Error("Job not found.");
    err.statusCode = 404;
    throw err;
  }

  const requiredRaw = jobData.requiredSkills?.map((s) =>
    typeof s === "string" ? s : s.name
  ) || [];
  const requiredCanonical = canonicalSkills(requiredRaw);

  const jobInfo = {
    requiredSkills: requiredCanonical,
    experienceYears: jobData.experienceYears || 0,
  };

  const matchResult = await computeScore(jobInfo, {
    skills: candidateProfile.skills,
    experienceYears: candidateProfile.experienceYears,
  });

  const insights = await generateInsights(
    jobData,
    candidateProfile,
    matchResult.score,
    matchResult.matchedSkills,
    matchResult.missingSkills
  );

  const aiUsed = Boolean(OPENAI_API_KEY) && !isFallbackInsights(insights);
  const aiScore100 = aiUsed ? 88 : 65;
  const eduMatch = educationScoreFromProfile(user?.candidateProfile);

  const score = combineScore(
    matchResult.skillScore,
    matchResult.experienceScore,
    eduMatch,
    aiScore100
  );

  const breakdown = {
    skills: Math.round((matchResult.skillScore / 70) * 100),
    experience: Math.round((matchResult.experienceScore / 30) * 100),
    education: eduMatch,
  };

  const strengths =
    (insights.strengths && insights.strengths.length
      ? insights.strengths
      : matchResult.matchedSkills
    ).slice(0, 8);

  const missingSkills = (matchResult.missingSkills || []).map(String);
  const matchedSkills = (matchResult.matchedSkills || []).map(String);

  let analysisId;
  if (isUsingMongoDB()) {
    const doc = await Analysis.create({
      userId,
      job: {
        title: jobData.title,
        description: jobData.description || "",
        requiredSkills: requiredRaw,
        experienceYears: jobData.experienceYears || 0,
      },
      profile: {
        bio: user?.candidateProfile?.summary || "",
        skills: candidateProfile.skills,
        experienceYears: candidateProfile.experienceYears,
      },
      matchScore: score,
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses: Array.isArray(insights.weaknesses) ? insights.weaknesses : [],
      messageToRecruiter: insights.messageToRecruiter || "",
      careerAdvice:
        typeof insights.careerAdvice === "string"
          ? insights.careerAdvice
          : "",
      recommendations: [],
    });
    analysisId = doc._id;
  }

  return {
    score,
    breakdown,
    missingSkills,
    strengths: strengths.length ? strengths : matchedSkills,
    matchedSkills,
    aiUsed,
    job: {
      _id: jobData._id,
      title: jobData.title,
      recruiterInfo: {},
    },
    analysisId,
    careerAdvice:
      typeof insights.careerAdvice === "string"
        ? insights.careerAdvice
        : "",
    weaknesses: Array.isArray(insights.weaknesses) ? insights.weaknesses : [],
    messageToRecruiter: insights.messageToRecruiter || "",
  };
}

/**
 * List analysis history for user (newest first).
 */
export async function listAnalyzeHistory(userId, { limit = 50 } = {}) {
  if (!isUsingMongoDB()) {
    return [];
  }

  const rows = await Analysis.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  return rows.map((r) => ({
    id: r._id,
    matchScore: r.matchScore,
    createdAt: r.createdAt,
    job: r.job,
    strengths: r.strengths,
    weaknesses: r.weaknesses,
    missingSkills: r.missingSkills,
    matchedSkills: r.matchedSkills,
  }));
}
