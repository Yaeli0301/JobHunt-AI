/**
 * Access JWTs + opaque refresh tokens (hashed at rest).
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from "../config/env.js";

export function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Parse durations like 7d, 12h, 15m (same spirit as jsonwebtoken expiresIn).
 */
export function refreshExpiresAt() {
  const s = JWT_REFRESH_EXPIRES_IN.trim();
  const m = /^(\d+)([smhd])$/i.exec(s);
  if (!m) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + n * mult[unit]);
}

export function signAccessToken(user) {
  const userRole = user.role || "candidate";
  const id = user._id != null ? String(user._id) : String(user.id);
  return jwt.sign(
    { id, email: user.email, role: userRole },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function issueAccessAndRefresh(user) {
  const accessToken = signAccessToken(user);
  const rawRefresh = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(rawRefresh);
  const refreshTokenExpiresAt = refreshExpiresAt();
  return {
    accessToken,
    refreshToken: rawRefresh,
    refreshTokenHash,
    refreshTokenExpiresAt,
  };
}
