import { LoginAttempt } from "../models/LoginAttempt.js";
import { logSuspicious } from "../utils/suspiciousLog.js";

export function loginBruteForceProtection({
  windowMsProd = 120000,
  windowMsDev = 60000,
  maxAttemptsProd = 10,
  maxAttemptsDev = 20,
} = {}) {
  const isProduction = process.env.NODE_ENV === "production";

  return async (req, res, next) => {
    const ip = req.ip;
    let record = await LoginAttempt.findOne({ ip });
    const now = Date.now();

    const windowMs = isProduction ? windowMsProd : windowMsDev;
    const maxAttempts = isProduction ? maxAttemptsProd : maxAttemptsDev;

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
      return res.status(429).json({
        error: "Too many login attempts",
        message: isProduction
          ? "Слишком много попыток входа. Попробуйте снова через пару минут."
          : "Лимит попыток входа превышен (dev mode)",
      });
    }

    req._loginAttemptRecord = record;
    next();
  };
}
