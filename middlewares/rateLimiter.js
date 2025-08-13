import rateLimit from "express-rate-limit";
import { logSuspicious } from "../utils/suspiciousLog.js";

export const ipRateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === "production" ? 60 * 1000 : 30 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 200,
  skip: (req) => {
    return req.originalUrl.includes("/api/docs") || req.originalUrl === "/";
  },
  handler: (req, res, _, opts) => {
    logSuspicious(req, `RateLimit exceeded on ${req.originalUrl}`);
    res.status(opts.statusCode).json({
      error: "Too many requests",
      message:
        process.env.NODE_ENV === "production"
          ? "Слишком много запросов. Подождите немного."
          : "Rate limit exceeded (development mode)",
    });
  },
});
