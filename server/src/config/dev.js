/**
 * Development Configuration
 * Development-specific settings and defaults.
 */

export default {
  // Server
  port: 3001,
  nodeEnv: "development",
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-job-dev",
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiresIn: "7d",
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: "gpt-4o-mini",
  
  // Logging
  logLevel: "debug",
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100,
  
  // CORS
  corsOrigin: "*",
  
  // File uploads
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: [".pdf", ".docx"],
  
  // Cache
  cacheEnabled: false,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
};
