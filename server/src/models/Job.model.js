/**
 * Job Model (Mongoose)
 * Stores job postings created by recruiters.
 */

import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: [{
      name: { type: String },
      level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "intermediate" },
      required: { type: Boolean, default: true },
    }],
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "principal", "any"],
      default: "any",
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    salaryRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: "USD" },
      period: { type: String, enum: ["hourly", "monthly", "yearly"], default: "yearly" },
    },
    location: {
      type: String,
      default: "",
    },
    workType: {
      type: String,
      enum: ["onsite", "remote", "hybrid", "any"],
      default: "any",
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "temporary"],
      default: "full-time",
    },
    category: {
      type: String,
      default: "",
    },
    requirements: [{
      type: String,
    }],
    responsibilities: [{
      type: String,
    }],
    benefits: [{
      type: String,
    }],
    // Status
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed"],
      default: "active",
    },
    // Stats
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
    // Expiration
    expiresAt: {
      type: Date,
      default: null,
    },
    // Remote
    isRemote: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
jobSchema.index({ title: "text", description: "text" });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ recruiterId: 1, status: 1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ workType: 1, experienceLevel: 1, status: 1 });
jobSchema.index({ "salaryRange.min": 1, "salaryRange.max": 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
