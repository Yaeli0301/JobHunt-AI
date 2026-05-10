/**
 * Job Matcher Engine
 * Pure, deterministic rules-based scoring.
 * NO AI — completely predictable and testable.
 *
 * Input shape:
 *   job:     { requiredSkills: string[], experienceYears: number }
 *   profile: { skills: string[], experienceYears: number }
 *
 * Output shape:
 *   { score: number, matchedSkills: string[], missingSkills: string[] }
 */

import { getIntersection, getDifference, normalizeSkills } from "../utils/text.utils.js";

const SKILL_OVERLAP_MAX_POINTS = 70;
const EXPERIENCE_MAX_POINTS = 30;

/**
 * Calculate the core match score between a job and a candidate profile.
 */
export function calculateMatch(job, profile) {
  if (!job || !profile) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const requiredSkills = normalizeSkills(job.requiredSkills);
  const candidateSkills = normalizeSkills(profile.skills);

  const matchedSkills = getIntersection(requiredSkills, candidateSkills);
  const missingSkills = getDifference(requiredSkills, candidateSkills);

  // ----- Skill Overlap Ratio (0–70 points) -----
  const skillScore = calculateSkillScore(requiredSkills, matchedSkills);

  // ----- Experience Match (0–30 points) -----
  const experienceScore = calculateExperienceScore(
    job.experienceYears,
    profile.experienceYears
  );

  const totalScore = Math.round(skillScore + experienceScore);

  return {
    score: totalScore,
    matchedSkills,
    missingSkills,
  };
}

function calculateSkillScore(requiredSkills, matchedSkills) {
  const requiredCount = requiredSkills.length;
  if (requiredCount === 0) return 0;

  const matchedCount = matchedSkills.length;
  const ratio = matchedCount / requiredCount;

  return Math.min(ratio * SKILL_OVERLAP_MAX_POINTS, SKILL_OVERLAP_MAX_POINTS);
}

function calculateExperienceScore(jobYears, profileYears) {
  const required = Number(jobYears) || 0;
  const actual = Number(profileYears) || 0;

  if (required === 0) return EXPERIENCE_MAX_POINTS;

  const ratio = actual / required;

  if (ratio >= 1.5) return EXPERIENCE_MAX_POINTS;      // 150%+
  if (ratio >= 1.0) return 25;                         // 100–149%
  if (ratio >= 0.8) return 20;                         // 80–99%
  if (ratio >= 0.5) return 10;                         // 50–79%
  if (ratio > 0)   return 5;                           // 1–49%
  return 0;                                            // 0%
}

