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
} from "@shared/schema";
import crypto from "crypto";

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

  app.post("/api/hospitals/:id/patient-reviews", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/hospitals/:id/employee-reviews", isAuthenticated, async (req: any, res) => {
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
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating employee review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.post("/api/hospital-suggestions", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/hospitals/:id/claim-requests", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/reviews/:id/flag", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/auth/send-verification", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/auth/send-phone-verification", isAuthenticated, async (req: any, res) => {
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

  // Robots.txt for SEO
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
