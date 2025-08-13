import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  userId: { type: String, unique: true, required: true },
  coins: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
