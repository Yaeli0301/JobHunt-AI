/**
 * Production Configuration
 * Production-specific settings and optimized defaults.
 */

export default {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: "production",
  
  // MongoDB - Required in production
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT - Should be set via environment variable
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h", // Shorter in production
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: "gpt-4o-mini",
  
  // Logging
  logLevel: "info",
  
  // Rate limiting - More restrictive in production
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 50,
  
  // CORS - Restrictive in production
  corsOrigin: process.env.CORS_ORIGIN || "https://yourdomain.com",
  
  // File uploads
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: [".pdf", ".docx"],
  
  // Cache
  cacheEnabled: true,
  cacheTtl: 15 * 60 * 1000, // 15 minutes
  
  // Security
  enableHelmet: true,
  enableRateLimit: true,
  enableSanitization: true,
};
