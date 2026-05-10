/**
 * Application persistence (MongoDB).
 */

import mongoose from "mongoose";
import Application from "../models/Application.model.js";
import Job from "../models/Job.model.js";
import { isUsingMongoDB } from "../db/mongo.js";

export async function findApplicationByJobAndCandidate(jobId, candidateId) {
  if (!isUsingMongoDB()) return null;
  return Application.findOne({ jobId, candidateId });
}

export async function saveApplication(data) {
  const doc = new Application(data);
  await doc.save();
  return doc;
}

export async function bumpJobApplicationCount(jobId) {
  if (!isUsingMongoDB()) return;
  await Job.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });
}

export async function listCandidateApplications(filter, { skip, limit }) {
  if (!isUsingMongoDB()) {
    return { total: 0, applications: [] };
  }
  const total = await Application.countDocuments(filter);
  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("jobId", "title location workType salaryRange")
    .lean();
  return { total, applications };
}

export async function getApplicationForParties(applicationId, userId) {
  if (!isUsingMongoDB()) return null;
  if (!mongoose.Types.ObjectId.isValid(applicationId)) return null;
  return Application.findOne({
    _id: applicationId,
    $or: [{ candidateId: userId }, { recruiterId: userId }],
  })
    .populate("jobId")
    .populate("candidateId", "email profile candidateProfile")
    .lean();
}
