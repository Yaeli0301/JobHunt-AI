/**
 * Zod validation middleware — replaces req.body with parsed output on success.
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return res.status(400).json({
        success: false,
        error: first?.message || "Validation failed",
      });
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query ?? {});
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return res.status(400).json({
        success: false,
        error: first?.message || "Validation failed",
      });
    }
    req.query = parsed.data;
    next();
  };
}
