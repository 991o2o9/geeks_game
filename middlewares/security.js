import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

export function securityMiddlewares(app, allowedOrigins = []) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'", "*"],
            styleSrc: ["'self'", "'unsafe-inline'", "*"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
            imgSrc: ["'self'", "data:", "https:", "*"],
            connectSrc: ["'self'", "*"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: false,
      })
    );
  } else {
    // dev режим
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );
  }

  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!isProduction) {
          return cb(null, true);
        }
        // Production: мягкая проверка
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.includes("yourdomain.com")
        ) {
          return cb(null, true);
        }
        return cb(new Error("CORS blocked"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );
}
