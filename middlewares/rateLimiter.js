import rateLimit from "express-rate-limit";
import { logSuspicious } from "../utils/suspiciousLog.js";

export const ipRateLimiter = rateLimit({
  windowMs: 60000,
  max: process.env.NODE_ENV === "production" ? 20 : 30, // Более строгий лимит в production
  skip: (req) => {
    // Пропускаем запросы к документации и health check
    return req.originalUrl.includes("/api/docs") || req.originalUrl === "/";
  },
  handler: (req, res, _, opts) => {
    logSuspicious(req, `RateLimit exceeded on ${req.originalUrl}`);
    res.status(opts.statusCode).json({
      error: "Too many requests",
      message:
        process.env.NODE_ENV === "production"
          ? "Please try again later"
          : "Rate limit exceeded",
    });
  },
});
