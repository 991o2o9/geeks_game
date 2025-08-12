import mongoose from "mongoose";

const SuspiciousLogSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  reason: String,
  country: String,
  city: String,
  date: Date,
});

export const SuspiciousLog = mongoose.model(
  "SuspiciousLog",
  SuspiciousLogSchema
);
