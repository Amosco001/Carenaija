import {
  users,
  hospitals,
  patientReviews,
  employeeReviews,
  hospitalSuggestions,
  claimRequests,
  bookmarks,
  reviewFlags,
  verificationTokens,
  spamKeywords,
  ipTracking,
  adminAuditLog,
  pendingHospitals,
  scrapingJobs,
  scrapingLogs,
  emailPreferences,
  followedHospitals,
  emailOutbox,
  userReviewStats,
  reviewResponses,
  type User,
  type UpsertUser,
  type Hospital,
  type InsertHospital,
  type PatientReview,
  type InsertPatientReview,
  type EmployeeReview,
  type InsertEmployeeReview,
  type HospitalSuggestion,
  type InsertHospitalSuggestion,
  type ClaimRequest,
  type InsertClaimRequest,
  type Bookmark,
  type InsertBookmark,
  type ReviewFlag,
  type InsertReviewFlag,
  type VerificationToken,
  type InsertVerificationToken,
  type SpamKeyword,
  type InsertSpamKeyword,
  type IpTracking,
  type AdminAuditLog,
  type PendingHospital,
  type InsertPendingHospital,
  type ScrapingJob,
  type ScrapingLog,
  type EmailPreferences,
  type InsertEmailPreferences,
  type FollowedHospital,
  type InsertFollowedHospital,
  type EmailOutbox,
  type InsertEmailOutbox,
  type UserReviewStats,
  type ReviewResponse,
  type InsertReviewResponse,
  unverifiedSubmissions,
  type UnverifiedSubmission,
  type InsertUnverifiedSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, ilike, or, desc, count, gte, inArray } from "drizzle-orm";
import memoizee from "memoizee";

const CACHE_TTL = 60000;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllHospitals(): Promise<Hospital[]>;
  getHospitalsPaginated(params: PaginationParams): Promise<PaginatedResult<Hospital>>;
  getHospitalById(id: number): Promise<Hospital | undefined>;
  searchHospitals(query: string): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: number, hospital: Partial<InsertHospital>): Promise<Hospital | undefined>;
  
  getAllPatientReviews(): Promise<PatientReview[]>;
  getPatientReviewsByHospitalId(hospitalId: number): Promise<PatientReview[]>;
  createPatientReview(review: InsertPatientReview): Promise<PatientReview>;
  
  getEmployeeReviewsByHospitalId(hospitalId: number): Promise<EmployeeReview[]>;
  createEmployeeReview(review: InsertEmployeeReview): Promise<EmployeeReview>;
  
  createHospitalSuggestion(suggestion: InsertHospitalSuggestion): Promise<HospitalSuggestion>;
  getAllHospitalSuggestions(): Promise<HospitalSuggestion[]>;
  
  createClaimRequest(request: InsertClaimRequest): Promise<ClaimRequest>;
  getClaimRequestsByHospitalId(hospitalId: number): Promise<ClaimRequest[]>;
  
  getUserBookmarks(userId: string): Promise<(Bookmark & { hospital: Hospital })[]>;
  addBookmark(userId: string, hospitalId: number): Promise<Bookmark>;
  removeBookmark(userId: string, hospitalId: number): Promise<void>;
  isBookmarked(userId: string, hospitalId: number): Promise<boolean>;
  
  getUserPatientReviews(userId: string): Promise<(PatientReview & { hospital: Hospital })[]>;
  getUserEmployeeReviews(userId: string): Promise<(EmployeeReview & { hospital: Hospital })[]>;
  
  updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User>;
  
  // Verification methods
  createVerificationToken(token: InsertVerificationToken): Promise<VerificationToken>;
  getVerificationToken(token: string, type: string): Promise<VerificationToken | undefined>;
  consumeVerificationToken(tokenId: number): Promise<void>;
  
  // Review flagging methods
  createReviewFlag(flag: InsertReviewFlag): Promise<ReviewFlag>;
  getReviewFlags(status?: string): Promise<ReviewFlag[]>;
  getReviewFlagsByReviewId(reviewId: number): Promise<ReviewFlag[]>;
  updateReviewFlagStatus(flagId: number, status: string, resolvedBy: string, resolution: string): Promise<ReviewFlag>;
  
  // Review moderation methods
  updateReviewModerationStatus(reviewId: number, status: string, reviewedBy: string): Promise<PatientReview>;
  getReviewsForModeration(status?: string): Promise<PatientReview[]>;
  updateReviewVerificationStatus(reviewId: number, status: string, proofUrl?: string, proofType?: string): Promise<PatientReview>;
  
  // IP tracking methods
  trackIp(ip: string, userId: string | null, action: string, resourceType?: string, resourceId?: number): Promise<void>;
  getIpActivityCount(ip: string, action: string, hoursAgo: number): Promise<number>;
  
  // Spam keywords methods
  getAllSpamKeywords(): Promise<SpamKeyword[]>;
  createSpamKeyword(keyword: InsertSpamKeyword): Promise<SpamKeyword>;
  updateSpamKeyword(id: number, active: boolean): Promise<SpamKeyword>;
  
  // Review limit check
  canUserReviewHospital(userId: string, hospitalId: number): Promise<boolean>;
  getLastUserReviewForHospital(userId: string, hospitalId: number): Promise<PatientReview | undefined>;
  
  // Admin methods
  getAdminUsers(): Promise<User[]>;
  createAdminAuditLog(adminUserId: string, action: string, targetType: string, targetId: number, previousState?: unknown, newState?: unknown, notes?: string): Promise<void>;
  getAdminAuditLogs(targetType?: string, targetId?: number): Promise<AdminAuditLog[]>;
  
  // Pending hospitals (scraped) methods
  getPendingHospitals(status?: string): Promise<PendingHospital[]>;
  getPendingHospitalById(id: number): Promise<PendingHospital | undefined>;
  updatePendingHospitalStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<PendingHospital>;
  approvePendingHospital(id: number, reviewedBy: string): Promise<Hospital>;
  getPendingHospitalsStats(): Promise<{ pending: number; approved: number; rejected: number; duplicate: number }>;
  
  // Scraping jobs methods
  getScrapingJobs(limit?: number): Promise<ScrapingJob[]>;
  getScrapingLogs(jobId: number): Promise<ScrapingLog[]>;
  
  // Unverified submissions (news/social media discoveries) methods
  getUnverifiedSubmissions(status?: string): Promise<UnverifiedSubmission[]>;
  getUnverifiedSubmissionById(id: number): Promise<UnverifiedSubmission | undefined>;
  updateUnverifiedSubmissionStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<UnverifiedSubmission>;
  promoteUnverifiedSubmission(id: number, reviewedBy: string): Promise<Hospital>;
  getUnverifiedSubmissionsStats(): Promise<{ pending: number; verified: number; ignored: number; promoted: number }>;
  
  // Analytics methods
  getAnalyticsSummary(): Promise<{
    totalHospitals: number;
    totalReviews: number;
    totalUsers: number;
    avgRating: number;
    pendingReviews: number;
    verifiedReviews: number;
  }>;
  getReviewsOverTime(days: number): Promise<{ date: string; count: number }[]>;
  getTopRatedHospitals(limit: number, city?: string): Promise<Hospital[]>;
  getMostReviewedHospitals(limit: number): Promise<(Hospital & { reviewCount: number })[]>;
  getAverageRatingsByCategory(): Promise<{ category: string; average: number }[]>;
  getRecentActivity(limit: number): Promise<any[]>;
  getHospitalsByState(): Promise<{ state: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  private _getAllHospitalsUncached = async (): Promise<Hospital[]> => {
    return await db.select().from(hospitals).orderBy(hospitals.name);
  };

  getAllHospitals = memoizee(this._getAllHospitalsUncached, {
    promise: true,
    maxAge: CACHE_TTL,
    preFetch: true,
  });

  async getHospitalsPaginated(params: PaginationParams): Promise<PaginatedResult<Hospital>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const [totalResult] = await db.select({ count: count() }).from(hospitals);
    const total = totalResult?.count || 0;

    const data = await db
      .select()
      .from(hospitals)
      .orderBy(hospitals.name)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private _getHospitalByIdUncached = async (id: number): Promise<Hospital | undefined> => {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  };

  getHospitalById = memoizee(this._getHospitalByIdUncached, {
    promise: true,
    maxAge: CACHE_TTL,
    preFetch: true,
  });

  async searchHospitals(query: string): Promise<Hospital[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(hospitals)
      .where(
        or(
          ilike(hospitals.name, searchPattern),
          ilike(hospitals.address, searchPattern),
          ilike(hospitals.lga, searchPattern),
        )
      )
      .orderBy(hospitals.name);
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [newHospital] = await db.insert(hospitals).values(hospital).returning();
    this.getAllHospitals.clear();
    return newHospital;
  }

  async updateHospital(id: number, hospital: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const [updated] = await db
      .update(hospitals)
      .set({ ...hospital, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    this.getAllHospitals.clear();
    this.getHospitalById.delete(id);
    return updated;
  }

  async getAllPatientReviews(): Promise<PatientReview[]> {
    return await db
      .select()
      .from(patientReviews)
      .orderBy(desc(patientReviews.createdAt))
      .limit(50);
  }

  async getPatientReviewsByHospitalId(hospitalId: number): Promise<PatientReview[]> {
    return await db
      .select()
      .from(patientReviews)
      .where(eq(patientReviews.hospitalId, hospitalId))
      .orderBy(desc(patientReviews.createdAt));
  }

  async createPatientReview(review: InsertPatientReview): Promise<PatientReview> {
    const [newReview] = await db.insert(patientReviews).values(review).returning();
    return newReview;
  }

  async getEmployeeReviewsByHospitalId(hospitalId: number): Promise<EmployeeReview[]> {
    return await db
      .select()
      .from(employeeReviews)
      .where(eq(employeeReviews.hospitalId, hospitalId))
      .orderBy(desc(employeeReviews.createdAt));
  }

  async createEmployeeReview(review: InsertEmployeeReview): Promise<EmployeeReview> {
    const [newReview] = await db.insert(employeeReviews).values(review).returning();
    return newReview;
  }

  async createHospitalSuggestion(suggestion: InsertHospitalSuggestion): Promise<HospitalSuggestion> {
    const [newSuggestion] = await db.insert(hospitalSuggestions).values(suggestion).returning();
    return newSuggestion;
  }

  async getAllHospitalSuggestions(): Promise<HospitalSuggestion[]> {
    return await db
      .select()
      .from(hospitalSuggestions)
      .orderBy(desc(hospitalSuggestions.createdAt));
  }

  async createClaimRequest(request: InsertClaimRequest): Promise<ClaimRequest> {
    const [newRequest] = await db.insert(claimRequests).values(request).returning();
    return newRequest;
  }

  async getClaimRequestsByHospitalId(hospitalId: number): Promise<ClaimRequest[]> {
    return await db
      .select()
      .from(claimRequests)
      .where(eq(claimRequests.hospitalId, hospitalId))
      .orderBy(desc(claimRequests.createdAt));
  }

  async getUserBookmarks(userId: string): Promise<(Bookmark & { hospital: Hospital })[]> {
    const results = await db
      .select()
      .from(bookmarks)
      .innerJoin(hospitals, eq(bookmarks.hospitalId, hospitals.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
    
    return results.map(r => ({
      ...r.bookmarks,
      hospital: r.hospitals,
    }));
  }

  async addBookmark(userId: string, hospitalId: number): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({ userId, hospitalId })
      .onConflictDoNothing()
      .returning();
    return bookmark;
  }

  async removeBookmark(userId: string, hospitalId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.hospitalId, hospitalId)));
  }

  async isBookmarked(userId: string, hospitalId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.hospitalId, hospitalId)));
    return !!bookmark;
  }

  async getUserPatientReviews(userId: string): Promise<(PatientReview & { hospital: Hospital })[]> {
    const results = await db
      .select()
      .from(patientReviews)
      .innerJoin(hospitals, eq(patientReviews.hospitalId, hospitals.id))
      .where(eq(patientReviews.userId, userId))
      .orderBy(desc(patientReviews.createdAt));
    
    return results.map(r => ({
      ...r.patient_reviews,
      hospital: r.hospitals,
    }));
  }

  async getUserEmployeeReviews(userId: string): Promise<(EmployeeReview & { hospital: Hospital })[]> {
    const results = await db
      .select()
      .from(employeeReviews)
      .innerJoin(hospitals, eq(employeeReviews.hospitalId, hospitals.id))
      .where(eq(employeeReviews.userId, userId))
      .orderBy(desc(employeeReviews.createdAt));
    
    return results.map(r => ({
      ...r.employee_reviews,
      hospital: r.hospitals,
    }));
  }

  async updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Verification Token Methods
  async createVerificationToken(token: InsertVerificationToken): Promise<VerificationToken> {
    const [newToken] = await db.insert(verificationTokens).values(token).returning();
    return newToken;
  }

  async getVerificationToken(token: string, type: string): Promise<VerificationToken | undefined> {
    const [result] = await db
      .select()
      .from(verificationTokens)
      .where(and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, type),
        gte(verificationTokens.expiresAt, new Date())
      ));
    return result;
  }

  async consumeVerificationToken(tokenId: number): Promise<void> {
    await db
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, tokenId));
  }

  // Review Flag Methods
  async createReviewFlag(flag: InsertReviewFlag): Promise<ReviewFlag> {
    const [newFlag] = await db.insert(reviewFlags).values(flag).returning();
    return newFlag;
  }

  async getReviewFlags(status?: string): Promise<ReviewFlag[]> {
    if (status) {
      return await db
        .select()
        .from(reviewFlags)
        .where(eq(reviewFlags.status, status))
        .orderBy(desc(reviewFlags.createdAt));
    }
    return await db.select().from(reviewFlags).orderBy(desc(reviewFlags.createdAt));
  }

  async getReviewFlagsByReviewId(reviewId: number): Promise<ReviewFlag[]> {
    return await db
      .select()
      .from(reviewFlags)
      .where(eq(reviewFlags.reviewId, reviewId))
      .orderBy(desc(reviewFlags.createdAt));
  }

  async updateReviewFlagStatus(flagId: number, status: string, resolvedBy: string, resolution: string): Promise<ReviewFlag> {
    const [updated] = await db
      .update(reviewFlags)
      .set({ status, resolvedBy, resolution, resolvedAt: new Date() })
      .where(eq(reviewFlags.id, flagId))
      .returning();
    return updated;
  }

  // Review Moderation Methods
  async updateReviewModerationStatus(reviewId: number, status: string, reviewedBy: string): Promise<PatientReview> {
    const [updated] = await db
      .update(patientReviews)
      .set({ moderationStatus: status, reviewedBy, reviewedAt: new Date() })
      .where(eq(patientReviews.id, reviewId))
      .returning();
    return updated;
  }

  async getReviewsForModeration(status?: string): Promise<PatientReview[]> {
    if (status) {
      return await db
        .select()
        .from(patientReviews)
        .where(eq(patientReviews.moderationStatus, status))
        .orderBy(desc(patientReviews.createdAt));
    }
    return await db
      .select()
      .from(patientReviews)
      .where(inArray(patientReviews.moderationStatus, ['pending', 'flagged', 'under_review']))
      .orderBy(desc(patientReviews.createdAt));
  }

  async updateReviewVerificationStatus(reviewId: number, status: string, proofUrl?: string, proofType?: string): Promise<PatientReview> {
    const updateData: Record<string, unknown> = { verificationStatus: status };
    if (proofUrl) updateData.proofAttachmentUrl = proofUrl;
    if (proofType) updateData.proofType = proofType;
    if (status === 'verified') updateData.verifiedVisit = true;
    
    const [updated] = await db
      .update(patientReviews)
      .set(updateData)
      .where(eq(patientReviews.id, reviewId))
      .returning();
    return updated;
  }

  // IP Tracking Methods
  async trackIp(ip: string, userId: string | null, action: string, resourceType?: string, resourceId?: number): Promise<void> {
    await db.insert(ipTracking).values({
      ipAddress: ip,
      userId,
      action,
      resourceType,
      resourceId,
    });
  }

  async getIpActivityCount(ip: string, action: string, hoursAgo: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const [result] = await db
      .select({ count: count() })
      .from(ipTracking)
      .where(and(
        eq(ipTracking.ipAddress, ip),
        eq(ipTracking.action, action),
        gte(ipTracking.createdAt, cutoffTime)
      ));
    return result?.count || 0;
  }

  // Spam Keywords Methods
  async getAllSpamKeywords(): Promise<SpamKeyword[]> {
    return await db
      .select()
      .from(spamKeywords)
      .where(eq(spamKeywords.active, true));
  }

  async createSpamKeyword(keyword: InsertSpamKeyword): Promise<SpamKeyword> {
    const [newKeyword] = await db.insert(spamKeywords).values(keyword).returning();
    return newKeyword;
  }

  async updateSpamKeyword(id: number, active: boolean): Promise<SpamKeyword> {
    const [updated] = await db
      .update(spamKeywords)
      .set({ active })
      .where(eq(spamKeywords.id, id))
      .returning();
    return updated;
  }

  // Review Limit Methods
  async canUserReviewHospital(userId: string, hospitalId: number): Promise<boolean> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const [existingReview] = await db
      .select()
      .from(patientReviews)
      .where(and(
        eq(patientReviews.userId, userId),
        eq(patientReviews.hospitalId, hospitalId),
        gte(patientReviews.createdAt, oneYearAgo)
      ))
      .limit(1);
    
    return !existingReview;
  }

  async getLastUserReviewForHospital(userId: string, hospitalId: number): Promise<PatientReview | undefined> {
    const [review] = await db
      .select()
      .from(patientReviews)
      .where(and(
        eq(patientReviews.userId, userId),
        eq(patientReviews.hospitalId, hospitalId)
      ))
      .orderBy(desc(patientReviews.createdAt))
      .limit(1);
    return review;
  }

  // Admin Methods
  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true));
  }

  async createAdminAuditLog(
    adminUserId: string,
    action: string,
    targetType: string,
    targetId: number,
    previousState?: unknown,
    newState?: unknown,
    notes?: string
  ): Promise<void> {
    await db.insert(adminAuditLog).values({
      adminUserId,
      action,
      targetType,
      targetId,
      previousState,
      newState,
      notes,
    });
  }

  async getAdminAuditLogs(targetType?: string, targetId?: number): Promise<AdminAuditLog[]> {
    if (targetType && targetId) {
      return await db
        .select()
        .from(adminAuditLog)
        .where(and(
          eq(adminAuditLog.targetType, targetType),
          eq(adminAuditLog.targetId, targetId)
        ))
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(100);
    }
    return await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(100);
  }

  // Pending Hospitals Methods (Scraped Data)
  async getPendingHospitals(status?: string): Promise<PendingHospital[]> {
    if (status) {
      return await db
        .select()
        .from(pendingHospitals)
        .where(eq(pendingHospitals.status, status))
        .orderBy(desc(pendingHospitals.createdAt))
        .limit(200);
    }
    return await db
      .select()
      .from(pendingHospitals)
      .orderBy(desc(pendingHospitals.createdAt))
      .limit(200);
  }

  async getPendingHospitalById(id: number): Promise<PendingHospital | undefined> {
    const [hospital] = await db
      .select()
      .from(pendingHospitals)
      .where(eq(pendingHospitals.id, id));
    return hospital;
  }

  async updatePendingHospitalStatus(
    id: number,
    status: string,
    reviewedBy: string,
    notes?: string
  ): Promise<PendingHospital> {
    const [updated] = await db
      .update(pendingHospitals)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      })
      .where(eq(pendingHospitals.id, id))
      .returning();
    return updated;
  }

  async approvePendingHospital(id: number, reviewedBy: string): Promise<Hospital> {
    const pending = await this.getPendingHospitalById(id);
    if (!pending) {
      throw new Error("Pending hospital not found");
    }

    const [newHospital] = await db
      .insert(hospitals)
      .values({
        name: pending.name,
        address: pending.address || "",
        city: pending.city || null,
        lga: pending.lga || pending.city || "Unknown",
        state: pending.state || "Lagos",
        phone: pending.phone || null,
        email: pending.email || null,
        website: pending.website || null,
        ownership: pending.ownership || "Private",
        services: pending.services || [],
        facilities: [],
        latitude: pending.latitude || null,
        longitude: pending.longitude || null,
        verified: false,
      })
      .returning();

    await this.updatePendingHospitalStatus(id, "approved", reviewedBy);

    return newHospital;
  }

  async getPendingHospitalsStats(): Promise<{ pending: number; approved: number; rejected: number; duplicate: number }> {
    const [pendingCount] = await db
      .select({ count: count() })
      .from(pendingHospitals)
      .where(eq(pendingHospitals.status, "pending"));
    
    const [approvedCount] = await db
      .select({ count: count() })
      .from(pendingHospitals)
      .where(eq(pendingHospitals.status, "approved"));
    
    const [rejectedCount] = await db
      .select({ count: count() })
      .from(pendingHospitals)
      .where(eq(pendingHospitals.status, "rejected"));
    
    const [duplicateCount] = await db
      .select({ count: count() })
      .from(pendingHospitals)
      .where(eq(pendingHospitals.status, "duplicate"));

    return {
      pending: pendingCount?.count || 0,
      approved: approvedCount?.count || 0,
      rejected: rejectedCount?.count || 0,
      duplicate: duplicateCount?.count || 0,
    };
  }

  // Scraping Jobs Methods
  async getScrapingJobs(limit: number = 50): Promise<ScrapingJob[]> {
    return await db
      .select()
      .from(scrapingJobs)
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(limit);
  }

  async getScrapingLogs(jobId: number): Promise<ScrapingLog[]> {
    return await db
      .select()
      .from(scrapingLogs)
      .where(eq(scrapingLogs.jobId, jobId))
      .orderBy(desc(scrapingLogs.createdAt))
      .limit(500);
  }

  // Unverified Submissions Methods
  async getUnverifiedSubmissions(status?: string): Promise<UnverifiedSubmission[]> {
    if (status) {
      return await db
        .select()
        .from(unverifiedSubmissions)
        .where(eq(unverifiedSubmissions.status, status))
        .orderBy(desc(unverifiedSubmissions.createdAt))
        .limit(100);
    }
    return await db
      .select()
      .from(unverifiedSubmissions)
      .orderBy(desc(unverifiedSubmissions.createdAt))
      .limit(100);
  }

  async getUnverifiedSubmissionById(id: number): Promise<UnverifiedSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(unverifiedSubmissions)
      .where(eq(unverifiedSubmissions.id, id));
    return submission;
  }

  async updateUnverifiedSubmissionStatus(
    id: number,
    status: string,
    reviewedBy: string,
    notes?: string
  ): Promise<UnverifiedSubmission> {
    const [updated] = await db
      .update(unverifiedSubmissions)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes,
      })
      .where(eq(unverifiedSubmissions.id, id))
      .returning();
    return updated;
  }

  async promoteUnverifiedSubmission(id: number, reviewedBy: string): Promise<Hospital> {
    const submission = await this.getUnverifiedSubmissionById(id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const [newHospital] = await db
      .insert(hospitals)
      .values({
        name: submission.hospitalName || "Unknown Hospital",
        address: "",
        city: submission.city || null,
        lga: submission.city || "Unknown",
        state: submission.state || "Lagos",
        phone: null,
        email: null,
        website: null,
        ownership: "Private",
        services: submission.servicesDetected || [],
        facilities: [],
        latitude: null,
        longitude: null,
        verified: false,
      })
      .returning();

    await db
      .update(unverifiedSubmissions)
      .set({
        status: "promoted",
        promotedToHospitalId: newHospital.id,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(unverifiedSubmissions.id, id));

    return newHospital;
  }

  async getUnverifiedSubmissionsStats(): Promise<{ pending: number; verified: number; ignored: number; promoted: number }> {
    const [pendingCount] = await db
      .select({ count: count() })
      .from(unverifiedSubmissions)
      .where(eq(unverifiedSubmissions.status, "pending"));
    
    const [verifiedCount] = await db
      .select({ count: count() })
      .from(unverifiedSubmissions)
      .where(eq(unverifiedSubmissions.status, "verified"));
    
    const [ignoredCount] = await db
      .select({ count: count() })
      .from(unverifiedSubmissions)
      .where(eq(unverifiedSubmissions.status, "ignored"));
    
    const [promotedCount] = await db
      .select({ count: count() })
      .from(unverifiedSubmissions)
      .where(eq(unverifiedSubmissions.status, "promoted"));

    return {
      pending: pendingCount?.count || 0,
      verified: verifiedCount?.count || 0,
      ignored: ignoredCount?.count || 0,
      promoted: promotedCount?.count || 0,
    };
  }

  // Analytics Methods
  async getAnalyticsSummary(): Promise<{
    totalHospitals: number;
    totalReviews: number;
    totalUsers: number;
    avgRating: number;
    pendingReviews: number;
    verifiedReviews: number;
  }> {
    const [hospitalCount] = await db.select({ count: count() }).from(hospitals);
    const [reviewCount] = await db.select({ count: count() }).from(patientReviews);
    const [userCount] = await db.select({ count: count() }).from(users);
    
    const [avgResult] = await db
      .select({ avg: sql<number>`COALESCE(AVG(overall_rating), 0)` })
      .from(patientReviews);
    
    const [pendingCount] = await db
      .select({ count: count() })
      .from(patientReviews)
      .where(eq(patientReviews.moderationStatus, "pending"));
    
    const [verifiedCount] = await db
      .select({ count: count() })
      .from(patientReviews)
      .where(eq(patientReviews.verificationStatus, "verified"));

    return {
      totalHospitals: hospitalCount?.count || 0,
      totalReviews: reviewCount?.count || 0,
      totalUsers: userCount?.count || 0,
      avgRating: Number(avgResult?.avg) || 0,
      pendingReviews: pendingCount?.count || 0,
      verifiedReviews: verifiedCount?.count || 0,
    };
  }

  async getReviewsOverTime(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        date: sql<string>`DATE(created_at)::text`,
        count: count(),
      })
      .from(patientReviews)
      .where(gte(patientReviews.createdAt, startDate))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);
    
    return result.map(r => ({ date: r.date, count: r.count }));
  }

  async getTopRatedHospitals(limit: number, city?: string): Promise<Hospital[]> {
    let query = db.select().from(hospitals);
    
    if (city) {
      return await db
        .select()
        .from(hospitals)
        .where(ilike(hospitals.city, `%${city}%`))
        .orderBy(desc(hospitals.averageRating))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(hospitals)
      .orderBy(desc(hospitals.averageRating))
      .limit(limit);
  }

  async getMostReviewedHospitals(limit: number): Promise<(Hospital & { reviewCount: number })[]> {
    const result = await db
      .select({
        hospital: hospitals,
        reviewCount: count(patientReviews.id),
      })
      .from(hospitals)
      .leftJoin(patientReviews, eq(hospitals.id, patientReviews.hospitalId))
      .groupBy(hospitals.id)
      .orderBy(desc(count(patientReviews.id)))
      .limit(limit);
    
    return result.map(r => ({
      ...r.hospital,
      reviewCount: r.reviewCount,
    }));
  }

  async getAverageRatingsByCategory(): Promise<{ category: string; average: number }[]> {
    const careQuality = await db
      .select({ avg: sql<number>`COALESCE(AVG(care_quality), 0)` })
      .from(patientReviews);
    
    const staffAttitude = await db
      .select({ avg: sql<number>`COALESCE(AVG(staff_attitude), 0)` })
      .from(patientReviews);
    
    const cleanliness = await db
      .select({ avg: sql<number>`COALESCE(AVG(cleanliness), 0)` })
      .from(patientReviews);
    
    const waitTime = await db
      .select({ avg: sql<number>`COALESCE(AVG(wait_time), 0)` })
      .from(patientReviews);
    
    const valueForMoney = await db
      .select({ avg: sql<number>`COALESCE(AVG(value_for_money), 0)` })
      .from(patientReviews);

    return [
      { category: "Care Quality", average: Number(careQuality[0]?.avg) || 0 },
      { category: "Staff Attitude", average: Number(staffAttitude[0]?.avg) || 0 },
      { category: "Cleanliness", average: Number(cleanliness[0]?.avg) || 0 },
      { category: "Wait Time", average: Number(waitTime[0]?.avg) || 0 },
      { category: "Value for Money", average: Number(valueForMoney[0]?.avg) || 0 },
    ];
  }

  async getRecentActivity(limit: number): Promise<any[]> {
    const reviews = await db
      .select({
        id: patientReviews.id,
        type: sql<string>`'review'`,
        title: patientReviews.title,
        createdAt: patientReviews.createdAt,
        hospitalId: patientReviews.hospitalId,
        userId: patientReviews.userId,
      })
      .from(patientReviews)
      .orderBy(desc(patientReviews.createdAt))
      .limit(limit);
    
    return reviews;
  }

  async getHospitalsByState(): Promise<{ state: string; count: number }[]> {
    const result = await db
      .select({
        state: hospitals.state,
        count: count(),
      })
      .from(hospitals)
      .groupBy(hospitals.state)
      .orderBy(desc(count()));
    
    return result.map(r => ({ state: r.state, count: r.count }));
  }

  // Email preferences methods
  async getEmailPreferences(userId: string): Promise<EmailPreferences | undefined> {
    const [prefs] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId));
    return prefs;
  }

  async createEmailPreferences(userId: string): Promise<EmailPreferences> {
    const [prefs] = await db.insert(emailPreferences).values({ userId }).returning();
    return prefs;
  }

  async updateEmailPreferences(userId: string, data: Partial<InsertEmailPreferences>): Promise<EmailPreferences> {
    const [prefs] = await db
      .update(emailPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailPreferences.userId, userId))
      .returning();
    return prefs;
  }

  async getEmailPreferencesByToken(token: string): Promise<EmailPreferences | undefined> {
    const [prefs] = await db.select().from(emailPreferences).where(eq(emailPreferences.unsubscribeToken, token));
    return prefs;
  }

  // Followed hospitals methods
  async getFollowedHospitals(userId: string): Promise<(FollowedHospital & { hospital: Hospital })[]> {
    const follows = await db.select().from(followedHospitals).where(eq(followedHospitals.userId, userId));
    const hospitalIds = follows.map(f => f.hospitalId);
    if (hospitalIds.length === 0) return [];
    
    const hospitalsData = await db.select().from(hospitals).where(inArray(hospitals.id, hospitalIds));
    const hospitalMap = new Map(hospitalsData.map(h => [h.id, h]));
    
    return follows.map(f => ({
      ...f,
      hospital: hospitalMap.get(f.hospitalId)!,
    })).filter(f => f.hospital);
  }

  async followHospital(userId: string, hospitalId: number): Promise<FollowedHospital> {
    const [existing] = await db.select().from(followedHospitals).where(
      and(eq(followedHospitals.userId, userId), eq(followedHospitals.hospitalId, hospitalId))
    );
    if (existing) return existing;
    
    const [follow] = await db.insert(followedHospitals).values({ userId, hospitalId }).returning();
    return follow;
  }

  async unfollowHospital(userId: string, hospitalId: number): Promise<void> {
    await db.delete(followedHospitals).where(
      and(eq(followedHospitals.userId, userId), eq(followedHospitals.hospitalId, hospitalId))
    );
  }

  async isFollowingHospital(userId: string, hospitalId: number): Promise<boolean> {
    const [follow] = await db.select().from(followedHospitals).where(
      and(eq(followedHospitals.userId, userId), eq(followedHospitals.hospitalId, hospitalId))
    );
    return !!follow;
  }

  async getFollowersOfHospital(hospitalId: number): Promise<{ userId: string; email: string | null }[]> {
    const follows = await db.select().from(followedHospitals).where(eq(followedHospitals.hospitalId, hospitalId));
    if (follows.length === 0) return [];
    
    const userIds = follows.map(f => f.userId);
    const usersData = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, userIds));
    return usersData.map(u => ({ userId: u.id, email: u.email }));
  }

  // Email outbox methods
  async queueEmail(email: InsertEmailOutbox): Promise<EmailOutbox> {
    const [queued] = await db.insert(emailOutbox).values(email).returning();
    return queued;
  }

  async getPendingEmails(limit: number = 50): Promise<EmailOutbox[]> {
    return db.select().from(emailOutbox)
      .where(and(
        eq(emailOutbox.status, "pending"),
        sql`${emailOutbox.sendAfter} <= NOW()`
      ))
      .orderBy(emailOutbox.createdAt)
      .limit(limit);
  }

  async markEmailSent(id: number): Promise<void> {
    await db.update(emailOutbox)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailOutbox.id, id));
  }

  async markEmailFailed(id: number, error: string): Promise<void> {
    await db.update(emailOutbox)
      .set({ 
        status: sql`CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END`,
        attempts: sql`attempts + 1`,
        lastError: error,
      })
      .where(eq(emailOutbox.id, id));
  }

  // User review stats methods
  async getUserReviewStats(userId: string): Promise<UserReviewStats | undefined> {
    const [stats] = await db.select().from(userReviewStats).where(eq(userReviewStats.userId, userId));
    return stats;
  }

  async incrementUserReviewCount(userId: string, type: "patient" | "employee"): Promise<UserReviewStats> {
    const existing = await this.getUserReviewStats(userId);
    
    if (existing) {
      const [updated] = await db.update(userReviewStats)
        .set({
          totalPatientReviews: type === "patient" ? sql`total_patient_reviews + 1` : existing.totalPatientReviews,
          totalEmployeeReviews: type === "employee" ? sql`total_employee_reviews + 1` : existing.totalEmployeeReviews,
          updatedAt: new Date(),
        })
        .where(eq(userReviewStats.userId, userId))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(userReviewStats).values({
      userId,
      totalPatientReviews: type === "patient" ? 1 : 0,
      totalEmployeeReviews: type === "employee" ? 1 : 0,
    }).returning();
    return created;
  }

  async updateLastMilestoneNotified(userId: string, milestone: number): Promise<void> {
    await db.update(userReviewStats)
      .set({ lastMilestoneNotified: milestone, updatedAt: new Date() })
      .where(eq(userReviewStats.userId, userId));
  }

  // Review responses methods
  async createReviewResponse(response: InsertReviewResponse): Promise<ReviewResponse> {
    const [created] = await db.insert(reviewResponses).values(response).returning();
    return created;
  }

  async getReviewResponse(reviewId: number, reviewType: string): Promise<ReviewResponse | undefined> {
    const [response] = await db.select().from(reviewResponses).where(
      and(eq(reviewResponses.reviewId, reviewId), eq(reviewResponses.reviewType, reviewType))
    );
    return response;
  }

  // Weekly digest helpers
  async getUsersForWeeklyDigest(dayOfWeek: number): Promise<(EmailPreferences & { user: User })[]> {
    const prefs = await db.select().from(emailPreferences).where(
      and(
        eq(emailPreferences.weeklyDigest, true),
        eq(emailPreferences.weeklyDigestDay, dayOfWeek),
        or(
          sql`${emailPreferences.lastDigestSentAt} IS NULL`,
          sql`${emailPreferences.lastDigestSentAt} < NOW() - INTERVAL '6 days'`
        )
      )
    );
    
    if (prefs.length === 0) return [];
    
    const userIds = prefs.map(p => p.userId);
    const usersData = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(usersData.map(u => [u.id, u]));
    
    return prefs.map(p => ({
      ...p,
      user: userMap.get(p.userId)!,
    })).filter(p => p.user && p.user.email);
  }

  async updateLastDigestSent(userId: string): Promise<void> {
    await db.update(emailPreferences)
      .set({ lastDigestSentAt: new Date() })
      .where(eq(emailPreferences.userId, userId));
  }
}

export const storage = new DatabaseStorage();
