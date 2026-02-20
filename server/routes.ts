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
  generateHospitalSlug,
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
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.userId);
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
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/hmo-providers", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
      const result = await storage.getDistinctHmoProviders();
      res.json(result);
    } catch (error) {
      console.error("Error fetching HMO providers:", error);
      res.status(500).json({ message: "Failed to fetch HMO providers" });
    }
  });

  app.get("/api/hospitals", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
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

  app.get("/api/hospitals/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const hospital = await storage.getHospitalBySlug(slug);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      res.json(hospital);
    } catch (error) {
      console.error("Error fetching hospital by slug:", error);
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  app.get("/api/hospitals/trending", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      const allHospitals = await storage.getAllHospitals();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const hospitalsWithActivity = await Promise.all(
        allHospitals.map(async (hospital) => {
          const reviews = await storage.getPatientReviewsByHospitalId(hospital.id);
          const recentReviews = reviews.filter((r: any) => 
            r.createdAt && new Date(r.createdAt) >= thirtyDaysAgo
          );
          return {
            ...hospital,
            recentReviewCount: recentReviews.length,
            latestReviewDate: reviews.length > 0 
              ? new Date(Math.max(...reviews.map((r: any) => new Date(r.createdAt || 0).getTime())))
              : null,
          };
        })
      );
      
      const trending = hospitalsWithActivity
        .filter(h => h.recentReviewCount > 0 || (h.totalReviews && h.totalReviews > 0))
        .sort((a, b) => {
          if (b.recentReviewCount !== a.recentReviewCount) {
            return b.recentReviewCount - a.recentReviewCount;
          }
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        })
        .slice(0, 6);
      
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending hospitals:", error);
      res.status(500).json({ message: "Failed to fetch trending hospitals" });
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

      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      res.json(hospital);
    } catch (error) {
      console.error("Error fetching hospital:", error);
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  app.post("/api/hospitals", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertHospitalSchema.parse(req.body);
      if (!validatedData.slug) {
        validatedData.slug = generateHospitalSlug(validatedData.name);
      }
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

      const userId = req.userId;
      const body = { ...req.body };
      if (body.visitDate === "") body.visitDate = null;
      if (body.waitTime === "") body.waitTime = null;
      const validatedData = insertPatientReviewSchema.parse({
        ...body,
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

      const userId = req.userId;
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

  // Hospital Comments/Recommendations
  app.get("/api/hospitals/:id/comments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }
      const comments = await storage.getCommentsByHospitalId(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching hospital comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/hospitals/:id/comments", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }
      const userId = req.userId;
      const user = await storage.getUser(userId);
      const { commentText, recommends, isAnonymous } = req.body;

      if (!commentText || commentText.trim().length < 10) {
        return res.status(400).json({ message: "Comment must be at least 10 characters" });
      }

      const displayName = isAnonymous
        ? "Anonymous"
        : (user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.email?.split("@")[0] || "User");

      const comment = await storage.createHospitalComment({
        hospitalId,
        userId,
        displayName,
        isAnonymous: !!isAnonymous,
        commentText: commentText.trim(),
        recommends: recommends ?? null,
        moderationStatus: "approved",
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating hospital comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/hospitals/:id/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      await storage.deleteHospitalComment(commentId, req.userId);
      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.post("/api/hospital-suggestions", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const userId = req.userId;
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

      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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

      const userId = req.userId;
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

      const userId = req.userId;
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

      const userId = req.userId;
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
      const adminUserId = req.userId;

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
      const adminUserId = req.userId;

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
      const adminUserId = req.userId;

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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
      
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
      const userId = req.userId;
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
      const userId = req.userId;
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

  // Trigger a scraper run
  app.post("/api/admin/scraping/run", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { source, cities, radius } = req.body;
      
      const validSources = ["google_places", "ng_health_directory", "hmo_directory", "all"];
      if (!source || !validSources.includes(source)) {
        return res.status(400).json({ message: "Invalid source. Use: google_places, ng_health_directory, hmo_directory, or all" });
      }

      if (source === "google_places" && !process.env.GOOGLE_PLACES_API_KEY) {
        return res.status(400).json({ message: "Google Places API key not configured" });
      }

      const { isScraperBusy, runScraper } = await import("./scheduler");
      
      if (isScraperBusy()) {
        return res.status(409).json({ message: "A scraper job is already running. Please wait for it to complete." });
      }

      const args: string[] = [];
      let command: string;
      
      if (source === "all") {
        command = "daily";
      } else {
        command = "run";
        args.push("--source", source);
        if (cities && Array.isArray(cities) && cities.length > 0) {
          args.push("--cities", ...cities);
        }
        if (radius) {
          args.push("--radius", String(radius));
        }
      }

      runScraper(command, args);
      res.json({ message: `Scraper job started for ${source}`, status: "running" });
    } catch (error) {
      console.error("Error triggering scraper:", error);
      res.status(500).json({ message: "Failed to start scraper" });
    }
  });

  // Get scraping sources config
  app.get("/api/admin/scraping/sources", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const sources = await storage.getScrapingSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching scraping sources:", error);
      res.status(500).json({ message: "Failed to fetch scraping sources" });
    }
  });

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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.userId);
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
      
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
      const adminUserId = req.userId;
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
      const adminUserId = req.userId;
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
      const adminUserId = req.userId;
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
      const adminUserId = req.userId;
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
      const adminUserId = req.userId;
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
      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=1200");
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
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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
      const userId = req.userId;
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

  // ============================================
  // BLOG SYSTEM ROUTES
  // ============================================

  // Public blog routes
  app.get("/api/blog/articles", async (req, res) => {
    try {
      const { limit, offset, category, type, search } = req.query;
      const result = await storage.getPublishedBlogArticles({
        limit: limit ? parseInt(limit as string) : 10,
        offset: offset ? parseInt(offset as string) : 0,
        categorySlug: category as string,
        articleType: type as string,
        search: search as string,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching blog articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/blog/articles/featured", async (req, res) => {
    try {
      const articles = await storage.getFeaturedBlogArticles(5);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });

  app.get("/api/blog/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getBlogArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      if (article.status !== 'published') {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.incrementBlogArticleViewCount(article.id);
      const tags = await storage.getArticleTags(article.id);
      const category = article.categoryId ? await storage.getBlogCategoryById(article.categoryId) : null;
      const related = await storage.getRelatedBlogArticles(article.id, article.categoryId, 4);
      const comments = await storage.getArticleComments(article.id);
      res.json({ article, tags, category, related, comments });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.get("/api/blog/categories", async (req, res) => {
    try {
      const categories = await storage.getAllBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/blog/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getBlogCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const { limit, offset } = req.query;
      const result = await storage.getPublishedBlogArticles({
        limit: limit ? parseInt(limit as string) : 10,
        offset: offset ? parseInt(offset as string) : 0,
        categorySlug: req.params.slug,
      });
      res.json({ category, ...result });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.get("/api/blog/tags", async (req, res) => {
    try {
      const tags = await storage.getAllBlogTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get("/api/blog/tags/:slug", async (req, res) => {
    try {
      const tag = await storage.getBlogTagBySlug(req.params.slug);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      const { limit, offset } = req.query;
      const result = await storage.getArticlesByTag(
        req.params.slug,
        limit ? parseInt(limit as string) : 10,
        offset ? parseInt(offset as string) : 0
      );
      res.json({ tag, ...result });
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Failed to fetch tag" });
    }
  });

  // Blog comments (authenticated)
  app.post("/api/blog/articles/:slug/comments", isAuthenticated, securityMiddleware.formRateLimiter, async (req: any, res) => {
    try {
      const article = await storage.getBlogArticleBySlug(req.params.slug);
      if (!article || article.status !== 'published') {
        return res.status(404).json({ message: "Article not found" });
      }
      if (!article.allowComments) {
        return res.status(403).json({ message: "Comments are disabled for this article" });
      }
      const user = req.user;
      const comment = await storage.createBlogComment({
        articleId: article.id,
        userId: user.id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
        userAvatarUrl: user.profileImageUrl,
        content: req.body.content,
        parentId: req.body.parentId || null,
        status: 'approved',
      });
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/blog/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getBlogCommentById(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      await storage.deleteBlogComment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Admin blog routes
  app.get("/api/admin/blog/articles", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const articles = await storage.getAllBlogArticles(status as string);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/admin/blog/articles/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getBlogArticleById(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      const tags = await storage.getArticleTags(id);
      res.json({ article, tags });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/admin/blog/articles", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const { tagIds, ...articleData } = req.body;
      
      const readingTime = Math.ceil((articleData.content?.length || 0) / 1000);
      
      const article = await storage.createBlogArticle({
        ...articleData,
        authorId: user.id,
        authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin',
        authorAvatarUrl: user.profileImageUrl,
        readingTimeMinutes: readingTime,
        publishedAt: articleData.status === 'published' ? new Date() : null,
      });
      
      if (tagIds && tagIds.length > 0) {
        await storage.setArticleTags(article.id, tagIds);
      }
      
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.patch("/api/admin/blog/articles/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tagIds, ...articleData } = req.body;
      
      const existing = await storage.getBlogArticleById(id);
      if (!existing) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      if (articleData.status === 'published' && existing.status !== 'published') {
        articleData.publishedAt = new Date();
      }
      
      if (articleData.content) {
        articleData.readingTimeMinutes = Math.ceil(articleData.content.length / 1000);
      }
      
      const article = await storage.updateBlogArticle(id, articleData);
      
      if (tagIds !== undefined) {
        await storage.setArticleTags(id, tagIds);
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/admin/blog/articles/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogArticle(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Admin blog categories
  app.post("/api/admin/blog/categories", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const category = await storage.createBlogCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/admin/blog/categories/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateBlogCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/blog/categories/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin blog tags
  app.post("/api/admin/blog/tags", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const tag = await storage.createBlogTag(req.body);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.patch("/api/admin/blog/tags/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const tag = await storage.updateBlogTag(id, req.body);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/admin/blog/tags/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogTag(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Admin blog comments moderation
  app.get("/api/admin/blog/comments", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const comments = await storage.getAllBlogComments(status as string);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.patch("/api/admin/blog/comments/:id/moderate", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const comment = await storage.moderateBlogComment(id, status);
      res.json(comment);
    } catch (error) {
      console.error("Error moderating comment:", error);
      res.status(500).json({ message: "Failed to moderate comment" });
    }
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `https://${req.get("host")}`;
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Allow: /search
Allow: /hospitals/
Allow: /specialties/
Allow: /guides/
Allow: /health/
Allow: /about
Allow: /help
Allow: /leaderboard
Allow: /compare
Disallow: /api/
Disallow: /admin/
Disallow: /admin/*
Disallow: /dashboard
Disallow: /profile
Disallow: /write-review/
Disallow: /claim-profile/
Disallow: /login

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard
Disallow: /profile
Disallow: /write-review/
Disallow: /claim-profile/
Disallow: /login
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard
Disallow: /profile
Disallow: /write-review/
Disallow: /claim-profile/
Disallow: /login
Crawl-delay: 2

Sitemap: ${baseUrl}/sitemap.xml

# CareNaija - Nigeria's #1 Hospital Review Platform
# Find the best hospitals in Lagos, Abuja, and across all 36 Nigerian states
`);
  });

  // XML Sitemap for SEO
  // ==================== ENGAGEMENT SYSTEM ROUTES ====================

  // Initialize default badges on startup
  storage.seedDefaultBadges().catch(console.error);

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get all badges (for display)
  app.get("/api/badges", async (req, res) => {
    try {
      const badgesList = await storage.getAllBadges();
      res.json(badgesList);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Get current user's engagement profile
  app.get("/api/engagement/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const profile = await storage.getUserEngagementProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching engagement profile:", error);
      res.status(500).json({ message: "Failed to fetch engagement profile" });
    }
  });

  // Get user's engagement profile by ID (public)
  app.get("/api/engagement/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserEngagementProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user engagement profile:", error);
      res.status(500).json({ message: "Failed to fetch engagement profile" });
    }
  });

  // Get user's achievement notifications
  app.get("/api/notifications/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const notifications = await storage.getUserUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/achievements/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/achievements/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications read:", error);
      res.status(500).json({ message: "Failed to mark notifications read" });
    }
  });

  // Get user's referral code
  app.get("/api/referral/code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const code = await storage.generateReferralCode(userId);
      res.json({ code });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  // Get user's referrals
  app.get("/api/referrals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const userReferrals = await storage.getUserReferrals(userId);
      res.json(userReferrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Get current featured reviewer
  app.get("/api/featured-reviewer", async (req, res) => {
    try {
      const featured = await storage.getCurrentFeaturedReviewer();
      res.json(featured || null);
    } catch (error) {
      console.error("Error fetching featured reviewer:", error);
      res.status(500).json({ message: "Failed to fetch featured reviewer" });
    }
  });

  // Get featured reviewer history
  app.get("/api/featured-reviewers/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;
      const history = await storage.getFeaturedReviewerHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching featured reviewer history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Get user's point transactions
  app.get("/api/points/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await storage.getUserPointTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching point transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin: Set featured reviewer
  app.post("/api/admin/featured-reviewer", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, reason, featuredReviewId } = req.body;
      const now = new Date();
      
      const featured = await storage.createFeaturedReviewer({
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        reason,
        featuredReviewId,
        reviewCount: 0,
        helpfulVotes: 0,
        active: true
      });
      
      res.json(featured);
    } catch (error) {
      console.error("Error creating featured reviewer:", error);
      res.status(500).json({ message: "Failed to create featured reviewer" });
    }
  });

  // Admin: Award badge to user
  app.post("/api/admin/award-badge", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, badgeCode } = req.body;
      const badge = await storage.getBadgeByCode(badgeCode);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      const userBadge = await storage.awardBadge(userId, badge.id);
      await storage.createAchievementNotification({
        userId,
        type: 'badge_earned',
        title: `Badge Earned: ${badge.name}`,
        message: badge.description,
        badgeId: badge.id
      });
      
      res.json(userBadge);
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // ==================== HEALTH EDUCATION HUB ====================

  // Get all health categories
  app.get("/api/health/categories", async (req, res) => {
    try {
      const categories = await storage.getAllHealthCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching health categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get category by slug
  app.get("/api/health/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getHealthCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const articles = await storage.getHealthArticlesByCategory(category.id);
      res.json({ category, articles });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get featured articles for hub page
  app.get("/api/health/articles/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await storage.getFeaturedHealthArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });

  // Get popular articles
  app.get("/api/health/articles/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const articles = await storage.getPopularHealthArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching popular articles:", error);
      res.status(500).json({ message: "Failed to fetch popular articles" });
    }
  });

  // Get recent articles
  app.get("/api/health/articles/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const articles = await storage.getRecentHealthArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  // Get editor picks
  app.get("/api/health/articles/editor-picks", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const articles = await storage.getEditorPickHealthArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching editor picks:", error);
      res.status(500).json({ message: "Failed to fetch editor picks" });
    }
  });

  // Search health articles
  app.get("/api/health/articles/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const articles = await storage.searchHealthArticles(query);
      res.json(articles);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // Get article by slug
  app.get("/api/health/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getHealthArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.incrementHealthArticleViews(article.id);
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Get all diseases
  app.get("/api/health/diseases", async (req, res) => {
    try {
      const common = req.query.common === "true";
      const diseasesList = common 
        ? await storage.getCommonDiseases()
        : await storage.getAllDiseases();
      res.json(diseasesList);
    } catch (error) {
      console.error("Error fetching diseases:", error);
      res.status(500).json({ message: "Failed to fetch diseases" });
    }
  });

  // Get disease by slug
  app.get("/api/health/diseases/:slug", async (req, res) => {
    try {
      const disease = await storage.getDiseaseBySlug(req.params.slug);
      if (!disease) {
        return res.status(404).json({ message: "Disease not found" });
      }
      await storage.incrementDiseaseViews(disease.id);
      res.json(disease);
    } catch (error) {
      console.error("Error fetching disease:", error);
      res.status(500).json({ message: "Failed to fetch disease" });
    }
  });

  // Get today's health tip
  app.get("/api/health/tips/today", async (req, res) => {
    try {
      const tip = await storage.getTodayHealthTip();
      res.json(tip || null);
    } catch (error) {
      console.error("Error fetching health tip:", error);
      res.status(500).json({ message: "Failed to fetch health tip" });
    }
  });

  // Subscribe to newsletter
  app.post("/api/health/newsletter/subscribe", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const subscriber = await storage.subscribeNewsletter({ email, name, isActive: true });
      res.json({ success: true, subscriber });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  // Unsubscribe from newsletter
  app.post("/api/health/newsletter/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      await storage.unsubscribeNewsletter(email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Get user's bookmarked articles (requires auth)
  app.get("/api/health/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const bookmarkedArticles = await storage.getUserHealthBookmarks(userId);
      res.json(bookmarkedArticles);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Add bookmark (requires auth)
  app.post("/api/health/bookmarks/:articleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const articleId = parseInt(req.params.articleId);
      await storage.addHealthBookmark(userId, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding bookmark:", error);
      res.status(500).json({ message: "Failed to add bookmark" });
    }
  });

  // Remove bookmark (requires auth)
  app.delete("/api/health/bookmarks/:articleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const articleId = parseInt(req.params.articleId);
      await storage.removeHealthBookmark(userId, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // Check if article is bookmarked (requires auth)
  app.get("/api/health/bookmarks/:articleId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const articleId = parseInt(req.params.articleId);
      const isBookmarked = await storage.isArticleBookmarked(userId, articleId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      res.status(500).json({ message: "Failed to check bookmark" });
    }
  });

  // Seed health data (admin only)
  app.post("/api/admin/health/seed", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.seedHealthCategories();
      await storage.seedCommonDiseases();
      res.json({ success: true, message: "Health data seeded successfully" });
    } catch (error) {
      console.error("Error seeding health data:", error);
      res.status(500).json({ message: "Failed to seed health data" });
    }
  });

  // Admin: Get all health articles
  app.get("/api/admin/health/articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const articles = await storage.getAllHealthArticles(status);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching health articles:", error);
      res.status(500).json({ message: "Failed to fetch health articles" });
    }
  });

  // Admin: Get single health article by ID
  app.get("/api/admin/health/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const article = await storage.getHealthArticleById(parseInt(req.params.id));
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching health article:", error);
      res.status(500).json({ message: "Failed to fetch health article" });
    }
  });

  // Admin: Create health article
  app.post("/api/admin/health/articles", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = {
        ...req.body,
        authorId: userId || null,
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        publishedAt: req.body.status === 'published' ? new Date() : null,
      };
      const article = await storage.createHealthArticle(data);
      res.json(article);
    } catch (error) {
      console.error("Error creating health article:", error);
      res.status(500).json({ message: "Failed to create health article" });
    }
  });

  // Admin: Update health article
  app.patch("/api/admin/health/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingArticle = await storage.getHealthArticleById(id);
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const data = {
        ...req.body,
        publishedAt: req.body.status === 'published' && !existingArticle.publishedAt 
          ? new Date() 
          : existingArticle.publishedAt,
      };
      
      const article = await storage.updateHealthArticle(id, data);
      res.json(article);
    } catch (error) {
      console.error("Error updating health article:", error);
      res.status(500).json({ message: "Failed to update health article" });
    }
  });

  // Admin: Delete health article
  app.delete("/api/admin/health/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHealthArticle(id);
      if (!deleted) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting health article:", error);
      res.status(500).json({ message: "Failed to delete health article" });
    }
  });

  // Admin: Get health categories
  app.get("/api/admin/health/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllHealthCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching health categories:", error);
      res.status(500).json({ message: "Failed to fetch health categories" });
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://www.carenaija.com";
      const hospitals = await storage.getAllHospitals();
      const today = new Date().toISOString().split("T")[0];

      // Nigerian states for search pages
      const nigerianStates = [
        "Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Kaduna", "Ogun", "Edo", 
        "Delta", "Enugu", "Anambra", "Imo", "Akwa Ibom", "Cross River", 
        "Abia", "Kwara", "Plateau", "Benue", "Osun", "Ondo", "Ekiti",
        "Bayelsa", "Adamawa", "Borno", "Gombe", "Bauchi", "Taraba",
        "Niger", "Kogi", "Nasarawa", "Sokoto", "Kebbi", "Zamfara",
        "Katsina", "Jigawa", "Yobe", "Ebonyi"
      ];

      const specialties = [
        "cardiology", "maternity", "orthopedics", "neurology",
        "eye-care", "pediatrics", "dental", "general-medicine"
      ];

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/search", priority: "0.6", changefreq: "daily" },
        { url: "/guides", priority: "0.8", changefreq: "daily" },
        { url: "/health", priority: "0.8", changefreq: "daily" },
        { url: "/health/diseases", priority: "0.8", changefreq: "weekly" },
        { url: "/specialties", priority: "0.8", changefreq: "weekly" },
        ...specialties.map(s => ({ url: `/specialties/${s}`, priority: "0.7", changefreq: "weekly" as const })),
        { url: "/about", priority: "0.7", changefreq: "monthly" },
        { url: "/help", priority: "0.7", changefreq: "weekly" },
        { url: "/leaderboard", priority: "0.6", changefreq: "daily" },
        { url: "/compare", priority: "0.6", changefreq: "daily" },
        { url: "/guidelines", priority: "0.5", changefreq: "monthly" },
        { url: "/trust-safety", priority: "0.5", changefreq: "monthly" },
        { url: "/support", priority: "0.5", changefreq: "monthly" },
        { url: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
        { url: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
      ];

      const statePages = nigerianStates.map(state => ({
        url: `/hospitals/${state.toLowerCase().replace(/\s+/g, '-')}`,
        priority: "0.9",
        changefreq: "daily"
      }));

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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

      for (const page of statePages) {
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
        const stateSlug = hospital.state.toLowerCase().replace(/\s+/g, '-');
        const hospitalPath = hospital.slug 
          ? `/hospitals/${stateSlug}/${hospital.slug}`
          : `/hospital/${hospital.id}`;
        xml += `  <url>
    <loc>${baseUrl}${hospitalPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }

      const blogArticles = await storage.getAllBlogArticles("published");
      for (const article of blogArticles) {
        const lastmod = article.updatedAt 
          ? new Date(article.updatedAt).toISOString().split("T")[0]
          : article.publishedAt
          ? new Date(article.publishedAt).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${baseUrl}/guides/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }

      const categories = await storage.getAllBlogCategories();
      for (const category of categories) {
        xml += `  <url>
    <loc>${baseUrl}/guides/category/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }

      // Health articles
      const healthArticles = await storage.getAllHealthArticles("published");
      for (const article of healthArticles) {
        const lastmod = article.updatedAt 
          ? new Date(article.updatedAt).toISOString().split("T")[0]
          : article.publishedAt
          ? new Date(article.publishedAt).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${baseUrl}/health/article/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }

      // Health categories
      const healthCategories = await storage.getAllHealthCategories();
      for (const category of healthCategories) {
        xml += `  <url>
    <loc>${baseUrl}/health/category/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }

      // Individual diseases
      const diseases = await storage.getAllDiseases();
      for (const disease of diseases) {
        const lastmod = disease.updatedAt 
          ? new Date(disease.updatedAt).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${baseUrl}/health/disease/${disease.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
