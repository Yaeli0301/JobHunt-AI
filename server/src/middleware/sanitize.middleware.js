/**
 * Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks.
 */

import sanitizeHtml from "sanitize-html";

/**
 * Configuration for sanitize-html
 */
const sanitizeOptions = {
  allowedTags: [], // No HTML tags allowed - we strip all
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

/**
 * Sanitize a single value.
 * @param {any} value 
 * @returns {string}
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) return "";
  
  if (typeof value === "string") {
    return sanitizeHtml(value, sanitizeOptions).trim();
  }
  
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  
  return String(value);
}

/**
 * Recursively sanitize an object.
 * @param {object} obj 
 * @returns {object}
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeValue(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeValue(value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeValue(item));
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Express middleware to sanitize request body.
 */
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Sanitize a specific string for safe display.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeForDisplay(text) {
  if (!text) return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export default {
  sanitizeInput,
  sanitizeForDisplay,
};
