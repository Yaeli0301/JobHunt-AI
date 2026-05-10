/**
 * Analysis Model (Mongoose)
 * Stores job-profile match analysis results.
 */

import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      requiredSkills: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
    },
    profile: {
      bio: { type: String, default: "" },
      skills: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
    },
    matchScore: { type: Number, required: true },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    messageToRecruiter: { type: String, default: "" },
    careerAdvice: { type: String, default: "" },
    recommendations: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
