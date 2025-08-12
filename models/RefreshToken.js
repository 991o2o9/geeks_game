import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  token: String,
  userId: String,
  expiresAt: Date,
});

export const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
