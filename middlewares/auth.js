import { verifyAccessToken } from "../config/jwt.js";

export function jwtAuthMiddleware(req, res, next) {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = verifyAccessToken(token);
    req.userId = req.user.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
