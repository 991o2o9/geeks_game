import { LoginAttempt } from "../models/LoginAttempt.js";
import { logSuspicious } from "../utils/suspiciousLog.js";

export function loginBruteForceProtection({
  windowMs = 60000,
  maxAttempts = 5,
} = {}) {
  return async (req, res, next) => {
    const ip = req.ip;
    let record = await LoginAttempt.findOne({ ip });
    const now = Date.now();
    if (!record) {
      record = await LoginAttempt.create({
        ip,
        count: 0,
        resetAt: new Date(now + windowMs),
      });
    } else if (now > record.resetAt.getTime()) {
      record.count = 0;
      record.resetAt = new Date(now + windowMs);
    }
    if (record.count >= maxAttempts) {
      logSuspicious(req, "Brute-force blocked");
      return res.status(429).json({ error: "Too many login attempts" });
    }
    req._loginAttemptRecord = record;
    next();
  };
}
