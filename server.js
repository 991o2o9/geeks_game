import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { securityMiddlewares } from "./middlewares/security.js";
import { ipRateLimiter } from "./middlewares/rateLimiter.js";
import { preventDuplicateRequests } from "./middlewares/duplicateRequest.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import {
  ALLOWED_ORIGINS,
  PORT,
  MONGODB_URL,
  IS_PRODUCTION,
  ENABLE_SWAGGER_DOCS,
} from "./config/env.js";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";

dotenv.config();

// Подключение MongoDB
mongoose
  .connect(MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const app = express();

// Middleware
securityMiddlewares(app, ALLOWED_ORIGINS);
app.use(ipRateLimiter);
app.use(preventDuplicateRequests());

app.get("/", (req, res) => {
  res.json({
    message: "GeeksGame API is running!",
    version: "1.0.0",
    docs: ENABLE_SWAGGER_DOCS ? "/api/docs" : null,
    status: "healthy",
    environment: IS_PRODUCTION ? "production" : "development",
  });
});

// Swagger documentation (only in development or when explicitly enabled)
if (ENABLE_SWAGGER_DOCS) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📚 Swagger documentation enabled at /api/docs");
} else {
  // Block access to docs in production
  app.use("/api/docs", (req, res) => {
    res.status(404).json({
      error: "Documentation not available in production",
      message: "API documentation is disabled in production environment",
    });
  });
  console.log("🚫 Swagger documentation disabled in production");
}

// Routes
app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
