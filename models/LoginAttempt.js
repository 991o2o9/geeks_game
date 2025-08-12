import mongoose from "mongoose";

const LoginAttemptSchema = new mongoose.Schema({
  ip: String,
  count: Number,
  resetAt: Date,
});

export const LoginAttempt = mongoose.model("LoginAttempt", LoginAttemptSchema);
