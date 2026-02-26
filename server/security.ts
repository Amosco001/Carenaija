import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss";
import validator from "validator";
import crypto from "crypto";
import { db } from "./db";
import { sql, eq, and, gte } from "drizzle-orm";
import { loginAttempts as loginAttemptsTable, securityEvents } from "@shared/schema";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_WINDOW = 15 * 60 * 1000;

export const securityMiddleware = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com", "wss:", "ws:"],
        frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com", "https://*.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),

  httpsRedirect: (req: Request, res: Response, next: NextFunction) => {
    if (
      process.env.NODE_ENV === "production" &&
      req.headers["x-forwarded-proto"] !== "https" &&
      req.path !== "/_health" &&
      !req.headers["user-agent"]?.includes("Replit")
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  },

  apiRateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => {
      return req.path.startsWith("/api/hospitals") && req.method === "GET";
    },
  }),

  strictRateLimiter: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "Rate limit exceeded. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  formRateLimiter: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { message: "Too many form submissions. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  authRateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many authentication attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body?._csrf;
  const sessionToken = (req.session as any)?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
}

export function setCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.csrfToken) {
    (req.session as any).csrfToken = generateCsrfToken();
  }
  next();
}

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return input;
  
  let sanitized = xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  });
  
  sanitized = sanitized.trim();
  
  return sanitized;
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === "string" ? sanitizeInput(item) : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

export const inputValidators = {
  isValidEmail: (email: string): boolean => {
    return validator.isEmail(email);
  },

  isValidUrl: (url: string): boolean => {
    return validator.isURL(url, { protocols: ["http", "https"], require_protocol: true });
  },

  isValidPhone: (phone: string): boolean => {
    return validator.isMobilePhone(phone, "any");
  },

  isAlphanumeric: (str: string): boolean => {
    return validator.isAlphanumeric(str, "en-US", { ignore: " -_" });
  },

  isValidLength: (str: string, min: number, max: number): boolean => {
    return validator.isLength(str, { min, max });
  },

  escapeHtml: (str: string): string => {
    return validator.escape(str);
  },

  isStrongPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Password must contain a number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain a special character");
    
    return { valid: errors.length === 0, errors };
  },
};

export async function checkBruteForce(identifier: string): Promise<{ allowed: boolean; lockedUntil?: Date }> {
  try {
    const [attempt] = await db.select().from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier));

    if (!attempt) {
      return { allowed: true };
    }

    const now = new Date();

    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      return { allowed: false, lockedUntil: attempt.lockedUntil };
    }

    if (attempt.lockedUntil && attempt.lockedUntil <= now) {
      await db.delete(loginAttemptsTable).where(eq(loginAttemptsTable.identifier, identifier));
      return { allowed: true };
    }

    const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW);
    if (attempt.lastAttempt && attempt.lastAttempt < windowStart) {
      await db.delete(loginAttemptsTable).where(eq(loginAttemptsTable.identifier, identifier));
      return { allowed: true };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking brute force:", error);
    return { allowed: true };
  }
}

export async function recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
  try {
    if (success) {
      await db.delete(loginAttemptsTable).where(eq(loginAttemptsTable.identifier, identifier));
      return;
    }

    const [existing] = await db.select().from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier));

    const now = new Date();

    if (existing) {
      const newCount = existing.attemptCount + 1;
      const lockedUntil = newCount >= LOCKOUT_THRESHOLD 
        ? new Date(now.getTime() + LOCKOUT_DURATION)
        : null;

      await db.update(loginAttemptsTable)
        .set({ 
          attemptCount: newCount, 
          lastAttempt: now,
          lockedUntil 
        })
        .where(eq(loginAttemptsTable.identifier, identifier));
    } else {
      await db.insert(loginAttemptsTable).values({
        identifier,
        attemptCount: 1,
        lastAttempt: now,
      });
    }
  } catch (error) {
    console.error("Error recording login attempt:", error);
  }
}

export async function bruteForceProtection(req: Request, res: Response, next: NextFunction) {
  const identifier = req.ip || req.headers["x-forwarded-for"] as string || "unknown";
  const check = await checkBruteForce(identifier);

  if (!check.allowed) {
    const remainingTime = Math.ceil((check.lockedUntil!.getTime() - Date.now()) / 60000);
    return res.status(429).json({ 
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
    });
  }

  next();
}

export interface SecurityAuditLog {
  timestamp: Date;
  eventType: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: "info" | "warning" | "critical";
}

export async function logSecurityEvent(event: Omit<SecurityAuditLog, "timestamp">): Promise<void> {
  const logEntry = {
    ...event,
    timestamp: new Date(),
  };

  console.log(`[SECURITY ${event.severity.toUpperCase()}] ${event.eventType}:`, JSON.stringify(logEntry));

  try {
    await db.insert(securityEvents).values({
      eventType: event.eventType,
      userId: event.userId || null,
      ipAddress: event.ip,
      userAgent: event.userAgent || null,
      requestPath: event.details?.path || null,
      requestMethod: event.details?.method || null,
      statusCode: event.details?.statusCode || null,
      severity: event.severity,
      details: event.details,
    });
  } catch (error) {
    console.error("Failed to log security event to database:", error);
  }
}

export function securityAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  const isApiRoute = req.path.startsWith("/api/");
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  if (isApiRoute && (isStateChanging || req.path.includes("/admin"))) {
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        logSecurityEvent({
          eventType: res.statusCode === 401 ? "auth_failure" : 
                     res.statusCode === 403 ? "access_denied" :
                     res.statusCode === 429 ? "rate_limited" : 
                     res.statusCode === 400 ? "bad_request" : "request_error",
          userId: (req as any).user?.claims?.sub,
          ip: req.ip || req.headers["x-forwarded-for"] as string || "unknown",
          userAgent: req.headers["user-agent"],
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
          severity: res.statusCode === 401 || res.statusCode === 403 ? "warning" : 
                   res.statusCode >= 500 ? "critical" : "info",
        });
      }
    });
  }

  next();
}

export const fileUploadConfig = {
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"],
};

export function validateFileUpload(file: { mimetype: string; size: number; originalname: string }): { valid: boolean; error?: string } {
  if (file.size > fileUploadConfig.maxFileSize) {
    return { valid: false, error: `File size exceeds maximum of ${fileUploadConfig.maxFileSize / (1024 * 1024)}MB` };
  }

  if (!fileUploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: "File type not allowed" };
  }

  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));
  if (!fileUploadConfig.allowedExtensions.includes(ext)) {
    return { valid: false, error: "File extension not allowed" };
  }

  return { valid: true };
}

export function secureHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(self), microphone=(), camera=()");
  
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  next();
}
