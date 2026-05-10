/**
 * Error Handling Middleware
 * Catches all errors and returns structured JSON.
 */

export function errorHandler(err, _req, res, _next) {
  console.error("[ErrorHandler]", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: true,
      message: "Validation failed: " + Object.values(err.errors).map((e) => e.message).join(", "),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      error: true,
      message: "Duplicate entry detected.",
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: true,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: true,
      message: "Invalid JSON in request body.",
    });
  }

  // Default
  return res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal server error",
  });
}
