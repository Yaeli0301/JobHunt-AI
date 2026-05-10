/**
 * User Model (Mongoose)
 * Stores user accounts with hashed passwords and role-based profile data.
 * Supports both Candidates and Recruiters.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ----- Sub-schemas -----

// Experience entry for candidates
const experienceSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  company: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
});

// Education entry for candidates
const educationSchema = new mongoose.Schema({
  degree: { type: String, default: "" },
  institution: { type: String, default: "" },
  year: { type: String, default: "" },
  field: { type: String, default: "" },
});

// Project entry for candidates
const projectSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  link: { type: String, default: "" },
  technologies: [{ type: String }],
});

// Skill entry with proficiency
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "intermediate" },
  category: { type: String, enum: ["core", "secondary", "tools"], default: "core" },
});

// Candidate profile sub-schema
const candidateProfileSchema = new mongoose.Schema({
  headline: { type: String, default: "" },
  summary: { type: String, default: "" },
  summaryShort: { type: String, default: "" },
  summaryMedium: { type: String, default: "" },
  summaryDetailed: { type: String, default: "" },
  skills: [skillSchema],
  experienceYears: { type: Number, default: 0 },
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  resumeText: { type: String, default: "" },
  detectedRole: { type: String, default: "" },
  summaryLevel: { type: String, enum: ["short", "medium", "detailed"], default: "medium" },
  location: { type: String, default: "" },
  locationPreference: { type: String, default: "" },
  salaryExpectation: { type: Number, default: null },
  workType: { type: String, enum: ["onsite", "remote", "hybrid", "any"], default: "any" },
}, { _id: false });

// Recruiter profile sub-schema
const recruiterProfileSchema = new mongoose.Schema({
  companyName: { type: String, default: "" },
  companyLogo: { type: String, default: "" },
  industry: { type: String, default: "" },
  companySize: { type: String, enum: ["startup", "small", "medium", "large", "enterprise"], default: "medium" },
  companyDescription: { type: String, default: "" },
  website: { type: String, default: "" },
  linkedIn: { type: String, default: "" },
  hiringLocations: [{ type: String }],
}, { _id: false });

// Main user schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter"],
      default: "candidate",
    },
    // Candidate-specific profile
    candidateProfile: {
      type: candidateProfileSchema,
      default: () => ({}),
    },
    // Recruiter-specific profile
    recruiterProfile: {
      type: recruiterProfileSchema,
      default: () => ({}),
    },
    // Legacy profile field (for backward compatibility)
    profile: {
      name: { type: String, default: "" },
      title: { type: String, default: "" },
      bio: { type: String, default: "" },
      skills: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
      resumeText: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Onboarding status
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
    /** SHA-256 hash of opaque refresh token; raw token is never stored. */
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook to hash password
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    return next();
  }
  try {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Transform output to remove sensitive fields
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.refreshTokenExpiresAt;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
