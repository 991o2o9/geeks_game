import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

export function securityMiddlewares(app, allowedOrigins = []) {
  const isProduction = process.env.NODE_ENV === "production";

  // Настройка Helmet в зависимости от окружения
  if (isProduction) {
    // Строгие настройки для продакшена
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: true,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );
  } else {
    // Более мягкие настройки для разработки
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );
  }

  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));

  // CORS конфигурация в зависимости от окружения
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!isProduction) {
          // В режиме разработки разрешаем все origins
          return cb(null, true);
        }

        // В продакшене строго проверяем разрешенные origins
        if (!origin || allowedOrigins.includes(origin)) {
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
