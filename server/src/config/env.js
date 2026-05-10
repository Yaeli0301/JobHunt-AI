/**
 * Environment Configuration
 * Centralized access to env vars with safe defaults.
 */

export const PORT = process.env.PORT || 3001;

export const MONGODB_URI = process.env.MONGODB_URI || "";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export const NODE_ENV = process.env.NODE_ENV || "development";

export const OPENAI_MODEL = "gpt-4o-mini";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

/** Access token TTL — client refreshes via POST /auth/refresh when using short-lived tokens. */
export const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN ||
  (NODE_ENV === "production" ? "15m" : "7d");

/** Opaque refresh token TTL (stored hashed server-side). */
export const JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/** Comma-separated allowed browser origins in production (CORS). */
export const FRONTEND_URL = process.env.FRONTEND_URL || "";

export function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.warn(`[ENV] Warning: Missing environment variable ${key}`);
  }
  return value;
}
