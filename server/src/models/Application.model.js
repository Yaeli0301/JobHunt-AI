/**
 * Application Model (Mongoose)
 * Stores job applications from candidates to jobs.
 */

import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Application details
    status: {
      type: String,
      enum: ["pending", "reviewing", "shortlisted", "rejected", "interview", "offer", "hired", "withdrawn"],
      default: "pending",
    },
    message: {
      type: String,
      default: "",
    },
    autoMessage: {
      type: String,
      default: "",
    },
    // Match info at time of application
    matchScore: {
      type: Number,
      default: 0,
    },
    matchedSkills: [{
      type: String,
    }],
    missingSkills: [{
      type: String,
    }],
    // Resume/CV
    resumeText: {
      type: String,
      default: "",
    },
    // Timeline
    timeline: [{
      status: { type: String },
      note: { type: String },
      date: { type: Date, default: Date.now },
    }],
    // Notes from recruiter
    recruiterNotes: {
      type: String,
      default: "",
    },
    // Interview scheduling
    interviewDate: {
      type: Date,
      default: null,
    },
    interviewNotes: {
      type: String,
      default: "",
    },
    // Rating
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ candidateId: 1, status: 1 });
applicationSchema.index({ recruiterId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
