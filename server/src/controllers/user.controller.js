/**
 * User Controller
 * Handles profile retrieval and updates, CV uploads.
 * Supports both MongoDB and in-memory storage.
 */

import { parseCV, updateProfileWithCV } from "../services/cvParser.service.js";
import { generateBio } from "../services/ai.service.js";
import { normalizeSkills } from "../services/skillsNormalizer.service.js";
import { isUsingMongoDB, findUserById, updateUser } from "../db/mongo.js";
import User from "../models/User.model.js";

/**
 * GET /user/profile
 * Get current user's profile.
 */
export async function getProfileHandler(req, res, next) {
  try {
    console.log("[User] Get profile request:", req.user?.id);

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    let user;
    
    if (isUsingMongoDB()) {
      user = await User.findById(req.user.id).lean();
    } else {
      user = findUserById(req.user.id);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("[User] Get profile error:", error);
    next(error);
  }
}

/**
 * PUT /user/profile
 * Update current user's profile.
 */
export async function updateProfileHandler(req, res, next) {
  try {
    console.log("[User] Update profile request:", req.user?.id);

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const {
      name,
      title,
      bio,
      skills,
      experienceYears,
      resumeText,
      location,
      candidateProfile,
    } = req.body || {};

    let user;
    
    if (isUsingMongoDB()) {
      const updateFields = {};
      if (name !== undefined) updateFields["profile.name"] = name;
      if (title !== undefined) updateFields["profile.title"] = title;
      if (bio !== undefined) updateFields["profile.bio"] = bio;
      if (skills !== undefined) updateFields["profile.skills"] = normalizeSkills(skills);
      if (experienceYears !== undefined)
        updateFields["profile.experienceYears"] = experienceYears;
      if (resumeText !== undefined)
        updateFields["profile.resumeText"] = resumeText;
      if (location !== undefined) updateFields["profile.location"] = location;
      if (candidateProfile !== undefined)
        updateFields.candidateProfile = candidateProfile;

      user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).lean();
    } else {
      const existingUser = findUserById(req.user.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const profileUpdate = { ...existingUser.profile };
      if (name !== undefined) profileUpdate.name = name;
      if (title !== undefined) profileUpdate.title = title;
      if (bio !== undefined) profileUpdate.bio = bio;
      if (skills !== undefined) profileUpdate.skills = normalizeSkills(skills);
      if (experienceYears !== undefined) profileUpdate.experienceYears = experienceYears;
      if (resumeText !== undefined) profileUpdate.resumeText = resumeText;
      if (location !== undefined) profileUpdate.location = location;

      user = updateUser(req.user.id, { profile: profileUpdate });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("[User] Profile updated:", req.user.id);

    const userData = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("[User] Update profile error:", error);
    next(error);
  }
}

/**
 * POST /user/upload-cv
 * Upload and parse CV (PDF or DOCX), auto-update profile.
 */
export async function uploadCVHandler(req, res, next) {
  try {
    console.log("[User] CV upload request:", req.user?.id);

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Check for file in request (handled by multer middleware)
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a PDF or DOCX file.",
      });
    }

    // Validate file type
    const allowedTypes = [".pdf", ".docx"];
    const fileExt = file.originalname.toLowerCase().split(".").pop();
    
    if (!allowedTypes.includes("." + fileExt)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only PDF and DOCX files are allowed.",
      });
    }

    // Parse the CV
    const parsedData = await parseCV(file.buffer, file.originalname);
    
    console.log("[User] CV parsed. Skills found:", parsedData.extractedSkills?.length || 0);

    let user;
    
    if (isUsingMongoDB()) {
      user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const currentProfile = user.profile?.toObject ? user.profile.toObject() : user.profile;
      const updatedProfile = updateProfileWithCV(currentProfile, parsedData);

      user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { profile: updatedProfile } },
        { new: true, runValidators: true }
      ).lean();
    } else {
      const existingUser = findUserById(req.user.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const currentProfile = existingUser.profile || {};
      const updatedProfile = updateProfileWithCV(currentProfile, parsedData);
      user = updateUser(req.user.id, { profile: updatedProfile });
    }

    console.log("[User] CV uploaded and profile updated:", req.user.id);

    const userData = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: {
        profile: user.profile,
        parsed: parsedData,
      },
    });
  } catch (error) {
    console.error("[User] CV upload error:", error);
    next(error);
  }
}

/**
 * POST /user/generate-bio
 * Generate a short bio/headline for the candidate profile.
 */
export async function generateBioHandler(req, res, next) {
  try {
    console.log("[User] Generate bio request:", req.user?.id);

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { profile, targetRole = "" } = req.body;

    const bio = await generateBio(profile, targetRole);

    return res.status(200).json({
      success: true,
      data: bio,
    });
  } catch (error) {
    console.error("[User] Generate bio error:", error);
    next(error);
  }
}
