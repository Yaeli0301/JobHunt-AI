/**
 * In-Memory Store (Fallback)
 * Provides in-memory storage when MongoDB is unavailable.
 * WARNING: This is for development/demo only - data is lost on server restart.
 */

import bcrypt from "bcrypt";

// In-memory stores
const users = new Map();
const analyses = new Map();
let userIdCounter = 1;
let analysisIdCounter = 1;

/**
 * Create a new user.
 */
export function createUser(userData) {
  const id = String(userIdCounter++);
  const user = {
    _id: id,
    email: userData.email.toLowerCase(),
    passwordHash: userData.passwordHash,
    role: userData.role || "candidate",
    profile: userData.profile || {},
    isActive: true,
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.set(id, user);
  return user;
}

/**
 * Find user by email.
 */
export function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return null;
}

/**
 * Find user by ID.
 */
export function findUserById(id) {
  return users.get(id) || null;
}

/**
 * Find user by refresh token hash (opaque refresh flow, in-memory mode).
 */
export function findUserByRefreshHash(hash) {
  if (!hash) return null;
  const now = Date.now();
  for (const user of users.values()) {
    if (
      user.refreshTokenHash === hash &&
      user.refreshTokenExpiresAt &&
      new Date(user.refreshTokenExpiresAt).getTime() > now
    ) {
      return user;
    }
  }
  return null;
}

/**
 * Update user.
 */
export function updateUser(id, updateData) {
  const user = users.get(id);
  if (!user) return null;
  
  const updated = { ...user, ...updateData, updatedAt: new Date().toISOString() };
  users.set(id, updated);
  return updated;
}

/**
 * Create analysis record.
 */
export function createAnalysis(analysisData) {
  const id = String(analysisIdCounter++);
  const analysis = {
    _id: id,
    userId: analysisData.userId,
    job: analysisData.job,
    profile: analysisData.profile,
    matchScore: analysisData.matchScore,
    matchedSkills: analysisData.matchedSkills,
    missingSkills: analysisData.missingSkills,
    strengths: analysisData.strengths,
    weaknesses: analysisData.weaknesses,
    messageToRecruiter: analysisData.messageToRecruiter,
    careerAdvice: analysisData.careerAdvice,
    recommendations: analysisData.recommendations,
    createdAt: new Date().toISOString(),
  };
  analyses.set(id, analysis);
  return analysis;
}

/**
 * Find analyses by user ID.
 */
export function findAnalysesByUserId(userId, options = {}) {
  const results = [];
  for (const analysis of analyses.values()) {
    if (analysis.userId === userId) {
      // Apply filters
      if (options.search) {
        const title = analysis.job?.title?.toLowerCase() || "";
        if (!title.includes(options.search.toLowerCase())) continue;
      }
      if (options.minScore !== undefined) {
        if (analysis.matchScore < options.minScore) continue;
      }
      results.push(analysis);
    }
  }
  
  // Sort
  const sortKey = options.sort || "date";
  results.sort((a, b) => {
    if (sortKey === "score") return b.matchScore - a.matchScore;
    if (sortKey === "score_asc") return a.matchScore - b.matchScore;
    if (sortKey === "date_asc") return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Limit
  if (options.limit) {
    return results.slice(0, options.limit);
  }
  return results;
}

/**
 * Find analysis by ID.
 */
export function findAnalysisById(id) {
  return analyses.get(id) || null;
}

/**
 * Compare password.
 */
export async function comparePassword(user, candidatePassword) {
  return bcrypt.compare(candidatePassword, user.passwordHash);
}

/**
 * Clear all data (for testing).
 */
export function clearAll() {
  users.clear();
  analyses.clear();
  userIdCounter = 1;
  analysisIdCounter = 1;
}

export default {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByRefreshHash,
  updateUser,
  createAnalysis,
  findAnalysesByUserId,
  findAnalysisById,
  comparePassword,
  clearAll,
};
