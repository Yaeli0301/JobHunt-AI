/**
 * Scoring Service
 * Thin orchestration wrapper around the core job matcher engine.
 */

import { calculateMatch } from "../core/jobMatcher.engine.js";

const SKILL_MAX_POINTS = 70;
const EXPERIENCE_MAX_POINTS = 30;

/**
 * Compute deterministic match between a job and a candidate profile.
 *
 * @param {object} job - { requiredSkills: string[], experienceYears: number }
 * @param {object} profile - { skills: string[], experienceYears: number }
 * @returns {object} { score, matchedSkills, missingSkills, skillScore, experienceScore }
 */
export async function computeScore(job, profile) {
  console.log("[ScoringService] Computing deterministic match score...");
  const result = calculateMatch(job, profile);
  
  // Calculate individual scores for breakdown
  const skillScore = calculateSkillComponent(job, profile);
  const experienceScore = calculateExperienceComponent(job, profile);
  
  console.log("[ScoringService] Score:", result.score, 
    "(skill:", skillScore, "/", SKILL_MAX_POINTS, 
    ", experience:", experienceScore, "/", EXPERIENCE_MAX_POINTS, ")");
  
  return {
    ...result,
    skillScore,
    experienceScore,
    totalScore: result.score,
  };
}

/**
 * Calculate skill component score (0-70)
 */
function calculateSkillComponent(job, profile) {
  const requiredSkills = job.requiredSkills || [];
  const candidateSkills = profile.skills || [];
  
  const requiredSet = new Set(requiredSkills.map(s => s.toLowerCase()));
  const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase()));
  
  let matched = 0;
  for (const skill of requiredSet) {
    if (candidateSet.has(skill)) matched++;
  }
  
  if (requiredSet.size === 0) return 0;
  const ratio = matched / requiredSet.size;
  return Math.round(ratio * SKILL_MAX_POINTS);
}

/**
 * Calculate experience component score (0-30)
 */
function calculateExperienceComponent(job, profile) {
  const jobYears = Number(job.experienceYears) || 0;
  const profileYears = Number(profile.experienceYears) || 0;
  
  if (jobYears === 0) return EXPERIENCE_MAX_POINTS;
  
  const ratio = profileYears / jobYears;
  
  if (ratio >= 1.5) return EXPERIENCE_MAX_POINTS;
  if (ratio >= 1.0) return 25;
  if (ratio >= 0.8) return 20;
  if (ratio >= 0.5) return 10;
  if (ratio > 0) return 5;
  return 0;
}

