/**
 * Job data access — DB queries only.
 */

import Job from "../models/Job.model.js";

/**
 * Count + paginate jobs matching filter (MongoDB).
 */
export async function findJobsPaginated(filter, { skip, limit, sort = { createdAt: -1 } }) {
  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter).sort(sort).skip(skip).limit(limit).lean();
  return { jobs, total };
}

/**
 * Active public listings (for recommendations).
 */
export async function findActiveJobs(limit = 8) {
  return Job.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title location workType salaryRange experienceLevel requiredSkills createdAt")
    .lean();
}
