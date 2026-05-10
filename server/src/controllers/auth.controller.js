/**
 * Auth Controller — register, login, refresh, logout.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "../config/env.js";
import {
  isUsingMongoDB,
  createUser,
  findUserByEmail,
} from "../db/mongo.js";
import User from "../models/User.model.js";
import {
  issueAccessAndRefresh,
  hashRefreshToken,
} from "../services/token.service.js";
import {
  findUserByRefreshTokenHash,
  setUserRefreshCredentials,
  clearUserRefreshCredentials,
} from "../repositories/user.repository.js";

function buildUserResponse(user, userRole) {
  return {
    _id: user._id,
    email: user.email,
    role: userRole,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function respondWithTokens(res, statusCode, user, userRole) {
  const bundle = issueAccessAndRefresh({ ...user, role: userRole });
  await setUserRefreshCredentials(user._id, bundle.refreshTokenHash, bundle.refreshTokenExpiresAt);
  const userData = buildUserResponse(user, userRole);
  return res.status(statusCode).json({
    success: true,
    data: {
      user: userData,
      token: bundle.accessToken,
      refreshToken: bundle.refreshToken,
    },
  });
}

/**
 * POST /auth/register
 */
export async function registerHandler(req, res, next) {
  try {
    const { email, password, name, title, role } = req.body;

    const userRole = role === "recruiter" ? "recruiter" : "candidate";

    let user;

    if (isUsingMongoDB()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Email already registered.",
        });
      }

      user = new User({
        email: email.toLowerCase(),
        passwordHash: password,
        role: userRole,
        profile: {
          name: name || "",
          title: title || "",
        },
      });

      await user.save();
    } else {
      const existing = findUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Email already registered.",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      user = createUser({
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: userRole,
        profile: {
          name: name || "",
          title: title || "",
        },
      });
    }

    return await respondWithTokens(res, 201, user, userRole);
  } catch (error) {
    console.error("[Auth] Register error:", error);
    next(error);
  }
}

/**
 * POST /auth/login
 */
export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;

    let user;

    if (isUsingMongoDB()) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }
    } else {
      user = findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }
    }

    const userRole = user.role || "candidate";
    return await respondWithTokens(res, 200, user, userRole);
  } catch (error) {
    console.error("[Auth] Login error:", error);
    next(error);
  }
}

/**
 * POST /auth/refresh — rotate refresh token, new access token.
 */
export async function refreshHandler(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const hash = hashRefreshToken(refreshToken);
    const user = await findUserByRefreshTokenHash(hash);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token.",
      });
    }

    const userRole = user.role || "candidate";
    return await respondWithTokens(res, 200, user, userRole);
  } catch (error) {
    console.error("[Auth] Refresh error:", error);
    next(error);
  }
}

/**
 * POST /auth/logout — revoke refresh (body.refreshToken and/or Bearer access token).
 */
export async function logoutHandler(req, res, next) {
  try {
    const { refreshToken } = req.body || {};

    if (refreshToken) {
      const hash = hashRefreshToken(refreshToken);
      const user = await findUserByRefreshTokenHash(hash);
      if (user) {
        await clearUserRefreshCredentials(user._id);
      }
      return res.status(200).json({ success: true, data: { loggedOut: true } });
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await clearUserRefreshCredentials(decoded.id);
        return res.status(200).json({ success: true, data: { loggedOut: true } });
      } catch {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired token.",
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: "Provide refreshToken in body or Authorization Bearer token.",
    });
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    next(error);
  }
}
