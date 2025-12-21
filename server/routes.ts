import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import {
  insertHospitalSchema,
  insertPatientReviewSchema,
  insertEmployeeReviewSchema,
  insertHospitalSuggestionSchema,
  insertClaimRequestSchema,
  insertReviewFlagSchema,
  insertEmailPreferencesSchema,
} from "@shared/schema";
import { notificationService } from "./services/notification";
import crypto from "crypto";
import { 
  securityMiddleware, 
  bruteForceProtection, 
  logSecurityEvent,
  setCsrfToken,
  generateCsrfToken,
  inputValidators,
} from "./security";

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

async function isAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.claims.sub);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Default spam keywords (used if database is empty)
const DEFAULT_SPAM_KEYWORDS = [
  { phrase: "buy now", weight: 20, category: "promotional" },
  { phrase: "click here", weight: 15, category: "promotional" },
  { phrase: "http://", weight: 25, category: "links" },
  { phrase: "https://bit.ly", weight: 30, category: "links" },
  { phrase: "free money", weight: 40, category: "scam" },
  { phrase: "earn money", weight: 25, category: "scam" },
  { phrase: "best hospital ever", weight: 10, category: "superlative" },
  { phrase: "worst hospital ever", weight: 10, category: "superlative" },
  { phrase: "!!!!", weight: 15, category: "excessive_punctuation" },
  { phrase: "????", weight: 15, category: "excessive_punctuation" },
  { phrase: "contact me at", weight: 20, category: "contact_solicitation" },
  { phrase: "whatsapp", weight: 15, category: "contact_solicitation" },
  { phrase: "telegram", weight: 15, category: "contact_solicitation" },
];

async function calculateSpamScore(reviewText: string, clientIp: string): Promise<number> {
  let score = 0;
  const lowerText = reviewText.toLowerCase();

  // Get keywords from database, fall back to defaults
  let keywords = await storage.getAllSpamKeywords();
  if (keywords.length === 0) {
    keywords = DEFAULT_SPAM_KEYWORDS.map((k, i) => ({
      id: i,
      phrase: k.phrase,
      weight: k.weight,
      category: k.category,
      active: true,
      createdAt: new Date(),
    }));
  }

  // Check for spam keywords
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.phrase.toLowerCase())) {
      score += keyword.weight;
    }
  }

  // Heuristic checks
  // Check for excessive caps (more than 50% uppercase)
  const upperCount = (reviewText.match(/[A-Z]/g) || []).length;
  const letterCount = (reviewText.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 20 && upperCount / letterCount > 0.5) {
    score += 15;
  }

  // Check for excessive punctuation
  const punctuationCount = (reviewText.match(/[!?]{2,}/g) || []).length;
  score += punctuationCount * 5;

  // Check for very short reviews (less than 20 chars)
  if (reviewText.length < 20) {
    score += 10;
  }

  // Check for copy-paste patterns (repeated text)
  const words = reviewText.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
    score += 25;
  }

  // Check IP activity (high activity from same IP adds suspicion)
  const recentIpActivity = await storage.getIpActivityCount(clientIp, "create_review", 1);
  if (recentIpActivity > 2) {
    score += recentIpActivity * 10;
  }

  return Math.min(score, 100); // Cap at 100
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);

  app.use(setCsrfToken);

  app.get('/api/csrf-token', (req: any, res) => {
    const token = (req.session as any)?.csrfToken || generateCsrfToken();
    if (!(req.session as any)?.csrfToken) {
      (req.session as any).csrfToken = token;
    }
    res.json({ csrfToken: token });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/hospitals", async (req, res) => {
    try {
      const { search, page, limit } = req.query;
      
      if (search && typeof search === "string") {
        const results = await storage.searchHospitals(search);
        res.json(results);
      } else if (page || limit) {
        const paginatedResult = await storage.getHospitalsPaginated({
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        });
        res.json(paginatedResult);
      } else {
        const hospitals = await storage.getAllHospitals();
        res.json(hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const hospital = await storage.getHospitalById(id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      res.json(hospital);
    } catch (error) {
      console.error("Error fetching hospital:", error);
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  app.post("/api/hospitals", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(validatedData);
      res.status(201).json(hospital);
    } catch (error) {
      console.error("Error creating hospital:", error);
      res.status(400).json({ message: "Invalid hospital data" });
    }
  });

  app.get("/api/reviews/patient", async (req, res) => {
    try {
      const reviews = await storage.getAllPatientReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all patient reviews:", error);
      res.status(500).json({ message: "Failed to fetch patient reviews" });
    }
  });

  app.get("/api/hospitals/:id/patient-reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const reviews = await storage.getPatientReviewsByHospitalId(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching patient reviews:", error);
      res.status(500).json({ message: "Failed to fetch patient reviews" });
    }
  });

  app.post("/api/hospitals/:id/patient-reviews", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const userId = req.user.claims.sub;
      const validatedData = insertPatientReviewSchema.parse({
        ...req.body,
        hospitalId,
        userId,
      });

      const review = await storage.createPatientReview(validatedData);

      // Trigger notifications asynchronously
      (async () => {
        try {
          const [hospital, reviewer] = await Promise.all([
            storage.getHospital(hospitalId),
            storage.getUser(userId),
          ]);
          if (hospital && reviewer) {
            await notificationService.notifyNewReviewOnFollowedHospital(review, hospital, reviewer);
          }
          await storage.incrementUserReviewCount(userId, "patient");
          await notificationService.checkAndNotifyMilestone(userId);
        } catch (err) {
          console.error("Error sending review notifications:", err);
        }
      })();

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating patient review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.get("/api/hospitals/:id/employee-reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const reviews = await storage.getEmployeeReviewsByHospitalId(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching employee reviews:", error);
      res.status(500).json({ message: "Failed to fetch employee reviews" });
    }
  });

  app.post("/api/hospitals/:id/employee-reviews", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const userId = req.user.claims.sub;
      const validatedData = insertEmployeeReviewSchema.parse({
        ...req.body,
        hospitalId,
        userId,
      });

      const review = await storage.createEmployeeReview(validatedData);

      // Trigger notifications asynchronously
      (async () => {
        try {
          const [hospital, reviewer] = await Promise.all([
            storage.getHospital(hospitalId),
            storage.getUser(userId),
          ]);
          if (hospital && reviewer) {
            await notificationService.notifyNewReviewOnFollowedHospital(review, hospital, reviewer);
          }
          await storage.incrementUserReviewCount(userId, "employee");
          await notificationService.checkAndNotifyMilestone(userId);
        } catch (err) {
          console.error("Error sending review notifications:", err);
        }
      })();

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating employee review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.post("/api/hospital-suggestions", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertHospitalSuggestionSchema.parse({
        ...req.body,
        userId,
      });

      const suggestion = await storage.createHospitalSuggestion(validatedData);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating hospital suggestion:", error);
      res.status(400).json({ message: "Invalid suggestion data" });
    }
  });

  app.post("/api/hospitals/:id/claim-requests", isAuthenticated, securityMiddleware.strictRateLimiter, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const userId = req.user.claims.sub;
      const validatedData = insertClaimRequestSchema.parse({
        ...req.body,
        hospitalId,
        userId,
      });

      const request = await storage.createClaimRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating claim request:", error);
      res.status(400).json({ message: "Invalid claim request data" });
    }
  });

  // User bookmarks
  app.get("/api/user/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/hospitals/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const bookmark = await storage.addBookmark(userId, hospitalId);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error adding bookmark:", error);
      res.status(500).json({ message: "Failed to add bookmark" });
    }
  });

  app.delete("/api/hospitals/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.removeBookmark(userId, hospitalId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  app.get("/api/hospitals/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const isBookmarked = await storage.isBookmarked(userId, hospitalId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      res.status(500).json({ message: "Failed to check bookmark" });
    }
  });

  // User reviews
  app.get("/api/user/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [patientReviews, employeeReviews] = await Promise.all([
        storage.getUserPatientReviews(userId),
        storage.getUserEmployeeReviews(userId),
      ]);
      res.json({ patientReviews, employeeReviews });
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, location } = req.body;
      const user = await storage.updateUserProfile(userId, { firstName, lastName, location });
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ==================== REVIEW VERIFICATION ROUTES ====================

  // Check if user can review a hospital (1 per year limit)
  app.get("/api/hospitals/:id/can-review", isAuthenticated, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const userId = req.user.claims.sub;
      const canReview = await storage.canUserReviewHospital(userId, hospitalId);
      const lastReview = await storage.getLastUserReviewForHospital(userId, hospitalId);
      
      res.json({ 
        canReview,
        lastReviewDate: lastReview?.createdAt || null,
        message: canReview ? null : "You can only submit one review per hospital per year"
      });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      res.status(500).json({ message: "Failed to check review eligibility" });
    }
  });

  // Enhanced patient review creation with spam detection and IP tracking
  app.post("/api/hospitals/:id/patient-reviews/verified", isAuthenticated, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const userId = req.user.claims.sub;
      const clientIp = getClientIp(req);

      // Check review limit (1 per hospital per year)
      const canReview = await storage.canUserReviewHospital(userId, hospitalId);
      if (!canReview) {
        return res.status(429).json({ 
          message: "You can only submit one review per hospital per year" 
        });
      }

      // Check IP-based spam (max 5 reviews from same IP in 24 hours)
      const ipReviewCount = await storage.getIpActivityCount(clientIp, "create_review", 24);
      if (ipReviewCount >= 5) {
        return res.status(429).json({ 
          message: "Too many reviews from this network. Please try again later." 
        });
      }

      // Calculate spam score
      const spamScore = await calculateSpamScore(req.body.reviewText || "", clientIp);

      const validatedData = insertPatientReviewSchema.parse({
        ...req.body,
        hospitalId,
        userId,
      });

      // Add spam score and IP to review data
      const reviewData = {
        ...validatedData,
        spamScore,
        submittedIp: clientIp,
        moderationStatus: spamScore >= 50 ? "flagged" : spamScore >= 30 ? "pending" : "approved",
      };

      const review = await storage.createPatientReview(reviewData);

      // Track IP activity
      await storage.trackIp(clientIp, userId, "create_review", "patient_review", review.id);

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating verified patient review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // ==================== REVIEW FLAGGING/REPORTING ROUTES ====================

  // Report a review
  app.post("/api/reviews/:id/flag", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const userId = req.user.claims.sub;
      const { reason, details, reviewType = "patient" } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      const validReasons = ["spam", "fake", "inappropriate", "offensive", "misleading", "duplicate", "other"];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ message: "Invalid reason" });
      }

      const flag = await storage.createReviewFlag({
        reviewId,
        reviewType,
        reporterUserId: userId,
        reason,
        details: details || null,
      });

      res.status(201).json({ message: "Review reported successfully", flag });
    } catch (error) {
      console.error("Error flagging review:", error);
      res.status(500).json({ message: "Failed to report review" });
    }
  });

  // Get flags for a review
  app.get("/api/reviews/:id/flags", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const flags = await storage.getReviewFlagsByReviewId(reviewId);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching review flags:", error);
      res.status(500).json({ message: "Failed to fetch review flags" });
    }
  });

  // ==================== ADMIN MODERATION ROUTES ====================

  // Get reviews pending moderation
  app.get("/api/admin/reviews/moderation", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const reviews = await storage.getReviewsForModeration(status as string);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews for moderation:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get all review flags for admin dashboard
  app.get("/api/admin/flags", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const flags = await storage.getReviewFlags(status as string);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching flags:", error);
      res.status(500).json({ message: "Failed to fetch flags" });
    }
  });

  // Update review moderation status
  app.patch("/api/admin/reviews/:id/moderation", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const { status, notes } = req.body;
      const adminUserId = req.user.claims.sub;

      if (!status || !["approved", "rejected", "hidden", "under_review"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedReview = await storage.updateReviewModerationStatus(reviewId, status, adminUserId);

      // Create audit log
      await storage.createAdminAuditLog(
        adminUserId,
        `review_${status}`,
        "patient_review",
        reviewId,
        null,
        { status },
        notes
      );

      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review moderation:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Update review verification status (for verified visit badge)
  app.patch("/api/admin/reviews/:id/verification", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const { status, proofUrl, proofType, notes } = req.body;
      const adminUserId = req.user.claims.sub;

      if (!status || !["pending", "verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedReview = await storage.updateReviewVerificationStatus(
        reviewId, 
        status, 
        proofUrl, 
        proofType
      );

      await storage.createAdminAuditLog(
        adminUserId,
        `verification_${status}`,
        "patient_review",
        reviewId,
        null,
        { status, proofUrl, proofType },
        notes
      );

      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review verification:", error);
      res.status(500).json({ message: "Failed to update review verification" });
    }
  });

  // Resolve a review flag
  app.patch("/api/admin/flags/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const flagId = parseInt(req.params.id);
      if (isNaN(flagId)) {
        return res.status(400).json({ message: "Invalid flag ID" });
      }

      const { status, resolution } = req.body;
      const adminUserId = req.user.claims.sub;

      if (!status || !["resolved", "dismissed", "actioned"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedFlag = await storage.updateReviewFlagStatus(
        flagId,
        status,
        adminUserId,
        resolution || ""
      );

      await storage.createAdminAuditLog(
        adminUserId,
        `flag_${status}`,
        "review_flag",
        flagId,
        null,
        { status, resolution }
      );

      res.json(updatedFlag);
    } catch (error) {
      console.error("Error resolving flag:", error);
      res.status(500).json({ message: "Failed to resolve flag" });
    }
  });

  // Get admin audit logs
  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { targetType, targetId } = req.query;
      const logs = await storage.getAdminAuditLogs(
        targetType as string,
        targetId ? parseInt(targetId as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ==================== SPAM KEYWORD MANAGEMENT ====================

  // Get all spam keywords
  app.get("/api/admin/spam-keywords", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const keywords = await storage.getAllSpamKeywords();
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching spam keywords:", error);
      res.status(500).json({ message: "Failed to fetch spam keywords" });
    }
  });

  // Add spam keyword
  app.post("/api/admin/spam-keywords", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { phrase, weight, category } = req.body;
      if (!phrase) {
        return res.status(400).json({ message: "Phrase is required" });
      }

      const keyword = await storage.createSpamKeyword({
        phrase,
        weight: weight || 10,
        category: category || "general",
        active: true,
      });

      res.status(201).json(keyword);
    } catch (error) {
      console.error("Error creating spam keyword:", error);
      res.status(500).json({ message: "Failed to create spam keyword" });
    }
  });

  // Toggle spam keyword active status
  app.patch("/api/admin/spam-keywords/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid keyword ID" });
      }

      const { active } = req.body;
      const keyword = await storage.updateSpamKeyword(id, active);
      res.json(keyword);
    } catch (error) {
      console.error("Error updating spam keyword:", error);
      res.status(500).json({ message: "Failed to update spam keyword" });
    }
  });

  // Get admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const [pendingReviews, pendingFlags] = await Promise.all([
        storage.getReviewsForModeration("pending"),
        storage.getReviewFlags("pending"),
      ]);

      res.json({
        pendingReviews: pendingReviews.length,
        pendingFlags: pendingFlags.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ==================== VERIFICATION TOKENS ====================

  // Send email verification
  app.post("/api/auth/send-verification", isAuthenticated, securityMiddleware.authRateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.email) {
        return res.status(400).json({ message: "No email address on file" });
      }

      if (user.emailVerifiedAt) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createVerificationToken({
        userId,
        token,
        type: "email",
        expiresAt,
      });

      // In production, send email here. For now, return token for testing
      res.json({ 
        message: "Verification token created. In production, an email would be sent.",
        // Remove this in production:
        devToken: token,
      });
    } catch (error) {
      console.error("Error sending verification:", error);
      res.status(500).json({ message: "Failed to send verification" });
    }
  });

  // Verify email token
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const verificationToken = await storage.getVerificationToken(token, "email");
      if (!verificationToken || verificationToken.consumedAt) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      await storage.consumeVerificationToken(verificationToken.id);
      await storage.updateUserProfile(verificationToken.userId, {
        emailVerifiedAt: new Date(),
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Request phone verification (placeholder for Twilio)
  app.post("/api/auth/send-phone-verification", isAuthenticated, securityMiddleware.authRateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Store phone number on user
      await storage.updateUserProfile(userId, { phoneNumber });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createVerificationToken({
        userId,
        token: otp,
        type: "phone",
        expiresAt,
      });

      // In production, send SMS via Twilio here
      res.json({ 
        message: "OTP created. Twilio integration required to send SMS.",
        // Remove this in production:
        devOtp: otp,
      });
    } catch (error) {
      console.error("Error sending phone verification:", error);
      res.status(500).json({ message: "Failed to send phone verification" });
    }
  });

  // Verify phone OTP
  app.post("/api/auth/verify-phone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }

      const verificationToken = await storage.getVerificationToken(otp, "phone");
      if (!verificationToken || verificationToken.consumedAt || verificationToken.userId !== userId) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.consumeVerificationToken(verificationToken.id);
      await storage.updateUserProfile(userId, {
        phoneVerifiedAt: new Date(),
      });

      res.json({ message: "Phone verified successfully" });
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });

  // ==================
  // Pending Hospitals (Scraped Data) Admin Routes
  // ==================

  // Get pending hospitals stats
  app.get("/api/admin/pending-hospitals/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getPendingHospitalsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching pending hospitals stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get pending hospitals list
  app.get("/api/admin/pending-hospitals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const hospitals = await storage.getPendingHospitals(status as string | undefined);
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching pending hospitals:", error);
      res.status(500).json({ message: "Failed to fetch pending hospitals" });
    }
  });

  // Approve pending hospital
  app.post("/api/admin/pending-hospitals/:id/approve", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const newHospital = await storage.approvePendingHospital(id, userId);
      
      await storage.createAdminAuditLog(
        userId,
        "approve_pending_hospital",
        "pending_hospital",
        id,
        null,
        { hospitalId: newHospital.id },
        `Approved and added to hospitals database`
      );
      
      res.json({ message: "Hospital approved", hospital: newHospital });
    } catch (error) {
      console.error("Error approving pending hospital:", error);
      res.status(500).json({ message: "Failed to approve hospital" });
    }
  });

  // Reject pending hospital
  app.post("/api/admin/pending-hospitals/:id/reject", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { notes } = req.body;
      
      const updated = await storage.updatePendingHospitalStatus(id, "rejected", userId, notes);
      
      await storage.createAdminAuditLog(
        userId,
        "reject_pending_hospital",
        "pending_hospital",
        id,
        null,
        { status: "rejected" },
        notes || "Rejected by admin"
      );
      
      res.json({ message: "Hospital rejected", hospital: updated });
    } catch (error) {
      console.error("Error rejecting pending hospital:", error);
      res.status(500).json({ message: "Failed to reject hospital" });
    }
  });

  // Mark as duplicate
  app.post("/api/admin/pending-hospitals/:id/duplicate", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { notes } = req.body;
      
      const updated = await storage.updatePendingHospitalStatus(id, "duplicate", userId, notes);
      
      res.json({ message: "Marked as duplicate", hospital: updated });
    } catch (error) {
      console.error("Error marking as duplicate:", error);
      res.status(500).json({ message: "Failed to mark as duplicate" });
    }
  });

  // Get scraping jobs
  app.get("/api/admin/scraping-jobs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scraping jobs:", error);
      res.status(500).json({ message: "Failed to fetch scraping jobs" });
    }
  });

  // Get scraping logs for a job
  app.get("/api/admin/scraping-jobs/:id/logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const logs = await storage.getScrapingLogs(jobId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching scraping logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Robots.txt for SEO
  // Analytics API Routes
  app.get("/api/admin/analytics/summary", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get("/api/admin/analytics/reviews-over-time", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getReviewsOverTime(days);
      res.json(data);
    } catch (error) {
      console.error("Error fetching reviews over time:", error);
      res.status(500).json({ message: "Failed to fetch reviews over time" });
    }
  });

  app.get("/api/admin/analytics/top-hospitals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const city = req.query.city as string | undefined;
      const hospitals = await storage.getTopRatedHospitals(limit, city);
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching top hospitals:", error);
      res.status(500).json({ message: "Failed to fetch top hospitals" });
    }
  });

  app.get("/api/admin/analytics/most-reviewed", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const hospitals = await storage.getMostReviewedHospitals(limit);
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching most reviewed hospitals:", error);
      res.status(500).json({ message: "Failed to fetch most reviewed hospitals" });
    }
  });

  app.get("/api/admin/analytics/ratings-by-category", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = await storage.getAverageRatingsByCategory();
      res.json(data);
    } catch (error) {
      console.error("Error fetching ratings by category:", error);
      res.status(500).json({ message: "Failed to fetch ratings by category" });
    }
  });

  app.get("/api/admin/analytics/recent-activity", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/admin/analytics/hospitals-by-state", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = await storage.getHospitalsByState();
      res.json(data);
    } catch (error) {
      console.error("Error fetching hospitals by state:", error);
      res.status(500).json({ message: "Failed to fetch hospitals by state" });
    }
  });

  // Unverified Submissions Admin Routes
  app.get("/api/admin/news-discoveries/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUnverifiedSubmissionsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching news discoveries stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/news-discoveries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const submissions = await storage.getUnverifiedSubmissions(status as string | undefined);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching news discoveries:", error);
      res.status(500).json({ message: "Failed to fetch news discoveries" });
    }
  });

  app.post("/api/admin/news-discoveries/:id/verify", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { notes } = req.body;
      const updated = await storage.updateUnverifiedSubmissionStatus(id, "verified", userId, notes);
      res.json(updated);
    } catch (error) {
      console.error("Error verifying news discovery:", error);
      res.status(500).json({ message: "Failed to verify" });
    }
  });

  app.post("/api/admin/news-discoveries/:id/ignore", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { notes } = req.body;
      const updated = await storage.updateUnverifiedSubmissionStatus(id, "ignored", userId, notes);
      res.json(updated);
    } catch (error) {
      console.error("Error ignoring news discovery:", error);
      res.status(500).json({ message: "Failed to ignore" });
    }
  });

  app.post("/api/admin/news-discoveries/:id/promote", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const hospital = await storage.promoteUnverifiedSubmission(id, userId);
      res.json(hospital);
    } catch (error) {
      console.error("Error promoting news discovery:", error);
      res.status(500).json({ message: "Failed to promote" });
    }
  });

  // ============ NOTIFICATION & EMAIL PREFERENCES ROUTES ============

  // Get user's email preferences
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let prefs = await storage.getEmailPreferences(userId);
      if (!prefs) {
        prefs = await storage.createEmailPreferences(userId);
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update email preferences
  app.put("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertEmailPreferencesSchema.partial().parse(req.body);
      
      let prefs = await storage.getEmailPreferences(userId);
      if (!prefs) {
        prefs = await storage.createEmailPreferences(userId);
      }
      
      const updated = await storage.updateEmailPreferences(userId, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating email preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Get followed hospitals
  app.get("/api/notifications/followed-hospitals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const followed = await storage.getFollowedHospitals(userId);
      res.json(followed);
    } catch (error) {
      console.error("Error fetching followed hospitals:", error);
      res.status(500).json({ message: "Failed to fetch followed hospitals" });
    }
  });

  // Follow a hospital
  app.post("/api/notifications/follow/:hospitalId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hospitalId = parseInt(req.params.hospitalId);
      const follow = await storage.followHospital(userId, hospitalId);
      res.json(follow);
    } catch (error) {
      console.error("Error following hospital:", error);
      res.status(500).json({ message: "Failed to follow hospital" });
    }
  });

  // Unfollow a hospital
  app.delete("/api/notifications/follow/:hospitalId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hospitalId = parseInt(req.params.hospitalId);
      await storage.unfollowHospital(userId, hospitalId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing hospital:", error);
      res.status(500).json({ message: "Failed to unfollow hospital" });
    }
  });

  // Check if following a hospital
  app.get("/api/notifications/follow/:hospitalId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hospitalId = parseInt(req.params.hospitalId);
      const isFollowing = await storage.isFollowingHospital(userId, hospitalId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // Public unsubscribe endpoint (no auth required)
  app.post("/api/notifications/unsubscribe", async (req, res) => {
    try {
      const { token, category } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const prefs = await storage.getEmailPreferencesByToken(token);
      if (!prefs) {
        return res.status(404).json({ message: "Invalid unsubscribe token" });
      }

      const updateData: Record<string, boolean> = {};
      if (category === "all" || !category) {
        updateData.welcomeEmail = false;
        updateData.newReviewOnFollowed = false;
        updateData.reviewResponse = false;
        updateData.weeklyDigest = false;
        updateData.reviewMilestones = false;
        updateData.marketingEmails = false;
      } else {
        const categoryMap: Record<string, string> = {
          welcome: "welcomeEmail",
          new_review: "newReviewOnFollowed",
          review_response: "reviewResponse",
          weekly_digest: "weeklyDigest",
          milestone: "reviewMilestones",
          marketing: "marketingEmails",
        };
        const field = categoryMap[category];
        if (field) {
          updateData[field] = false;
        }
      }

      await storage.updateEmailPreferences(prefs.userId, updateData);
      res.json({ success: true, message: "Successfully unsubscribed" });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Admin: Process email queue (could be called by a cron job)
  app.post("/api/admin/process-email-queue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await notificationService.processEmailQueue();
      res.json(result);
    } catch (error) {
      console.error("Error processing email queue:", error);
      res.status(500).json({ message: "Failed to process email queue" });
    }
  });

  // Admin: Send weekly digests
  app.post("/api/admin/send-weekly-digests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const count = await notificationService.sendWeeklyDigests();
      res.json({ sent: count });
    } catch (error) {
      console.error("Error sending weekly digests:", error);
      res.status(500).json({ message: "Failed to send weekly digests" });
    }
  });

  // ==================== COMPREHENSIVE ADMIN ROUTES ====================

  // Role-based middleware for different access levels
  async function hasRole(req: any, res: Response, next: NextFunction, allowedRoles: string[]) {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    req.adminUser = user;
    next();
  }

  const isSuperAdmin = (req: any, res: Response, next: NextFunction) => 
    hasRole(req, res, next, ['super_admin']);
  
  const isModerator = (req: any, res: Response, next: NextFunction) => 
    hasRole(req, res, next, ['super_admin', 'moderator']);
  
  const isEditor = (req: any, res: Response, next: NextFunction) => 
    hasRole(req, res, next, ['super_admin', 'moderator', 'editor']);

  // Admin Dashboard Stats
  app.get("/api/admin/dashboard-stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ==================== USER MANAGEMENT ====================

  // Get all users with filtering
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { search, role, status, page, limit } = req.query;
      const result = await storage.getAllUsers({
        search: search as string,
        role: role as string,
        status: status as 'active' | 'suspended',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user stats
  app.get("/api/admin/users/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Update user role (super admin only)
  app.patch("/api/admin/users/:userId/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminUserId = req.user.claims.sub;
      
      if (!['user', 'editor', 'moderator', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const currentAdmin = await storage.getUser(adminUserId);
      if (currentAdmin?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can change roles" });
      }
      
      const previousUser = await storage.getUser(userId);
      const updated = await storage.updateUserRole(userId, role);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'update_role',
        'user',
        0,
        { role: previousUser?.role },
        { role },
        `Changed role from ${previousUser?.role} to ${role}`
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Suspend user
  app.post("/api/admin/users/:userId/suspend", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { reason, expiresAt } = req.body;
      const adminUserId = req.user.claims.sub;
      
      if (!reason) {
        return res.status(400).json({ message: "Suspension reason is required" });
      }
      
      const updated = await storage.suspendUser(
        userId, 
        reason, 
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      await storage.createAdminAuditLog(
        adminUserId,
        'suspend_user',
        'user',
        0,
        null,
        { reason, expiresAt },
        `Suspended user: ${reason}`
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Unsuspend user
  app.post("/api/admin/users/:userId/unsuspend", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.claims.sub;
      
      const updated = await storage.unsuspendUser(userId);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'unsuspend_user',
        'user',
        0,
        null,
        null,
        'Removed user suspension'
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });

  // Delete user (super admin only)
  app.delete("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.claims.sub;
      
      const currentAdmin = await storage.getUser(adminUserId);
      if (currentAdmin?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can delete users" });
      }
      
      if (userId === adminUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'delete_user',
        'user',
        0,
        null,
        null,
        'Deleted user account'
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== HOSPITAL MANAGEMENT ====================

  // Get all hospitals with pagination
  app.get("/api/admin/hospitals", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { page, limit, search, verified } = req.query;
      
      if (search) {
        const results = await storage.searchHospitals(search as string);
        res.json({ data: results, total: results.length });
      } else {
        const result = await storage.getHospitalsPaginated({
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
        });
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  // Create hospital
  app.post("/api/admin/hospitals", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const hospital = await storage.createHospital(req.body);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'create_hospital',
        'hospital',
        hospital.id,
        null,
        hospital,
        'Created new hospital'
      );
      
      res.status(201).json(hospital);
    } catch (error) {
      console.error("Error creating hospital:", error);
      res.status(400).json({ message: "Failed to create hospital" });
    }
  });

  // Update hospital
  app.patch("/api/admin/hospitals/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = req.user.claims.sub;
      
      const previous = await storage.getHospitalById(id);
      const updated = await storage.updateHospital(id, req.body);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'update_hospital',
        'hospital',
        id,
        previous,
        updated,
        'Updated hospital details'
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating hospital:", error);
      res.status(500).json({ message: "Failed to update hospital" });
    }
  });

  // Delete hospital
  app.delete("/api/admin/hospitals/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = req.user.claims.sub;
      
      const currentAdmin = await storage.getUser(adminUserId);
      if (currentAdmin?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can delete hospitals" });
      }
      
      const hospital = await storage.getHospitalById(id);
      await storage.deleteHospital(id);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'delete_hospital',
        'hospital',
        id,
        hospital,
        null,
        'Deleted hospital'
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hospital:", error);
      res.status(500).json({ message: "Failed to delete hospital" });
    }
  });

  // Bulk update hospitals
  app.post("/api/admin/hospitals/bulk-update", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ids, verified } = req.body;
      const adminUserId = req.user.claims.sub;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No hospital IDs provided" });
      }
      
      const count = await storage.bulkUpdateHospitalStatus(ids, verified);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'bulk_update_hospitals',
        'hospital',
        0,
        null,
        { ids, verified },
        `Bulk updated ${count} hospitals`
      );
      
      res.json({ success: true, updated: count });
    } catch (error) {
      console.error("Error bulk updating hospitals:", error);
      res.status(500).json({ message: "Failed to bulk update hospitals" });
    }
  });

  // Bulk delete hospitals
  app.post("/api/admin/hospitals/bulk-delete", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ids } = req.body;
      const adminUserId = req.user.claims.sub;
      
      const currentAdmin = await storage.getUser(adminUserId);
      if (currentAdmin?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can bulk delete" });
      }
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No hospital IDs provided" });
      }
      
      const count = await storage.bulkDeleteHospitals(ids);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'bulk_delete_hospitals',
        'hospital',
        0,
        { ids },
        null,
        `Bulk deleted ${count} hospitals`
      );
      
      res.json({ success: true, deleted: count });
    } catch (error) {
      console.error("Error bulk deleting hospitals:", error);
      res.status(500).json({ message: "Failed to bulk delete hospitals" });
    }
  });

  // ==================== BULK REVIEW OPERATIONS ====================

  // Bulk update reviews
  app.post("/api/admin/reviews/bulk-update", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ids, status } = req.body;
      const adminUserId = req.user.claims.sub;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No review IDs provided" });
      }
      
      const count = await storage.bulkUpdateReviewModeration(ids, status, adminUserId);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'bulk_update_reviews',
        'patient_review',
        0,
        null,
        { ids, status },
        `Bulk updated ${count} reviews to ${status}`
      );
      
      res.json({ success: true, updated: count });
    } catch (error) {
      console.error("Error bulk updating reviews:", error);
      res.status(500).json({ message: "Failed to bulk update reviews" });
    }
  });

  // Bulk delete reviews
  app.post("/api/admin/reviews/bulk-delete", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ids } = req.body;
      const adminUserId = req.user.claims.sub;
      
      const currentAdmin = await storage.getUser(adminUserId);
      if (currentAdmin?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can bulk delete reviews" });
      }
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No review IDs provided" });
      }
      
      const count = await storage.bulkDeleteReviews(ids);
      
      await storage.createAdminAuditLog(
        adminUserId,
        'bulk_delete_reviews',
        'patient_review',
        0,
        { ids },
        null,
        `Bulk deleted ${count} reviews`
      );
      
      res.json({ success: true, deleted: count });
    } catch (error) {
      console.error("Error bulk deleting reviews:", error);
      res.status(500).json({ message: "Failed to bulk delete reviews" });
    }
  });

  // ==================== CONTENT MANAGEMENT ====================

  // Get all site content
  app.get("/api/admin/content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const content = await storage.getAllSiteContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Get single content by key
  app.get("/api/admin/content/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const content = await storage.getSiteContentByKey(req.params.key);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Create content
  app.post("/api/admin/content", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const content = await storage.createSiteContent({
        ...req.body,
        updatedBy: adminUserId,
      });
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(400).json({ message: "Failed to create content" });
    }
  });

  // Update content
  app.patch("/api/admin/content/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = req.user.claims.sub;
      const { changeReason, ...data } = req.body;
      
      const updated = await storage.updateSiteContent(id, data, adminUserId, changeReason);
      res.json(updated);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Delete content
  app.delete("/api/admin/content/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSiteContent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Get content history
  app.get("/api/admin/content/:id/history", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getSiteContentHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching content history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // ==================== SITE SETTINGS ====================

  // Get all settings
  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Get settings by category
  app.get("/api/admin/settings/:category", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettingsByCategory(req.params.category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update/create setting
  app.put("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const setting = await storage.upsertSiteSetting({
        ...req.body,
        updatedBy: adminUserId,
      });
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Delete setting
  app.delete("/api/admin/settings/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSiteSetting(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // ==================== EMAIL TEMPLATES ====================

  // Get all email templates
  app.get("/api/admin/email-templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Get template by key
  app.get("/api/admin/email-templates/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const template = await storage.getEmailTemplateByKey(req.params.key);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Create template
  app.post("/api/admin/email-templates", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const template = await storage.createEmailTemplate({
        ...req.body,
        updatedBy: adminUserId,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ message: "Failed to create template" });
    }
  });

  // Update template
  app.patch("/api/admin/email-templates/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = req.user.claims.sub;
      const updated = await storage.updateEmailTemplate(id, req.body, adminUserId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/admin/email-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmailTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // ==================== ACTIVITY LOGS ====================

  // Get admin audit logs
  app.get("/api/admin/activity-logs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { targetType, targetId } = req.query;
      const logs = await storage.getAdminAuditLogs(
        targetType as string,
        targetId ? parseInt(targetId as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Public content endpoint (no auth)
  app.get("/api/content/:key", async (req, res) => {
    try {
      const content = await storage.getSiteContentByKey(req.params.key);
      if (!content || !content.isPublished) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // ==================== TRUST BUILDING ROUTES ====================

  // Get trust stats for homepage
  app.get("/api/trust-stats", async (req, res) => {
    try {
      const stats = await storage.getTrustStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trust stats:", error);
      res.status(500).json({ message: "Failed to fetch trust stats" });
    }
  });

  // Get active testimonials for homepage
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonialsList = await storage.getActiveTestimonials();
      res.json(testimonialsList);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Get active press mentions for homepage
  app.get("/api/press-mentions", async (req, res) => {
    try {
      const mentions = await storage.getActivePressMentions();
      res.json(mentions);
    } catch (error) {
      console.error("Error fetching press mentions:", error);
      res.status(500).json({ message: "Failed to fetch press mentions" });
    }
  });

  // Vote a review as helpful
  app.post("/api/reviews/:id/helpful", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { reviewType = 'patient' } = req.body;
      
      await storage.addHelpfulVote(reviewId, reviewType, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding helpful vote:", error);
      res.status(500).json({ message: "Failed to add helpful vote" });
    }
  });

  // Remove helpful vote from a review
  app.delete("/api/reviews/:id/helpful", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const reviewType = req.query.reviewType || 'patient';
      
      await storage.removeHelpfulVote(reviewId, reviewType as string, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing helpful vote:", error);
      res.status(500).json({ message: "Failed to remove helpful vote" });
    }
  });

  // Get user's helpful votes
  app.get("/api/user/helpful-votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const votes = await storage.getUserHelpfulVotes(userId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching helpful votes:", error);
      res.status(500).json({ message: "Failed to fetch helpful votes" });
    }
  });

  // Get hospital response rate
  app.get("/api/hospitals/:id/response-rate", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const responseRate = await storage.getHospitalResponseRate(hospitalId);
      res.json({ responseRate });
    } catch (error) {
      console.error("Error fetching response rate:", error);
      res.status(500).json({ message: "Failed to fetch response rate" });
    }
  });

  // Get hospital responses (for hospital owners)
  app.get("/api/hospitals/:id/responses", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const responses = await storage.getHospitalResponses(hospitalId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching hospital responses:", error);
      res.status(500).json({ message: "Failed to fetch hospital responses" });
    }
  });

  // Create hospital response to a review (for claimed hospital owners)
  app.post("/api/hospitals/:id/respond-to-review", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { reviewId, reviewType, responseText, responderName, responderTitle } = req.body;
      
      const hospital = await storage.getHospitalById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      
      if (hospital.claimedBy !== userId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to respond for this hospital" });
      }
      
      const response = await storage.createHospitalResponse({
        reviewId,
        reviewType: reviewType || 'patient',
        hospitalId,
        responderId: userId,
        responderName,
        responderTitle,
        responseText,
      });
      
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating hospital response:", error);
      res.status(500).json({ message: "Failed to create hospital response" });
    }
  });

  // Admin routes for testimonials
  app.get("/api/admin/testimonials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const testimonialsList = await storage.getAllTestimonials();
      res.json(testimonialsList);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/admin/testimonials", isAuthenticated, isAdmin, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const testimonial = await storage.createTestimonial(req.body);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(400).json({ message: "Failed to create testimonial" });
    }
  });

  app.patch("/api/admin/testimonials/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTestimonial(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete("/api/admin/testimonials/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTestimonial(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // Admin routes for press mentions
  app.get("/api/admin/press-mentions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mentions = await storage.getAllPressMentions();
      res.json(mentions);
    } catch (error) {
      console.error("Error fetching press mentions:", error);
      res.status(500).json({ message: "Failed to fetch press mentions" });
    }
  });

  app.post("/api/admin/press-mentions", isAuthenticated, isAdmin, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const mention = await storage.createPressMention(req.body);
      res.status(201).json(mention);
    } catch (error) {
      console.error("Error creating press mention:", error);
      res.status(400).json({ message: "Failed to create press mention" });
    }
  });

  app.patch("/api/admin/press-mentions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePressMention(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating press mention:", error);
      res.status(500).json({ message: "Failed to update press mention" });
    }
  });

  app.delete("/api/admin/press-mentions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePressMention(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting press mention:", error);
      res.status(500).json({ message: "Failed to delete press mention" });
    }
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `https://${req.get("host")}`;
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /profile

Sitemap: ${baseUrl}/sitemap.xml

# CareNaija - Hospital Reviews Nigeria
# Find the best hospitals in Lagos, Abuja, and across Nigeria
`);
  });

  // XML Sitemap for SEO
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = `https://${req.get("host")}`;
      const hospitals = await storage.getAllHospitals();
      const today = new Date().toISOString().split("T")[0];

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/search", priority: "0.9", changefreq: "daily" },
        { url: "/guidelines", priority: "0.5", changefreq: "monthly" },
        { url: "/trust-safety", priority: "0.5", changefreq: "monthly" },
        { url: "/support", priority: "0.5", changefreq: "monthly" },
        { url: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
        { url: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }

      for (const hospital of hospitals) {
        const lastmod = hospital.updatedAt 
          ? new Date(hospital.updatedAt).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${baseUrl}/hospital/${hospital.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }

      xml += `</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  return httpServer;
}
