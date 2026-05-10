/**
 * Auth Middleware
 * JWT verification for protected routes.
 */

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/**
 * Verify JWT token and attach user to request.
 * Bearer token format: "Bearer <token>"
 * Includes role from JWT payload
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "candidate",
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token.",
    });
  }
}

/**
 * Require specific role for route access.
 * Usage: requireRole("recruiter")
 */
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. This action requires ${requiredRole} role.`,
      });
    }

    next();
  };
}

/**
 * Optional auth - attaches user if token present, but doesn't require it.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "candidate",
    };
  } catch (error) {
    req.user = null;
  }

  next();
}
