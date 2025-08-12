import crypto from "crypto";
import { logSuspicious } from "../utils/suspiciousLog.js";

export function preventDuplicateRequests(ttlMs = 5000) {
  const recentRequests = new Map();
  return (req, res, next) => {
    if (req.method === "GET") {
      return next();
    }

    if (req.originalUrl.includes("/api/docs") || req.originalUrl === "/") {
      return next();
    }

    const raw = `${req.ip}|${req.method}|${req.originalUrl}|${JSON.stringify(
      req.body
    )}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const now = Date.now();

    if (recentRequests.has(hash) && now - recentRequests.get(hash) < ttlMs) {
      logSuspicious(req, "Duplicate request");
      return res.status(429).json({ error: "Duplicate request" });
    }

    recentRequests.set(hash, now);
    setTimeout(() => recentRequests.delete(hash), ttlMs);
    next();
  };
}
