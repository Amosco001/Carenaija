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
  siteContent,
  siteContentHistory,
  siteSettings,
  adminEmailTemplates,
  reviewHelpfulVotes,
  hospitalResponses,
  testimonials,
  pressMentions,
  platformStats,
  blogCategories,
  blogTags,
  blogArticles,
  blogArticleTags,
  blogComments,
  badges,
  userBadges,
  userPoints,
  pointTransactions,
  referrals,
  achievementNotifications,
  featuredReviewers,
  profileLevels,
  pointValues,
  healthCategories,
  healthArticles,
  diseases,
  healthBookmarks,
  healthTips,
  newsletterSubscribers,
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
  scrapingSources,
  type ScrapingSource,
  type EmailPreferences,
  type InsertEmailPreferences,
  type FollowedHospital,
  type InsertFollowedHospital,
  type EmailOutbox,
  type InsertEmailOutbox,
  type UserReviewStats,
  type ReviewResponse,
  type InsertReviewResponse,
  type SiteContent,
  type InsertSiteContent,
  type SiteContentHistory,
  type SiteSetting,
  type InsertSiteSetting,
  type AdminEmailTemplate,
  type InsertAdminEmailTemplate,
  type UserRole,
  unverifiedSubmissions,
  type UnverifiedSubmission,
  type InsertUnverifiedSubmission,
  type ReviewHelpfulVote,
  type InsertReviewHelpfulVote,
  type HospitalResponse,
  type InsertHospitalResponse,
  type Testimonial,
  type InsertTestimonial,
  type PressMention,
  type InsertPressMention,
  type PlatformStat,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogTag,
  type InsertBlogTag,
  type BlogArticle,
  type InsertBlogArticle,
  type BlogArticleTag,
  type BlogComment,
  type InsertBlogComment,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type UserPoints,
  type InsertUserPoints,
  type PointTransaction,
  type InsertPointTransaction,
  type Referral,
  type InsertReferral,
  type AchievementNotification,
  type InsertAchievementNotification,
  type FeaturedReviewer,
  type InsertFeaturedReviewer,
  type HealthCategory,
  type InsertHealthCategory,
  type HealthArticle,
  type InsertHealthArticle,
  type Disease,
  type InsertDisease,
  type HealthBookmark,
  type HealthTip,
  type InsertHealthTip,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  hospitalComments,
  type HospitalComment,
  type InsertHospitalComment,
  diagnosticCenters,
  diagnosticTests,
  physicians,
  physicianAffiliations,
  type DiagnosticCenter,
  type InsertDiagnosticCenter,
  type DiagnosticTest,
  type InsertDiagnosticTest,
  type Physician,
  type InsertPhysician,
  type PhysicianAffiliation,
  type InsertPhysicianAffiliation,
  pharmacies,
  type Pharmacy,
  type InsertPharmacy,
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
  getHospitalBySlug(slug: string): Promise<Hospital | undefined>;
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
  getAllClaimRequests(): Promise<(ClaimRequest & { hospitalName: string })[]>;
  updateClaimRequestStatus(id: number, status: string): Promise<ClaimRequest | undefined>;
  getHospitalsClaimedByUser(userId: string): Promise<Hospital[]>;
  getClaimRequestsByUserId(userId: string): Promise<(ClaimRequest & { hospitalName: string })[]>;
  
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
  getScrapingSources(): Promise<ScrapingSource[]>;
  
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
  
  // Extended admin methods
  getAllUsers(params?: { search?: string; role?: string; status?: 'active' | 'suspended'; page?: number; limit?: number }): Promise<{ users: User[]; total: number }>;
  getUserStats(): Promise<{ total: number; admins: number; suspended: number; byRole: Record<string, number> }>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  suspendUser(userId: string, reason: string, expiresAt?: Date): Promise<User>;
  unsuspendUser(userId: string): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  deleteHospital(id: number): Promise<void>;
  bulkUpdateHospitalStatus(ids: number[], verified: boolean): Promise<number>;
  bulkDeleteHospitals(ids: number[]): Promise<number>;
  bulkUpdateReviewModeration(ids: number[], status: string, adminUserId: string): Promise<number>;
  bulkDeleteReviews(ids: number[]): Promise<number>;
  getAdminDashboardStats(): Promise<{ hospitals: { total: number; verified: number; pending: number }; reviews: { total: number; pending: number; flagged: number }; users: { total: number; admins: number; suspended: number }; flags: { pending: number; resolved: number } }>;
  
  // Site content methods
  getAllSiteContent(): Promise<SiteContent[]>;
  getSiteContentByKey(key: string): Promise<SiteContent | undefined>;
  createSiteContent(data: InsertSiteContent): Promise<SiteContent>;
  updateSiteContent(id: number, data: Partial<InsertSiteContent>, changedBy: string, changeReason?: string): Promise<SiteContent>;
  deleteSiteContent(id: number): Promise<void>;
  getSiteContentHistory(contentId: number): Promise<SiteContentHistory[]>;
  
  // Site settings methods
  getAllSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingsByCategory(category: string): Promise<SiteSetting[]>;
  getSiteSetting(category: string, key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting>;
  deleteSiteSetting(id: number): Promise<void>;
  
  // Email templates methods
  getAllEmailTemplates(): Promise<AdminEmailTemplate[]>;
  getEmailTemplateByKey(key: string): Promise<AdminEmailTemplate | undefined>;
  createEmailTemplate(data: InsertAdminEmailTemplate): Promise<AdminEmailTemplate>;
  updateEmailTemplate(id: number, data: Partial<InsertAdminEmailTemplate>, updatedBy: string): Promise<AdminEmailTemplate>;
  deleteEmailTemplate(id: number): Promise<void>;

  // Hospital comments methods
  getCommentsByHospitalId(hospitalId: number): Promise<HospitalComment[]>;
  createHospitalComment(comment: InsertHospitalComment): Promise<HospitalComment>;
  deleteHospitalComment(id: number, userId: string): Promise<void>;

  // Diagnostic Centers
  getDiagnosticCenters(params?: { state?: string; city?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResult<DiagnosticCenter>>;
  getDiagnosticCenterById(id: number): Promise<DiagnosticCenter | undefined>;
  getDiagnosticCenterBySlug(slug: string): Promise<DiagnosticCenter | undefined>;
  getTestsByCenterId(centerId: number): Promise<DiagnosticTest[]>;
  searchDiagnosticTests(params: { category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<(DiagnosticTest & { centerName: string; centerCity: string; centerState: string })[]>;

  // Physicians
  getPhysicians(params?: { specialty?: string; city?: string; state?: string; hospitalId?: number; search?: string; page?: number; limit?: number }): Promise<PaginatedResult<Physician>>;
  getPhysicianById(id: number): Promise<Physician | undefined>;
  getPhysicianBySlug(slug: string): Promise<Physician | undefined>;
  getPhysicianAffiliations(physicianId: number): Promise<(PhysicianAffiliation & { hospitalName: string; hospitalCity: string; hospitalState: string })[]>;
  getPhysiciansByHospitalId(hospitalId: number): Promise<(Physician & { role: string; department: string | null })[]>;
  getPhysicianSpecialties(): Promise<string[]>;
  getPhysicianCities(): Promise<string[]>;

  // Pharmacies
  getPharmacies(params?: { state?: string; city?: string; search?: string; verified?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<Pharmacy>>;
  getPharmacyById(id: number): Promise<Pharmacy | undefined>;
  getPharmacyBySlug(slug: string): Promise<Pharmacy | undefined>;

  // HMO providers methods
  getDistinctHmoProviders(): Promise<string[]>;
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

  private _getHospitalBySlugUncached = async (slug: string): Promise<Hospital | undefined> => {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.slug, slug));
    return hospital;
  };

  getHospitalBySlug = memoizee(this._getHospitalBySlugUncached, {
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

  async getAllClaimRequests(): Promise<(ClaimRequest & { hospitalName: string })[]> {
    const results = await db
      .select({
        id: claimRequests.id,
        hospitalId: claimRequests.hospitalId,
        userId: claimRequests.userId,
        fullName: claimRequests.fullName,
        position: claimRequests.position,
        email: claimRequests.email,
        phone: claimRequests.phone,
        verificationDoc: claimRequests.verificationDoc,
        additionalInfo: claimRequests.additionalInfo,
        status: claimRequests.status,
        createdAt: claimRequests.createdAt,
        hospitalName: hospitals.name,
      })
      .from(claimRequests)
      .innerJoin(hospitals, eq(claimRequests.hospitalId, hospitals.id))
      .orderBy(desc(claimRequests.createdAt));
    return results as any;
  }

  async updateClaimRequestStatus(id: number, status: string): Promise<ClaimRequest | undefined> {
    const [updated] = await db
      .update(claimRequests)
      .set({ status })
      .where(eq(claimRequests.id, id))
      .returning();
    return updated;
  }

  async getHospitalsClaimedByUser(userId: string): Promise<Hospital[]> {
    return await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.claimedBy, userId));
  }

  async getClaimRequestsByUserId(userId: string): Promise<(ClaimRequest & { hospitalName: string })[]> {
    const results = await db
      .select({
        id: claimRequests.id,
        hospitalId: claimRequests.hospitalId,
        userId: claimRequests.userId,
        fullName: claimRequests.fullName,
        position: claimRequests.position,
        email: claimRequests.email,
        phone: claimRequests.phone,
        verificationDoc: claimRequests.verificationDoc,
        additionalInfo: claimRequests.additionalInfo,
        status: claimRequests.status,
        createdAt: claimRequests.createdAt,
        hospitalName: hospitals.name,
      })
      .from(claimRequests)
      .innerJoin(hospitals, eq(claimRequests.hospitalId, hospitals.id))
      .where(eq(claimRequests.userId, userId))
      .orderBy(desc(claimRequests.createdAt));
    return results as any;
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

  async getScrapingSources(): Promise<ScrapingSource[]> {
    return await db
      .select()
      .from(scrapingSources)
      .orderBy(scrapingSources.name);
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

  // ==================== ADMIN USER MANAGEMENT ====================
  
  async getAllUsers(params?: { 
    search?: string; 
    role?: string; 
    status?: 'active' | 'suspended'; 
    page?: number; 
    limit?: number 
  }): Promise<{ users: User[]; total: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users).$dynamic();
    let countQuery = db.select({ count: count() }).from(users).$dynamic();
    
    if (params?.search) {
      const pattern = `%${params.search}%`;
      const searchCondition = or(
        ilike(users.email, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern)
      );
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }
    
    if (params?.role) {
      query = query.where(eq(users.role, params.role));
      countQuery = countQuery.where(eq(users.role, params.role));
    }
    
    if (params?.status === 'suspended') {
      query = query.where(sql`${users.suspendedAt} IS NOT NULL`);
      countQuery = countQuery.where(sql`${users.suspendedAt} IS NOT NULL`);
    } else if (params?.status === 'active') {
      query = query.where(sql`${users.suspendedAt} IS NULL`);
      countQuery = countQuery.where(sql`${users.suspendedAt} IS NULL`);
    }
    
    const [totalResult] = await countQuery;
    const usersData = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    
    return { users: usersData, total: totalResult?.count || 0 };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role, isAdmin: role !== 'user', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async suspendUser(userId: string, reason: string, expiresAt?: Date): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        suspendedAt: new Date(), 
        suspensionReason: reason, 
        suspensionExpiresAt: expiresAt || null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async unsuspendUser(userId: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        suspendedAt: null, 
        suspensionReason: null, 
        suspensionExpiresAt: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserStats(): Promise<{ total: number; admins: number; suspended: number; byRole: Record<string, number> }> {
    const [totalResult] = await db.select({ count: count() }).from(users);
    const [adminsResult] = await db.select({ count: count() }).from(users).where(eq(users.isAdmin, true));
    const [suspendedResult] = await db.select({ count: count() }).from(users).where(sql`${users.suspendedAt} IS NOT NULL`);
    
    const roleCountsResult = await db
      .select({ role: users.role, count: count() })
      .from(users)
      .groupBy(users.role);
    
    const byRole = Object.fromEntries(roleCountsResult.map(r => [r.role, r.count]));
    
    return {
      total: totalResult?.count || 0,
      admins: adminsResult?.count || 0,
      suspended: suspendedResult?.count || 0,
      byRole,
    };
  }

  // ==================== ADMIN HOSPITAL MANAGEMENT ====================
  
  async deleteHospital(id: number): Promise<void> {
    await db.delete(hospitals).where(eq(hospitals.id, id));
    this.getAllHospitals.clear();
    this.getHospitalById.delete(id);
  }

  async bulkUpdateHospitalStatus(ids: number[], verified: boolean): Promise<number> {
    const result = await db
      .update(hospitals)
      .set({ verified, updatedAt: new Date() })
      .where(inArray(hospitals.id, ids));
    this.getAllHospitals.clear();
    return ids.length;
  }

  async bulkDeleteHospitals(ids: number[]): Promise<number> {
    await db.delete(hospitals).where(inArray(hospitals.id, ids));
    this.getAllHospitals.clear();
    return ids.length;
  }

  // ==================== SITE CONTENT MANAGEMENT ====================
  
  async getAllSiteContent(): Promise<SiteContent[]> {
    return db.select().from(siteContent).orderBy(siteContent.key);
  }

  async getSiteContentByKey(key: string): Promise<SiteContent | undefined> {
    const [content] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return content;
  }

  async createSiteContent(data: InsertSiteContent): Promise<SiteContent> {
    const [created] = await db.insert(siteContent).values(data).returning();
    return created;
  }

  async updateSiteContent(id: number, data: Partial<InsertSiteContent>, changedBy: string, changeReason?: string): Promise<SiteContent> {
    const current = await db.select().from(siteContent).where(eq(siteContent.id, id));
    if (current[0]) {
      await db.insert(siteContentHistory).values({
        contentId: id,
        title: current[0].title,
        content: current[0].content,
        version: current[0].version,
        changedBy,
        changeReason,
      });
    }
    
    const [updated] = await db
      .update(siteContent)
      .set({ 
        ...data, 
        version: sql`version + 1`,
        updatedBy: changedBy,
        updatedAt: new Date() 
      })
      .where(eq(siteContent.id, id))
      .returning();
    return updated;
  }

  async deleteSiteContent(id: number): Promise<void> {
    await db.delete(siteContent).where(eq(siteContent.id, id));
  }

  async getSiteContentHistory(contentId: number): Promise<SiteContentHistory[]> {
    return db.select().from(siteContentHistory)
      .where(eq(siteContentHistory.contentId, contentId))
      .orderBy(desc(siteContentHistory.version));
  }

  // ==================== SITE SETTINGS MANAGEMENT ====================
  
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings).orderBy(siteSettings.category, siteSettings.key);
  }

  async getSiteSettingsByCategory(category: string): Promise<SiteSetting[]> {
    return db.select().from(siteSettings).where(eq(siteSettings.category, category));
  }

  async getSiteSetting(category: string, key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings)
      .where(and(eq(siteSettings.category, category), eq(siteSettings.key, key)));
    return setting;
  }

  async upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(data.category, data.key);
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings).values(data).returning();
    return created;
  }

  async deleteSiteSetting(id: number): Promise<void> {
    await db.delete(siteSettings).where(eq(siteSettings.id, id));
  }

  // ==================== EMAIL TEMPLATES MANAGEMENT ====================
  
  async getAllEmailTemplates(): Promise<AdminEmailTemplate[]> {
    return db.select().from(adminEmailTemplates).orderBy(adminEmailTemplates.key);
  }

  async getEmailTemplateByKey(key: string): Promise<AdminEmailTemplate | undefined> {
    const [template] = await db.select().from(adminEmailTemplates).where(eq(adminEmailTemplates.key, key));
    return template;
  }

  async createEmailTemplate(data: InsertAdminEmailTemplate): Promise<AdminEmailTemplate> {
    const [created] = await db.insert(adminEmailTemplates).values(data).returning();
    return created;
  }

  async updateEmailTemplate(id: number, data: Partial<InsertAdminEmailTemplate>, updatedBy: string): Promise<AdminEmailTemplate> {
    const [updated] = await db
      .update(adminEmailTemplates)
      .set({ ...data, updatedBy, updatedAt: new Date() })
      .where(eq(adminEmailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(adminEmailTemplates).where(eq(adminEmailTemplates.id, id));
  }

  // ==================== BULK REVIEW OPERATIONS ====================
  
  async bulkUpdateReviewModeration(reviewIds: number[], status: string, reviewedBy: string): Promise<number> {
    await db
      .update(patientReviews)
      .set({ moderationStatus: status, reviewedBy, reviewedAt: new Date() })
      .where(inArray(patientReviews.id, reviewIds));
    return reviewIds.length;
  }

  async bulkDeleteReviews(reviewIds: number[]): Promise<number> {
    await db.delete(patientReviews).where(inArray(patientReviews.id, reviewIds));
    return reviewIds.length;
  }

  // ==================== ADMIN STATS ====================
  
  async getAdminDashboardStats(): Promise<{
    hospitals: { total: number; verified: number; pending: number };
    reviews: { total: number; pending: number; flagged: number };
    users: { total: number; admins: number; suspended: number };
    flags: { pending: number; resolved: number };
  }> {
    const [hospitalTotal] = await db.select({ count: count() }).from(hospitals);
    const [hospitalVerified] = await db.select({ count: count() }).from(hospitals).where(eq(hospitals.verified, true));
    const [hospitalPending] = await db.select({ count: count() }).from(pendingHospitals).where(eq(pendingHospitals.status, 'pending'));
    
    const [reviewTotal] = await db.select({ count: count() }).from(patientReviews);
    const [reviewPending] = await db.select({ count: count() }).from(patientReviews).where(eq(patientReviews.moderationStatus, 'pending'));
    const [reviewFlagged] = await db.select({ count: count() }).from(patientReviews).where(eq(patientReviews.moderationStatus, 'flagged'));
    
    const [userTotal] = await db.select({ count: count() }).from(users);
    const [userAdmins] = await db.select({ count: count() }).from(users).where(eq(users.isAdmin, true));
    const [userSuspended] = await db.select({ count: count() }).from(users).where(sql`${users.suspendedAt} IS NOT NULL`);
    
    const [flagsPending] = await db.select({ count: count() }).from(reviewFlags).where(eq(reviewFlags.status, 'pending'));
    const [flagsResolved] = await db.select({ count: count() }).from(reviewFlags).where(sql`${reviewFlags.status} != 'pending'`);
    
    return {
      hospitals: {
        total: hospitalTotal?.count || 0,
        verified: hospitalVerified?.count || 0,
        pending: hospitalPending?.count || 0,
      },
      reviews: {
        total: reviewTotal?.count || 0,
        pending: reviewPending?.count || 0,
        flagged: reviewFlagged?.count || 0,
      },
      users: {
        total: userTotal?.count || 0,
        admins: userAdmins?.count || 0,
        suspended: userSuspended?.count || 0,
      },
      flags: {
        pending: flagsPending?.count || 0,
        resolved: flagsResolved?.count || 0,
      },
    };
  }

  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.getHospitalById(id);
  }

  // ==================== REVIEW HELPFUL VOTES ====================
  
  async addHelpfulVote(reviewId: number, reviewType: string, userId: string): Promise<void> {
    const existing = await db.select().from(reviewHelpfulVotes)
      .where(and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.reviewType, reviewType),
        eq(reviewHelpfulVotes.userId, userId)
      ));
    
    if (existing.length === 0) {
      await db.insert(reviewHelpfulVotes).values({ reviewId, reviewType, userId });
      if (reviewType === 'patient') {
        await db.update(patientReviews)
          .set({ helpfulCount: sql`${patientReviews.helpfulCount} + 1` })
          .where(eq(patientReviews.id, reviewId));
      } else {
        await db.update(employeeReviews)
          .set({ helpfulCount: sql`${employeeReviews.helpfulCount} + 1` })
          .where(eq(employeeReviews.id, reviewId));
      }
    }
  }

  async removeHelpfulVote(reviewId: number, reviewType: string, userId: string): Promise<void> {
    const [deleted] = await db.delete(reviewHelpfulVotes)
      .where(and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.reviewType, reviewType),
        eq(reviewHelpfulVotes.userId, userId)
      ))
      .returning();
    
    if (deleted) {
      if (reviewType === 'patient') {
        await db.update(patientReviews)
          .set({ helpfulCount: sql`GREATEST(${patientReviews.helpfulCount} - 1, 0)` })
          .where(eq(patientReviews.id, reviewId));
      } else {
        await db.update(employeeReviews)
          .set({ helpfulCount: sql`GREATEST(${employeeReviews.helpfulCount} - 1, 0)` })
          .where(eq(employeeReviews.id, reviewId));
      }
    }
  }

  async getUserHelpfulVotes(userId: string): Promise<ReviewHelpfulVote[]> {
    return db.select().from(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.userId, userId));
  }

  async hasUserVotedHelpful(reviewId: number, reviewType: string, userId: string): Promise<boolean> {
    const [vote] = await db.select().from(reviewHelpfulVotes)
      .where(and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.reviewType, reviewType),
        eq(reviewHelpfulVotes.userId, userId)
      ));
    return !!vote;
  }

  // ==================== HOSPITAL RESPONSES ====================
  
  async getHospitalResponses(hospitalId: number): Promise<HospitalResponse[]> {
    return db.select().from(hospitalResponses)
      .where(eq(hospitalResponses.hospitalId, hospitalId))
      .orderBy(desc(hospitalResponses.createdAt));
  }

  async getHospitalReviewResponse(reviewId: number, reviewType: string): Promise<HospitalResponse | undefined> {
    const [response] = await db.select().from(hospitalResponses)
      .where(and(
        eq(hospitalResponses.reviewId, reviewId),
        eq(hospitalResponses.reviewType, reviewType)
      ));
    return response;
  }

  async createHospitalResponse(data: InsertHospitalResponse): Promise<HospitalResponse> {
    const [created] = await db.insert(hospitalResponses).values(data).returning();
    return created;
  }

  async getHospitalResponseRate(hospitalId: number): Promise<number> {
    const [reviewCount] = await db.select({ count: count() }).from(patientReviews)
      .where(eq(patientReviews.hospitalId, hospitalId));
    const [responseCount] = await db.select({ count: count() }).from(hospitalResponses)
      .where(eq(hospitalResponses.hospitalId, hospitalId));
    
    if (!reviewCount?.count || reviewCount.count === 0) return 0;
    return Math.round((responseCount?.count || 0) / reviewCount.count * 100);
  }

  // ==================== TESTIMONIALS ====================
  
  async getActiveTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(testimonials.displayOrder);
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).orderBy(testimonials.displayOrder);
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials).values(data).returning();
    return created;
  }

  async updateTestimonial(id: number, data: Partial<InsertTestimonial>): Promise<Testimonial> {
    const [updated] = await db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return updated;
  }

  async deleteTestimonial(id: number): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  // ==================== PRESS MENTIONS ====================
  
  async getActivePressMentions(): Promise<PressMention[]> {
    return db.select().from(pressMentions)
      .where(eq(pressMentions.isActive, true))
      .orderBy(pressMentions.displayOrder);
  }

  async getAllPressMentions(): Promise<PressMention[]> {
    return db.select().from(pressMentions).orderBy(pressMentions.displayOrder);
  }

  async createPressMention(data: InsertPressMention): Promise<PressMention> {
    const [created] = await db.insert(pressMentions).values(data).returning();
    return created;
  }

  async updatePressMention(id: number, data: Partial<InsertPressMention>): Promise<PressMention> {
    const [updated] = await db.update(pressMentions).set(data).where(eq(pressMentions.id, id)).returning();
    return updated;
  }

  async deletePressMention(id: number): Promise<void> {
    await db.delete(pressMentions).where(eq(pressMentions.id, id));
  }

  // ==================== PLATFORM STATS ====================
  
  async getPlatformStats(): Promise<PlatformStat[]> {
    return db.select().from(platformStats);
  }

  async updatePlatformStat(key: string, value: number, label: string): Promise<void> {
    const existing = await db.select().from(platformStats).where(eq(platformStats.statKey, key));
    if (existing.length > 0) {
      await db.update(platformStats)
        .set({ statValue: value, lastCalculated: new Date() })
        .where(eq(platformStats.statKey, key));
    } else {
      await db.insert(platformStats).values({ statKey: key, statValue: value, displayLabel: label });
    }
  }

  async calculateAndUpdatePlatformStats(): Promise<void> {
    const [hospitalCount] = await db.select({ count: count() }).from(hospitals);
    const [verifiedHospitalCount] = await db.select({ count: count() }).from(hospitals).where(eq(hospitals.verified, true));
    const [reviewCount] = await db.select({ count: count() }).from(patientReviews);
    const [verifiedReviewCount] = await db.select({ count: count() }).from(patientReviews).where(eq(patientReviews.verifiedVisit, true));
    const [userCount] = await db.select({ count: count() }).from(users);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [activeUserCount] = await db.select({ count: count() }).from(users)
      .where(gte(users.updatedAt, thirtyDaysAgo));
    
    await this.updatePlatformStat('total_hospitals', hospitalCount?.count || 0, 'Total Hospitals');
    await this.updatePlatformStat('verified_hospitals', verifiedHospitalCount?.count || 0, 'Verified Hospitals');
    await this.updatePlatformStat('total_reviews', reviewCount?.count || 0, 'Patient Reviews');
    await this.updatePlatformStat('verified_reviews', verifiedReviewCount?.count || 0, 'Verified Reviews');
    await this.updatePlatformStat('total_users', userCount?.count || 0, 'Registered Users');
    await this.updatePlatformStat('active_users_month', activeUserCount?.count || 0, 'Active Users This Month');
  }

  async getTrustStats(): Promise<{
    totalReviews: number;
    verifiedReviews: number;
    totalHospitals: number;
    verifiedHospitals: number;
    activeUsersMonth: number;
  }> {
    const [reviewCount] = await db.select({ count: count() }).from(patientReviews);
    const [verifiedReviewCount] = await db.select({ count: count() }).from(patientReviews).where(eq(patientReviews.verifiedVisit, true));
    const [hospitalCount] = await db.select({ count: count() }).from(hospitals);
    const [verifiedHospitalCount] = await db.select({ count: count() }).from(hospitals).where(eq(hospitals.verified, true));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [activeUserCount] = await db.select({ count: count() }).from(users)
      .where(gte(users.updatedAt, thirtyDaysAgo));
    
    return {
      totalReviews: reviewCount?.count || 0,
      verifiedReviews: verifiedReviewCount?.count || 0,
      totalHospitals: hospitalCount?.count || 0,
      verifiedHospitals: verifiedHospitalCount?.count || 0,
      activeUsersMonth: activeUserCount?.count || 0,
    };
  }

  // ============================================
  // BLOG SYSTEM METHODS
  // ============================================

  // Blog Categories
  async getAllBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories).where(eq(blogCategories.isActive, true)).orderBy(blogCategories.displayOrder);
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
    return category;
  }

  async getBlogCategoryById(id: number): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return category;
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const [created] = await db.insert(blogCategories).values(category).returning();
    return created;
  }

  async updateBlogCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const [updated] = await db.update(blogCategories).set(data).where(eq(blogCategories.id, id)).returning();
    return updated;
  }

  async deleteBlogCategory(id: number): Promise<void> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
  }

  // Blog Tags
  async getAllBlogTags(): Promise<BlogTag[]> {
    return db.select().from(blogTags).orderBy(desc(blogTags.usageCount));
  }

  async getBlogTagBySlug(slug: string): Promise<BlogTag | undefined> {
    const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, slug));
    return tag;
  }

  async getBlogTagById(id: number): Promise<BlogTag | undefined> {
    const [tag] = await db.select().from(blogTags).where(eq(blogTags.id, id));
    return tag;
  }

  async createBlogTag(tag: InsertBlogTag): Promise<BlogTag> {
    const [created] = await db.insert(blogTags).values(tag).returning();
    return created;
  }

  async updateBlogTag(id: number, data: Partial<InsertBlogTag>): Promise<BlogTag | undefined> {
    const [updated] = await db.update(blogTags).set(data).where(eq(blogTags.id, id)).returning();
    return updated;
  }

  async deleteBlogTag(id: number): Promise<void> {
    await db.delete(blogTags).where(eq(blogTags.id, id));
  }

  async getOrCreateBlogTag(name: string, slug: string): Promise<BlogTag> {
    const existing = await this.getBlogTagBySlug(slug);
    if (existing) return existing;
    return this.createBlogTag({ name, slug });
  }

  // Blog Articles
  async getPublishedBlogArticles(params: { 
    limit?: number; 
    offset?: number; 
    categorySlug?: string;
    tagSlug?: string;
    articleType?: string;
    search?: string;
  } = {}): Promise<{ articles: BlogArticle[]; total: number }> {
    const { limit = 10, offset = 0, categorySlug, articleType, search } = params;
    
    const conditions: any[] = [eq(blogArticles.status, 'published')];
    
    if (categorySlug) {
      const category = await this.getBlogCategoryBySlug(categorySlug);
      if (category) {
        conditions.push(eq(blogArticles.categoryId, category.id));
      }
    }
    
    if (articleType) {
      conditions.push(eq(blogArticles.articleType, articleType));
    }
    
    if (search) {
      conditions.push(or(
        ilike(blogArticles.title, `%${search}%`),
        ilike(blogArticles.excerpt, `%${search}%`),
        ilike(blogArticles.content, `%${search}%`)
      ));
    }
    
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const [countResult] = await db.select({ count: count() }).from(blogArticles).where(whereClause);
    const articles = await db.select().from(blogArticles)
      .where(whereClause)
      .orderBy(desc(blogArticles.publishedAt))
      .limit(limit)
      .offset(offset);
    
    return { articles, total: countResult?.count || 0 };
  }

  async getFeaturedBlogArticles(limit: number = 5): Promise<BlogArticle[]> {
    return db.select().from(blogArticles)
      .where(and(eq(blogArticles.status, 'published'), eq(blogArticles.isFeatured, true)))
      .orderBy(desc(blogArticles.publishedAt))
      .limit(limit);
  }

  async getBlogArticleBySlug(slug: string): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles).where(eq(blogArticles.slug, slug));
    return article;
  }

  async getBlogArticleById(id: number): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles).where(eq(blogArticles.id, id));
    return article;
  }

  async createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle> {
    const [created] = await db.insert(blogArticles).values(article).returning();
    return created;
  }

  async updateBlogArticle(id: number, data: Partial<InsertBlogArticle>): Promise<BlogArticle | undefined> {
    const [updated] = await db.update(blogArticles).set({ ...data, updatedAt: new Date() }).where(eq(blogArticles.id, id)).returning();
    return updated;
  }

  async deleteBlogArticle(id: number): Promise<void> {
    await db.delete(blogArticles).where(eq(blogArticles.id, id));
  }

  async incrementBlogArticleViewCount(id: number): Promise<void> {
    await db.update(blogArticles)
      .set({ viewCount: sql`${blogArticles.viewCount} + 1` })
      .where(eq(blogArticles.id, id));
  }

  async getAllBlogArticles(status?: string): Promise<BlogArticle[]> {
    if (status) {
      return db.select().from(blogArticles).where(eq(blogArticles.status, status)).orderBy(desc(blogArticles.createdAt));
    }
    return db.select().from(blogArticles).orderBy(desc(blogArticles.createdAt));
  }

  async getRelatedBlogArticles(articleId: number, categoryId: number | null, limit: number = 4): Promise<BlogArticle[]> {
    if (!categoryId) {
      return db.select().from(blogArticles)
        .where(and(eq(blogArticles.status, 'published'), sql`${blogArticles.id} != ${articleId}`))
        .orderBy(desc(blogArticles.publishedAt))
        .limit(limit);
    }
    return db.select().from(blogArticles)
      .where(and(
        eq(blogArticles.status, 'published'),
        eq(blogArticles.categoryId, categoryId),
        sql`${blogArticles.id} != ${articleId}`
      ))
      .orderBy(desc(blogArticles.publishedAt))
      .limit(limit);
  }

  // Blog Article Tags
  async getArticleTags(articleId: number): Promise<BlogTag[]> {
    const articleTags = await db.select().from(blogArticleTags).where(eq(blogArticleTags.articleId, articleId));
    if (articleTags.length === 0) return [];
    const tagIds = articleTags.map(at => at.tagId);
    return db.select().from(blogTags).where(inArray(blogTags.id, tagIds));
  }

  async setArticleTags(articleId: number, tagIds: number[]): Promise<void> {
    await db.delete(blogArticleTags).where(eq(blogArticleTags.articleId, articleId));
    if (tagIds.length > 0) {
      await db.insert(blogArticleTags).values(tagIds.map(tagId => ({ articleId, tagId })));
    }
  }

  async getArticlesByTag(tagSlug: string, limit: number = 10, offset: number = 0): Promise<{ articles: BlogArticle[]; total: number }> {
    const tag = await this.getBlogTagBySlug(tagSlug);
    if (!tag) return { articles: [], total: 0 };
    
    const articleTags = await db.select().from(blogArticleTags).where(eq(blogArticleTags.tagId, tag.id));
    if (articleTags.length === 0) return { articles: [], total: 0 };
    
    const articleIds = articleTags.map(at => at.articleId);
    const articles = await db.select().from(blogArticles)
      .where(and(inArray(blogArticles.id, articleIds), eq(blogArticles.status, 'published')))
      .orderBy(desc(blogArticles.publishedAt))
      .limit(limit)
      .offset(offset);
    
    return { articles, total: articleTags.length };
  }

  // Blog Comments
  async getArticleComments(articleId: number): Promise<BlogComment[]> {
    return db.select().from(blogComments)
      .where(and(eq(blogComments.articleId, articleId), eq(blogComments.status, 'approved')))
      .orderBy(blogComments.createdAt);
  }

  async createBlogComment(comment: InsertBlogComment): Promise<BlogComment> {
    const [created] = await db.insert(blogComments).values(comment).returning();
    await db.update(blogArticles)
      .set({ commentCount: sql`${blogArticles.commentCount} + 1` })
      .where(eq(blogArticles.id, comment.articleId));
    return created;
  }

  async updateBlogComment(id: number, data: Partial<InsertBlogComment>): Promise<BlogComment | undefined> {
    const [updated] = await db.update(blogComments)
      .set({ ...data, isEdited: true, updatedAt: new Date() })
      .where(eq(blogComments.id, id))
      .returning();
    return updated;
  }

  async deleteBlogComment(id: number): Promise<void> {
    const [comment] = await db.select().from(blogComments).where(eq(blogComments.id, id));
    if (comment) {
      await db.delete(blogComments).where(eq(blogComments.id, id));
      await db.update(blogArticles)
        .set({ commentCount: sql`${blogArticles.commentCount} - 1` })
        .where(eq(blogArticles.id, comment.articleId));
    }
  }

  async getBlogCommentById(id: number): Promise<BlogComment | undefined> {
    const [comment] = await db.select().from(blogComments).where(eq(blogComments.id, id));
    return comment;
  }

  async getAllBlogComments(status?: string): Promise<BlogComment[]> {
    if (status) {
      return db.select().from(blogComments).where(eq(blogComments.status, status)).orderBy(desc(blogComments.createdAt));
    }
    return db.select().from(blogComments).orderBy(desc(blogComments.createdAt));
  }

  async moderateBlogComment(id: number, status: string): Promise<BlogComment | undefined> {
    const [updated] = await db.update(blogComments).set({ status }).where(eq(blogComments.id, id)).returning();
    return updated;
  }

  // Engagement System Methods

  // Badges
  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges).orderBy(badges.category, badges.name);
  }

  async getBadgeByCode(code: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.code, code));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadgesList = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    if (userBadgesList.length === 0) return [];
    const badgeIds = userBadgesList.map(ub => ub.badgeId);
    const badgesList = await db.select().from(badges).where(inArray(badges.id, badgeIds));
    const badgeMap = new Map(badgesList.map(b => [b.id, b]));
    return userBadgesList.map(ub => ({ ...ub, badge: badgeMap.get(ub.badgeId)! }));
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const existing = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(userBadges).values({ userId, badgeId }).returning();
    return created;
  }

  async hasUserBadge(userId: string, badgeCode: string): Promise<boolean> {
    const badge = await this.getBadgeByCode(badgeCode);
    if (!badge) return false;
    const [userBadge] = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)));
    return !!userBadge;
  }

  // User Points
  async getUserPoints(userId: string): Promise<UserPoints | undefined> {
    const [points] = await db.select().from(userPoints).where(eq(userPoints.userId, userId));
    return points;
  }

  async getOrCreateUserPoints(userId: string): Promise<UserPoints> {
    let points = await this.getUserPoints(userId);
    if (!points) {
      const [created] = await db.insert(userPoints).values({ userId, totalPoints: 0, currentLevel: 'novice' }).returning();
      points = created;
    }
    return points;
  }

  async addPoints(userId: string, pointsToAdd: number, action: string, description?: string, referenceType?: string, referenceId?: number): Promise<UserPoints> {
    const userPts = await this.getOrCreateUserPoints(userId);
    const newTotal = userPts.totalPoints + pointsToAdd;
    const newLevel = this.calculateLevel(newTotal);
    
    const [updated] = await db.update(userPoints)
      .set({ 
        totalPoints: newTotal, 
        currentLevel: newLevel,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userPoints.userId, userId))
      .returning();
    
    await db.insert(pointTransactions).values({
      userId,
      points: pointsToAdd,
      action,
      description,
      referenceType,
      referenceId
    });
    
    return updated;
  }

  calculateLevel(points: number): string {
    if (points >= profileLevels.superReviewer.minPoints) return 'superReviewer';
    if (points >= profileLevels.expert.minPoints) return 'expert';
    if (points >= profileLevels.contributor.minPoints) return 'contributor';
    return 'novice';
  }

  async updateUserReviewCount(userId: string, increment: number = 1): Promise<void> {
    await db.update(userPoints)
      .set({ reviewCount: sql`${userPoints.reviewCount} + ${increment}` })
      .where(eq(userPoints.userId, userId));
  }

  async updateUserHelpfulVotes(userId: string, received: number = 0, given: number = 0): Promise<void> {
    await db.update(userPoints)
      .set({ 
        helpfulVotesReceived: sql`${userPoints.helpfulVotesReceived} + ${received}`,
        helpfulVotesGiven: sql`${userPoints.helpfulVotesGiven} + ${given}`
      })
      .where(eq(userPoints.userId, userId));
  }

  // Point Transactions
  async getUserPointTransactions(userId: string, limit: number = 20): Promise<PointTransaction[]> {
    return db.select().from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit);
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10, period?: 'week' | 'month' | 'all'): Promise<(UserPoints & { user: User })[]> {
    const leaderboardPoints = await db.select().from(userPoints)
      .orderBy(desc(userPoints.totalPoints))
      .limit(limit);
    
    if (leaderboardPoints.length === 0) return [];
    
    const userIds = leaderboardPoints.map(p => p.userId);
    const usersList = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(usersList.map(u => [u.id, u]));
    
    return leaderboardPoints
      .filter(p => userMap.has(p.userId))
      .map(p => ({ ...p, user: userMap.get(p.userId)! }));
  }

  // Referrals
  async createReferral(referrerId: string, referralCode: string): Promise<Referral> {
    const [created] = await db.insert(referrals).values({
      referrerId,
      referredId: referrerId,
      referralCode,
      status: 'pending'
    }).returning();
    return created;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    return referral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
  }

  async completeReferral(referralId: number, referredUserId: string): Promise<Referral> {
    const [updated] = await db.update(referrals)
      .set({ 
        referredId: referredUserId,
        status: 'completed', 
        completedAt: new Date(),
        pointsAwarded: pointValues.referralComplete
      })
      .where(eq(referrals.id, referralId))
      .returning();
    
    await db.update(userPoints)
      .set({ referralCount: sql`${userPoints.referralCount} + 1` })
      .where(eq(userPoints.userId, updated.referrerId));
    
    return updated;
  }

  async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${userId.substring(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    return code;
  }

  // Achievement Notifications
  async createAchievementNotification(notification: InsertAchievementNotification): Promise<AchievementNotification> {
    const [created] = await db.insert(achievementNotifications).values(notification).returning();
    return created;
  }

  async getUserUnreadNotifications(userId: string): Promise<AchievementNotification[]> {
    return db.select().from(achievementNotifications)
      .where(and(eq(achievementNotifications.userId, userId), eq(achievementNotifications.read, false)))
      .orderBy(desc(achievementNotifications.createdAt));
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    await db.update(achievementNotifications)
      .set({ read: true })
      .where(eq(achievementNotifications.id, notificationId));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(achievementNotifications)
      .set({ read: true })
      .where(eq(achievementNotifications.userId, userId));
  }

  // Featured Reviewers
  async getCurrentFeaturedReviewer(): Promise<(FeaturedReviewer & { user: User }) | undefined> {
    const now = new Date();
    const [featured] = await db.select().from(featuredReviewers)
      .where(and(
        eq(featuredReviewers.month, now.getMonth() + 1),
        eq(featuredReviewers.year, now.getFullYear()),
        eq(featuredReviewers.active, true)
      ));
    
    if (!featured) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, featured.userId));
    if (!user) return undefined;
    
    return { ...featured, user };
  }

  async createFeaturedReviewer(data: InsertFeaturedReviewer): Promise<FeaturedReviewer> {
    const [created] = await db.insert(featuredReviewers).values(data).returning();
    return created;
  }

  async getFeaturedReviewerHistory(limit: number = 12): Promise<(FeaturedReviewer & { user: User })[]> {
    const featured = await db.select().from(featuredReviewers)
      .orderBy(desc(featuredReviewers.year), desc(featuredReviewers.month))
      .limit(limit);
    
    if (featured.length === 0) return [];
    
    const userIds = featured.map(f => f.userId);
    const usersList = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(usersList.map(u => [u.id, u]));
    
    return featured
      .filter(f => userMap.has(f.userId))
      .map(f => ({ ...f, user: userMap.get(f.userId)! }));
  }

  // Check and award badges based on user activity
  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const awarded: Badge[] = [];
    const userPts = await this.getOrCreateUserPoints(userId);
    const allBadges = await this.getAllBadges();
    
    for (const badge of allBadges) {
      const hasBadge = await this.hasUserBadge(userId, badge.code);
      if (hasBadge) continue;
      
      let shouldAward = false;
      
      if (badge.reviewsRequired && userPts.reviewCount >= badge.reviewsRequired) {
        shouldAward = true;
      }
      if (badge.pointsRequired && userPts.totalPoints >= badge.pointsRequired) {
        shouldAward = true;
      }
      if (badge.helpfulVotesRequired && userPts.helpfulVotesReceived >= badge.helpfulVotesRequired) {
        shouldAward = true;
      }
      
      if (shouldAward) {
        await this.awardBadge(userId, badge.id);
        await this.createAchievementNotification({
          userId,
          type: 'badge_earned',
          title: `Badge Earned: ${badge.name}`,
          message: badge.description,
          badgeId: badge.id
        });
        awarded.push(badge);
      }
    }
    
    return awarded;
  }

  // Get user engagement profile (for display on user profile)
  async getUserEngagementProfile(userId: string): Promise<{
    points: UserPoints | null;
    badges: (UserBadge & { badge: Badge })[];
    recentTransactions: PointTransaction[];
    rank: number;
    isFeatured: boolean;
  }> {
    const points = await this.getUserPoints(userId);
    const userBadgesList = await this.getUserBadges(userId);
    const transactions = await this.getUserPointTransactions(userId, 10);
    
    let rank = 0;
    if (points) {
      const [rankResult] = await db.select({ count: count() }).from(userPoints)
        .where(sql`${userPoints.totalPoints} > ${points.totalPoints}`);
      rank = (rankResult?.count || 0) + 1;
    }
    
    const featured = await this.getCurrentFeaturedReviewer();
    const isFeatured = featured?.userId === userId;
    
    return {
      points: points || null,
      badges: userBadgesList,
      recentTransactions: transactions,
      rank,
      isFeatured
    };
  }

  // Seed default badges
  async seedDefaultBadges(): Promise<void> {
    const defaultBadges: InsertBadge[] = [
      { code: 'first_review', name: 'First Review', description: 'Wrote your first review', icon: 'star', category: 'reviews', rarity: 'common', reviewsRequired: 1 },
      { code: 'reviewer_5', name: '5 Reviews', description: 'Wrote 5 reviews', icon: 'stars', category: 'reviews', rarity: 'common', reviewsRequired: 5 },
      { code: 'reviewer_10', name: 'Dedicated Reviewer', description: 'Wrote 10 reviews', icon: 'award', category: 'reviews', rarity: 'uncommon', reviewsRequired: 10 },
      { code: 'reviewer_25', name: 'Expert Reviewer', description: 'Wrote 25 reviews', icon: 'trophy', category: 'reviews', rarity: 'rare', reviewsRequired: 25 },
      { code: 'reviewer_50', name: 'Super Reviewer', description: 'Wrote 50 reviews', icon: 'crown', category: 'reviews', rarity: 'epic', reviewsRequired: 50 },
      { code: 'helpful_10', name: 'Helpful', description: 'Received 10 helpful votes', icon: 'thumbs-up', category: 'community', rarity: 'common', helpfulVotesRequired: 10 },
      { code: 'helpful_50', name: 'Very Helpful', description: 'Received 50 helpful votes', icon: 'heart', category: 'community', rarity: 'uncommon', helpfulVotesRequired: 50 },
      { code: 'helpful_100', name: 'Community Hero', description: 'Received 100 helpful votes', icon: 'shield', category: 'community', rarity: 'rare', helpfulVotesRequired: 100 },
      { code: 'points_100', name: 'Rising Star', description: 'Earned 100 points', icon: 'trending-up', category: 'points', rarity: 'common', pointsRequired: 100 },
      { code: 'points_500', name: 'Contributor', description: 'Earned 500 points', icon: 'zap', category: 'points', rarity: 'uncommon', pointsRequired: 500 },
      { code: 'points_1500', name: 'Top Contributor', description: 'Earned 1500 points', icon: 'flame', category: 'points', rarity: 'rare', pointsRequired: 1500 },
      { code: 'verified_expert', name: 'Verified Expert', description: 'Healthcare professional with verified credentials', icon: 'check-circle', category: 'special', rarity: 'legendary', isSecret: true },
      { code: 'early_adopter', name: 'Early Adopter', description: 'Among the first 100 users to join', icon: 'rocket', category: 'special', rarity: 'legendary', isSecret: true },
    ];
    
    for (const badge of defaultBadges) {
      const existing = await this.getBadgeByCode(badge.code);
      if (!existing) {
        await this.createBadge(badge);
      }
    }
  }

  // ==================== HEALTH EDUCATION HUB ====================

  // Health Categories
  async getAllHealthCategories(): Promise<HealthCategory[]> {
    return await db.select().from(healthCategories)
      .where(eq(healthCategories.isActive, true))
      .orderBy(healthCategories.displayOrder);
  }

  async getHealthCategoryBySlug(slug: string): Promise<HealthCategory | undefined> {
    const [category] = await db.select().from(healthCategories)
      .where(eq(healthCategories.slug, slug));
    return category;
  }

  async createHealthCategory(data: InsertHealthCategory): Promise<HealthCategory> {
    const [category] = await db.insert(healthCategories).values(data).returning();
    return category;
  }

  // Health Articles
  async getAllHealthArticles(status?: string): Promise<HealthArticle[]> {
    if (status) {
      return await db.select().from(healthArticles)
        .where(eq(healthArticles.status, status))
        .orderBy(desc(healthArticles.publishedAt));
    }
    return await db.select().from(healthArticles)
      .orderBy(desc(healthArticles.publishedAt));
  }

  async getHealthArticleBySlug(slug: string): Promise<HealthArticle | undefined> {
    const [article] = await db.select().from(healthArticles)
      .where(eq(healthArticles.slug, slug));
    return article;
  }

  async getHealthArticlesByCategory(categoryId: number): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(and(
        eq(healthArticles.categoryId, categoryId),
        eq(healthArticles.status, 'published')
      ))
      .orderBy(desc(healthArticles.publishedAt));
  }

  async getFeaturedHealthArticles(limit = 5): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(and(
        eq(healthArticles.isFeatured, true),
        eq(healthArticles.status, 'published')
      ))
      .orderBy(desc(healthArticles.publishedAt))
      .limit(limit);
  }

  async getPopularHealthArticles(limit = 4): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(eq(healthArticles.status, 'published'))
      .orderBy(desc(healthArticles.viewCount))
      .limit(limit);
  }

  async getRecentHealthArticles(limit = 4): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(eq(healthArticles.status, 'published'))
      .orderBy(desc(healthArticles.publishedAt))
      .limit(limit);
  }

  async getEditorPickHealthArticles(limit = 4): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(and(
        eq(healthArticles.isEditorPick, true),
        eq(healthArticles.status, 'published')
      ))
      .orderBy(desc(healthArticles.publishedAt))
      .limit(limit);
  }

  async createHealthArticle(data: InsertHealthArticle): Promise<HealthArticle> {
    const [article] = await db.insert(healthArticles).values(data).returning();
    if (data.categoryId) {
      await db.update(healthCategories)
        .set({ articleCount: sql`${healthCategories.articleCount} + 1` })
        .where(eq(healthCategories.id, data.categoryId));
    }
    return article;
  }

  async incrementHealthArticleViews(id: number): Promise<void> {
    await db.update(healthArticles)
      .set({ viewCount: sql`${healthArticles.viewCount} + 1` })
      .where(eq(healthArticles.id, id));
  }

  async updateHealthArticle(id: number, data: Partial<InsertHealthArticle>): Promise<HealthArticle | undefined> {
    const [article] = await db.update(healthArticles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(healthArticles.id, id))
      .returning();
    return article;
  }

  async deleteHealthArticle(id: number): Promise<boolean> {
    const [article] = await db.select().from(healthArticles).where(eq(healthArticles.id, id));
    if (!article) return false;
    
    await db.delete(healthArticles).where(eq(healthArticles.id, id));
    
    if (article.categoryId) {
      await db.update(healthCategories)
        .set({ articleCount: sql`${healthCategories.articleCount} - 1` })
        .where(eq(healthCategories.id, article.categoryId));
    }
    return true;
  }

  async getHealthArticleById(id: number): Promise<HealthArticle | undefined> {
    const [article] = await db.select().from(healthArticles).where(eq(healthArticles.id, id));
    return article;
  }

  async searchHealthArticles(query: string): Promise<HealthArticle[]> {
    return await db.select().from(healthArticles)
      .where(and(
        eq(healthArticles.status, 'published'),
        or(
          ilike(healthArticles.title, `%${query}%`),
          ilike(healthArticles.excerpt, `%${query}%`),
          ilike(healthArticles.content, `%${query}%`)
        )
      ))
      .orderBy(desc(healthArticles.viewCount))
      .limit(20);
  }

  // Disease Library
  async getAllDiseases(): Promise<Disease[]> {
    return await db.select().from(diseases)
      .orderBy(diseases.name);
  }

  async getCommonDiseases(): Promise<Disease[]> {
    return await db.select().from(diseases)
      .where(eq(diseases.isCommon, true))
      .orderBy(diseases.name);
  }

  async getDiseaseBySlug(slug: string): Promise<Disease | undefined> {
    const [disease] = await db.select().from(diseases)
      .where(eq(diseases.slug, slug));
    return disease;
  }

  async createDisease(data: InsertDisease): Promise<Disease> {
    const [disease] = await db.insert(diseases).values(data).returning();
    return disease;
  }

  async incrementDiseaseViews(id: number): Promise<void> {
    await db.update(diseases)
      .set({ viewCount: sql`${diseases.viewCount} + 1` })
      .where(eq(diseases.id, id));
  }

  // Health Bookmarks
  async getUserHealthBookmarks(userId: string): Promise<HealthArticle[]> {
    const bookmarksList = await db.select({ articleId: healthBookmarks.articleId })
      .from(healthBookmarks)
      .where(eq(healthBookmarks.userId, userId));
    
    if (bookmarksList.length === 0) return [];
    
    const articleIds = bookmarksList.map(b => b.articleId);
    return await db.select().from(healthArticles)
      .where(inArray(healthArticles.id, articleIds));
  }

  async addHealthBookmark(userId: string, articleId: number): Promise<void> {
    await db.insert(healthBookmarks)
      .values({ userId, articleId })
      .onConflictDoNothing();
    await db.update(healthArticles)
      .set({ bookmarkCount: sql`${healthArticles.bookmarkCount} + 1` })
      .where(eq(healthArticles.id, articleId));
  }

  async removeHealthBookmark(userId: string, articleId: number): Promise<void> {
    await db.delete(healthBookmarks)
      .where(and(
        eq(healthBookmarks.userId, userId),
        eq(healthBookmarks.articleId, articleId)
      ));
    await db.update(healthArticles)
      .set({ bookmarkCount: sql`${healthArticles.bookmarkCount} - 1` })
      .where(eq(healthArticles.id, articleId));
  }

  async isArticleBookmarked(userId: string, articleId: number): Promise<boolean> {
    const [bookmark] = await db.select().from(healthBookmarks)
      .where(and(
        eq(healthBookmarks.userId, userId),
        eq(healthBookmarks.articleId, articleId)
      ));
    return !!bookmark;
  }

  // Health Tips
  async getTodayHealthTip(): Promise<HealthTip | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [tip] = await db.select().from(healthTips)
      .where(and(
        eq(healthTips.displayDate, today),
        eq(healthTips.isActive, true)
      ));
    if (tip) return tip;
    
    const [randomTip] = await db.select().from(healthTips)
      .where(eq(healthTips.isActive, true))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return randomTip;
  }

  async createHealthTip(data: InsertHealthTip): Promise<HealthTip> {
    const [tip] = await db.insert(healthTips).values(data).returning();
    return tip;
  }

  // Newsletter
  async subscribeNewsletter(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [subscriber] = await db.insert(newsletterSubscribers)
      .values(data)
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { isActive: true, unsubscribedAt: null }
      })
      .returning();
    return subscriber;
  }

  async unsubscribeNewsletter(email: string): Promise<void> {
    await db.update(newsletterSubscribers)
      .set({ isActive: false, unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, email));
  }

  async getNewsletterSubscriberCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true));
    return result?.count || 0;
  }

  // Seed default health categories
  async seedHealthCategories(): Promise<void> {
    const defaultCategories: InsertHealthCategory[] = [
      { name: 'Disease Recognition & Symptoms', slug: 'disease-recognition', description: 'Learn to identify common health conditions and their symptoms', icon: 'stethoscope', displayOrder: 1 },
      { name: 'Preventive Care & Wellness', slug: 'preventive-care', description: 'Tips and guidance for staying healthy and preventing illness', icon: 'shield-check', displayOrder: 2 },
      { name: 'Healthy Lifestyle & Nutrition', slug: 'nutrition-lifestyle', description: 'Nutrition advice, exercise tips, and healthy living guides', icon: 'apple', displayOrder: 3 },
      { name: "Women's Health & Maternity", slug: 'womens-health', description: 'Reproductive health, pregnancy, and wellness for women', icon: 'heart', displayOrder: 4 },
      { name: "Children's Health & Pediatrics", slug: 'pediatrics', description: 'Healthcare guidance for infants, children, and adolescents', icon: 'baby', displayOrder: 5 },
      { name: 'Mental Health & Wellbeing', slug: 'mental-health', description: 'Mental wellness, stress management, and emotional health', icon: 'brain', displayOrder: 6 },
      { name: 'Chronic Disease Management', slug: 'chronic-disease', description: 'Living with and managing chronic health conditions', icon: 'activity', displayOrder: 7 },
      { name: 'First Aid & Emergency Care', slug: 'first-aid', description: 'Emergency response, first aid tips, and urgent care guidance', icon: 'ambulance', displayOrder: 8 },
    ];
    
    for (const category of defaultCategories) {
      const existing = await this.getHealthCategoryBySlug(category.slug);
      if (!existing) {
        await this.createHealthCategory(category);
      }
    }
  }

  // Seed common diseases in Nigeria
  async seedCommonDiseases(): Promise<void> {
    const commonDiseases: InsertDisease[] = [
      { name: 'Malaria', slug: 'malaria', description: 'A life-threatening disease caused by parasites transmitted through infected mosquito bites.', symptoms: ['Fever', 'Chills', 'Headache', 'Body aches', 'Fatigue', 'Nausea'], isCommon: true, prevalenceInNigeria: 'Very High - Nigeria accounts for about 27% of global malaria cases' },
      { name: 'Typhoid Fever', slug: 'typhoid', description: 'A bacterial infection caused by Salmonella typhi, spread through contaminated food and water.', symptoms: ['High fever', 'Weakness', 'Stomach pain', 'Headache', 'Loss of appetite'], isCommon: true, prevalenceInNigeria: 'High - Common in areas with poor sanitation' },
      { name: 'Hypertension', slug: 'hypertension', description: 'A chronic condition where blood pressure against artery walls is consistently too high.', symptoms: ['Often no symptoms', 'Headaches', 'Shortness of breath', 'Nosebleeds'], isCommon: true, prevalenceInNigeria: 'High - Affects about 30% of Nigerian adults' },
      { name: 'Diabetes', slug: 'diabetes', description: 'A metabolic disease causing high blood sugar levels over a prolonged period.', symptoms: ['Increased thirst', 'Frequent urination', 'Unexplained weight loss', 'Fatigue', 'Blurred vision'], isCommon: true, prevalenceInNigeria: 'Increasing - About 5.8% of adults affected' },
      { name: 'HIV/AIDS', slug: 'hiv-aids', description: 'A virus that attacks the immune system and can lead to AIDS if not treated.', symptoms: ['Initial flu-like symptoms', 'Later: weight loss', 'Recurring infections', 'Night sweats'], isCommon: true, prevalenceInNigeria: 'Significant - Nigeria has the second-largest HIV epidemic globally' },
      { name: 'Tuberculosis', slug: 'tuberculosis', description: 'A bacterial infection that mainly affects the lungs but can spread to other organs.', symptoms: ['Persistent cough', 'Coughing blood', 'Chest pain', 'Weight loss', 'Night sweats'], isCommon: true, prevalenceInNigeria: 'High - Nigeria is among countries with highest TB burden' },
      { name: 'Cholera', slug: 'cholera', description: 'An acute diarrheal infection caused by ingesting contaminated food or water.', symptoms: ['Severe watery diarrhea', 'Vomiting', 'Dehydration', 'Leg cramps'], isCommon: true, prevalenceInNigeria: 'Seasonal outbreaks common' },
      { name: 'Lassa Fever', slug: 'lassa-fever', description: 'A viral hemorrhagic fever endemic to West Africa, spread by rodents.', symptoms: ['Fever', 'Weakness', 'Headache', 'Bleeding', 'Respiratory problems'], isCommon: true, prevalenceInNigeria: 'Endemic - Seasonal outbreaks occur' },
    ];
    
    for (const disease of commonDiseases) {
      const existing = await this.getDiseaseBySlug(disease.slug);
      if (!existing) {
        await this.createDisease(disease);
      }
    }
  }

  async getCommentsByHospitalId(hospitalId: number): Promise<HospitalComment[]> {
    return db.select().from(hospitalComments)
      .where(and(
        eq(hospitalComments.hospitalId, hospitalId),
        eq(hospitalComments.moderationStatus, "approved")
      ))
      .orderBy(desc(hospitalComments.createdAt));
  }

  async createHospitalComment(comment: InsertHospitalComment): Promise<HospitalComment> {
    const [created] = await db.insert(hospitalComments).values(comment).returning();
    return created;
  }

  async deleteHospitalComment(id: number, userId: string): Promise<void> {
    await db.delete(hospitalComments).where(
      and(eq(hospitalComments.id, id), eq(hospitalComments.userId, userId))
    );
  }

  async getDistinctHmoProviders(): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT unnest(accepted_hmos) AS hmo 
      FROM hospitals 
      WHERE array_length(accepted_hmos, 1) > 0
      ORDER BY hmo
    `);
    return (result as any).rows.map((r: any) => r.hmo);
  }

  // ========== DIAGNOSTIC CENTERS ==========

  async getDiagnosticCenters(params?: { state?: string; city?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResult<DiagnosticCenter>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    const conditions = [];
    if (params?.state) conditions.push(eq(diagnosticCenters.state, params.state));
    if (params?.city) conditions.push(eq(diagnosticCenters.city, params.city));
    if (params?.search) conditions.push(ilike(diagnosticCenters.name, `%${params.search}%`));
    
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db.select({ count: count() }).from(diagnosticCenters).where(where);
    const total = totalResult?.count || 0;
    
    const data = await db.select().from(diagnosticCenters)
      .where(where)
      .orderBy(diagnosticCenters.name)
      .limit(limit)
      .offset(offset);
    
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDiagnosticCenterById(id: number): Promise<DiagnosticCenter | undefined> {
    const [center] = await db.select().from(diagnosticCenters).where(eq(diagnosticCenters.id, id));
    return center;
  }

  async getDiagnosticCenterBySlug(slug: string): Promise<DiagnosticCenter | undefined> {
    const [center] = await db.select().from(diagnosticCenters).where(eq(diagnosticCenters.slug, slug));
    return center;
  }

  async getTestsByCenterId(centerId: number): Promise<DiagnosticTest[]> {
    return db.select().from(diagnosticTests)
      .where(eq(diagnosticTests.centerId, centerId))
      .orderBy(diagnosticTests.category, diagnosticTests.testName);
  }

  async searchDiagnosticTests(params: { category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<(DiagnosticTest & { centerName: string; centerCity: string; centerState: string })[]> {
    const conditions = [];
    if (params.category) conditions.push(eq(diagnosticTests.category, params.category));
    if (params.search) conditions.push(ilike(diagnosticTests.testName, `%${params.search}%`));
    if (params.minPrice) conditions.push(gte(diagnosticTests.priceMin, params.minPrice));
    if (params.maxPrice) conditions.push(sql`${diagnosticTests.priceMax} <= ${params.maxPrice}`);
    
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const results = await db.select({
      id: diagnosticTests.id,
      centerId: diagnosticTests.centerId,
      testName: diagnosticTests.testName,
      category: diagnosticTests.category,
      description: diagnosticTests.description,
      sampleType: diagnosticTests.sampleType,
      preparationNotes: diagnosticTests.preparationNotes,
      turnaroundTime: diagnosticTests.turnaroundTime,
      priceMin: diagnosticTests.priceMin,
      priceMax: diagnosticTests.priceMax,
      currency: diagnosticTests.currency,
      insuranceAccepted: diagnosticTests.insuranceAccepted,
      homeCollection: diagnosticTests.homeCollection,
      createdAt: diagnosticTests.createdAt,
      centerName: diagnosticCenters.name,
      centerCity: sql<string>`COALESCE(${diagnosticCenters.city}, '')`,
      centerState: diagnosticCenters.state,
    }).from(diagnosticTests)
      .innerJoin(diagnosticCenters, eq(diagnosticTests.centerId, diagnosticCenters.id))
      .where(where)
      .orderBy(diagnosticTests.testName);
    
    return results as any;
  }

  // ========== PHYSICIANS ==========

  async getPhysicians(params?: { specialty?: string; city?: string; state?: string; hospitalId?: number; search?: string; page?: number; limit?: number }): Promise<PaginatedResult<Physician>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    if (params?.hospitalId) {
      return this.getPhysiciansByHospitalPaginated(params.hospitalId, page, limit);
    }
    
    const conditions = [];
    if (params?.specialty) conditions.push(eq(physicians.specialty, params.specialty));
    if (params?.city) conditions.push(eq(physicians.city, params.city));
    if (params?.state) conditions.push(eq(physicians.state, params.state));
    if (params?.search) conditions.push(or(
      ilike(physicians.fullName, `%${params.search}%`),
      ilike(physicians.specialty, `%${params.search}%`)
    ));
    
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db.select({ count: count() }).from(physicians).where(where);
    const total = totalResult?.count || 0;
    
    const data = await db.select().from(physicians)
      .where(where)
      .orderBy(physicians.fullName)
      .limit(limit)
      .offset(offset);
    
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async getPhysiciansByHospitalPaginated(hospitalId: number, page: number, limit: number): Promise<PaginatedResult<Physician>> {
    const offset = (page - 1) * limit;
    const affiliationIds = await db.select({ physicianId: physicianAffiliations.physicianId })
      .from(physicianAffiliations)
      .where(eq(physicianAffiliations.hospitalId, hospitalId));
    
    const ids = affiliationIds.map(a => a.physicianId);
    if (ids.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };
    
    const [totalResult] = await db.select({ count: count() }).from(physicians).where(inArray(physicians.id, ids));
    const total = totalResult?.count || 0;
    
    const data = await db.select().from(physicians)
      .where(inArray(physicians.id, ids))
      .orderBy(physicians.fullName)
      .limit(limit)
      .offset(offset);
    
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPhysicianById(id: number): Promise<Physician | undefined> {
    const [physician] = await db.select().from(physicians).where(eq(physicians.id, id));
    return physician;
  }

  async getPhysicianBySlug(slug: string): Promise<Physician | undefined> {
    const [physician] = await db.select().from(physicians).where(eq(physicians.slug, slug));
    return physician;
  }

  async getPhysicianAffiliations(physicianId: number): Promise<(PhysicianAffiliation & { hospitalName: string; hospitalCity: string; hospitalState: string })[]> {
    const results = await db.select({
      id: physicianAffiliations.id,
      physicianId: physicianAffiliations.physicianId,
      hospitalId: physicianAffiliations.hospitalId,
      role: physicianAffiliations.role,
      department: physicianAffiliations.department,
      availableDays: physicianAffiliations.availableDays,
      availableHours: physicianAffiliations.availableHours,
      createdAt: physicianAffiliations.createdAt,
      hospitalName: hospitals.name,
      hospitalCity: sql<string>`COALESCE(${hospitals.city}, '')`,
      hospitalState: hospitals.state,
    }).from(physicianAffiliations)
      .innerJoin(hospitals, eq(physicianAffiliations.hospitalId, hospitals.id))
      .where(eq(physicianAffiliations.physicianId, physicianId));
    
    return results as any;
  }

  async getPhysiciansByHospitalId(hospitalId: number): Promise<(Physician & { role: string; department: string | null })[]> {
    const results = await db.select({
      id: physicians.id,
      fullName: physicians.fullName,
      slug: physicians.slug,
      title: physicians.title,
      gender: physicians.gender,
      specialty: physicians.specialty,
      subspecialty: physicians.subspecialty,
      qualifications: physicians.qualifications,
      bio: physicians.bio,
      yearsOfExperience: physicians.yearsOfExperience,
      consultationFee: physicians.consultationFee,
      currency: physicians.currency,
      phone: physicians.phone,
      email: physicians.email,
      languages: physicians.languages,
      acceptingNewPatients: physicians.acceptingNewPatients,
      teleconsultation: physicians.teleconsultation,
      averageRating: physicians.averageRating,
      totalReviews: physicians.totalReviews,
      city: physicians.city,
      state: physicians.state,
      createdAt: physicians.createdAt,
      updatedAt: physicians.updatedAt,
      role: sql<string>`COALESCE(${physicianAffiliations.role}, 'Consultant')`,
      department: physicianAffiliations.department,
    }).from(physicianAffiliations)
      .innerJoin(physicians, eq(physicianAffiliations.physicianId, physicians.id))
      .where(eq(physicianAffiliations.hospitalId, hospitalId));
    
    return results as any;
  }

  async getPhysicianSpecialties(): Promise<string[]> {
    const results = await db.selectDistinct({ specialty: physicians.specialty })
      .from(physicians)
      .orderBy(physicians.specialty);
    return results.map(r => r.specialty);
  }

  async getPhysicianCities(): Promise<string[]> {
    const results = await db.selectDistinct({ city: physicians.city })
      .from(physicians)
      .where(sql`${physicians.city} IS NOT NULL`)
      .orderBy(physicians.city);
    return results.map(r => r.city!);
  }
  // ========== PHARMACIES ==========

  async getPharmacies(params?: { state?: string; city?: string; search?: string; verified?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<Pharmacy>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    const conditions = [];
    if (params?.state) conditions.push(eq(pharmacies.state, params.state));
    if (params?.city) conditions.push(eq(pharmacies.city, params.city));
    if (params?.search) conditions.push(ilike(pharmacies.name, `%${params.search}%`));
    if (params?.verified !== undefined) conditions.push(eq(pharmacies.isVerified, params.verified));
    
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db.select({ count: count() }).from(pharmacies).where(where);
    const total = totalResult?.count || 0;
    
    const data = await db.select().from(pharmacies)
      .where(where)
      .orderBy(pharmacies.name)
      .limit(limit)
      .offset(offset);
    
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPharmacyById(id: number): Promise<Pharmacy | undefined> {
    const [pharmacy] = await db.select().from(pharmacies).where(eq(pharmacies.id, id));
    return pharmacy;
  }

  async getPharmacyBySlug(slug: string): Promise<Pharmacy | undefined> {
    const [pharmacy] = await db.select().from(pharmacies).where(eq(pharmacies.slug, slug));
    return pharmacy;
  }
}

export const storage = new DatabaseStorage();
