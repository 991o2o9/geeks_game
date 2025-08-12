import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGODB_URL = process.env.MONGODB_URL;

export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "change-this-access";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-this-refresh";
export const ACCESS_TOKEN_EXPIRES = "15m";
export const REFRESH_TOKEN_EXPIRES = "7d";

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

// Environment configuration
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_DEVELOPMENT = NODE_ENV === "development";

// Feature flags
export const ENABLE_SWAGGER_DOCS =
  process.env.ENABLE_SWAGGER_DOCS === "true" || IS_DEVELOPMENT;
export const ENABLE_DEBUG_LOGS =
  process.env.ENABLE_DEBUG_LOGS === "true" || IS_DEVELOPMENT;
