/**
 * Express App — API versioned under /api/v1
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoute from "./routes/auth.routes.js";
import userRoute from "./routes/user.routes.js";
import jobsRoute from "./routes/jobs.routes.js";
import applyRoute from "./routes/apply.routes.js";
import analyzeRoute from "./routes/analyze.routes.js";
import { NODE_ENV, FRONTEND_URL } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const corsOrigins =
  NODE_ENV === "production" && FRONTEND_URL
    ? FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

if (NODE_ENV === "production") {
  app.use(helmet());
}

// ----- Health (no version prefix — for load balancers) -----
app.get("/", (_req, res) => {
  res.json({ message: "AI Job Matching Platform - Server is working" });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    api: "/api/v1",
  });
});

// ----- Versioned API -----
const v1 = express.Router();

v1.use("/auth", authRoute);
v1.use("/users", userRoute);
v1.use("/jobs", jobsRoute);
v1.use("/applications", applyRoute);
v1.use("/analyze", analyzeRoute);

app.use("/api/v1", apiLimiter, v1);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[GlobalError]", err.message);

  if (err.message && err.message.includes("Only")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

export default app;
