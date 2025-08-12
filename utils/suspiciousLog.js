import geoip from "geoip-lite";
import { SuspiciousLog } from "../models/SuspiciousLog.js";

export function logSuspicious(req, reason) {
  const ip = req.ip;
  const geo = geoip.lookup(ip) || {};
  const entry = {
    ip,
    userAgent: req.headers["user-agent"] || "-",
    reason,
    country: geo.country || "-",
    city: geo.city || "-",
    date: new Date(),
  };
  SuspiciousLog.create(entry);
  console.warn(`[SUSPICIOUS] ${ip} ${reason}`);
}
