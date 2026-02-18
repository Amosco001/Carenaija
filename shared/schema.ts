import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  serial,
  integer,
  doublePrecision,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = ["user", "editor", "moderator", "super_admin"] as const;
export type UserRole = typeof userRoleEnum[number];

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"),
  phoneNumber: varchar("phone_number"),
  emailVerifiedAt: timestamp("email_verified_at"),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  lastIpAddress: varchar("last_ip_address"),
  isAdmin: boolean("is_admin").notNull().default(false),
  role: text("role").notNull().default("user"),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  suspensionExpiresAt: timestamp("suspension_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_users_email").on(table.email),
  index("IDX_users_role").on(table.role),
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Specialties/Categories table
export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_specialties_name").on(table.name),
]);

export const insertSpecialtySchema = createInsertSchema(specialties).omit({
  id: true,
  createdAt: true,
});

export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialties.$inferSelect;

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  address: text("address").notNull(),
  city: text("city"),
  lga: text("lga").notNull(),
  state: text("state").notNull().default("Lagos"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  ownership: text("ownership").notNull(),
  bedCapacity: integer("bed_capacity"),
  operatingHours: text("operating_hours"),
  services: text("services").array().notNull().default(sql`'{}'`),
  facilities: text("facilities").array().notNull().default(sql`'{}'`),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  verified: boolean("verified").notNull().default(false),
  averageRating: doublePrecision("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
  claimedBy: varchar("claimed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_hospitals_name").on(table.name),
  index("IDX_hospitals_slug").on(table.slug),
  index("IDX_hospitals_state").on(table.state),
  index("IDX_hospitals_city").on(table.city),
  index("IDX_hospitals_verified").on(table.verified),
  index("IDX_hospitals_average_rating").on(table.averageRating),
]);

export function generateHospitalSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getStateSlug(state: string): string {
  return state.toLowerCase().replace(/\s+/g, '-');
}

export function getHospitalUrl(hospital: { slug?: string | null; state: string; id: number }): string {
  const stateSlug = getStateSlug(hospital.state);
  if (hospital.slug) {
    return `/hospitals/${stateSlug}/${hospital.slug}`;
  }
  return `/hospitals/${stateSlug}/${hospital.id}`;
}

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  averageRating: true,
  totalReviews: true,
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;

// Hospital-Specialty junction table
export const hospitalSpecialties = pgTable("hospital_specialties", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  specialtyId: integer("specialty_id").notNull().references(() => specialties.id, { onDelete: "cascade" }),
}, (table) => [
  index("IDX_hospital_specialties_hospital").on(table.hospitalId),
  index("IDX_hospital_specialties_specialty").on(table.specialtyId),
]);

export type HospitalSpecialty = typeof hospitalSpecialties.$inferSelect;

// Hospital Images table
export const hospitalImages = pgTable("hospital_images", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_hospital_images_hospital").on(table.hospitalId),
]);

export const insertHospitalImageSchema = createInsertSchema(hospitalImages).omit({
  id: true,
  createdAt: true,
});

export type InsertHospitalImage = z.infer<typeof insertHospitalImageSchema>;
export type HospitalImage = typeof hospitalImages.$inferSelect;

// Patient Reviews table (enhanced with verification and moderation fields)
export const patientReviews = pgTable("patient_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
  reviewerRole: text("reviewer_role").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  title: text("title"),
  rating: integer("rating").notNull(),
  waitTime: text("wait_time"),
  cleanliness: integer("cleanliness"),
  staffAttitude: integer("staff_attitude"),
  facilities: integer("facilities"),
  reviewText: text("review_text").notNull(),
  visitDate: date("visit_date"),
  verifiedVisit: boolean("verified_visit").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  wouldRecommend: boolean("would_recommend").notNull(),
  proofAttachmentUrl: text("proof_attachment_url"),
  proofType: text("proof_type"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  moderationStatus: text("moderation_status").notNull().default("approved"),
  spamScore: integer("spam_score").notNull().default(0),
  submittedIp: varchar("submitted_ip"),
  flaggedReason: text("flagged_reason"),
  flaggedBy: varchar("flagged_by").references(() => users.id),
  flaggedAt: timestamp("flagged_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_patient_reviews_hospital").on(table.hospitalId),
  index("IDX_patient_reviews_user").on(table.userId),
  index("IDX_patient_reviews_rating").on(table.rating),
  index("IDX_patient_reviews_created").on(table.createdAt),
  index("IDX_patient_reviews_moderation").on(table.moderationStatus),
  index("IDX_patient_reviews_user_hospital").on(table.userId, table.hospitalId),
]);

export const insertPatientReviewSchema = createInsertSchema(patientReviews).omit({
  id: true,
  createdAt: true,
  helpfulCount: true,
  verifiedVisit: true,
});

export type InsertPatientReview = z.infer<typeof insertPatientReviewSchema>;
export type PatientReview = typeof patientReviews.$inferSelect;

// Employee Reviews table
export const employeeReviews = pgTable("employee_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  title: text("title"),
  position: text("position").notNull(),
  employmentStatus: text("employment_status").notNull(),
  rating: integer("rating").notNull(),
  workLifeBalance: integer("work_life_balance"),
  compensation: integer("compensation"),
  management: integer("management"),
  careerGrowth: integer("career_growth"),
  reviewText: text("review_text").notNull(),
  pros: text("pros"),
  cons: text("cons"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  wouldRecommend: boolean("would_recommend").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_employee_reviews_hospital").on(table.hospitalId),
  index("IDX_employee_reviews_user").on(table.userId),
  index("IDX_employee_reviews_rating").on(table.rating),
]);

export const insertEmployeeReviewSchema = createInsertSchema(employeeReviews).omit({
  id: true,
  createdAt: true,
  helpfulCount: true,
});

export type InsertEmployeeReview = z.infer<typeof insertEmployeeReviewSchema>;
export type EmployeeReview = typeof employeeReviews.$inferSelect;

// Hospital Suggestions table
export const hospitalSuggestions = pgTable("hospital_suggestions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  suggestedBy: text("suggested_by").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lga: text("lga").notNull(),
  state: text("state").notNull(),
  ownership: text("ownership").notNull(),
  bedCapacity: integer("bed_capacity"),
  operatingHours: text("operating_hours"),
  services: text("services").array().notNull().default(sql`'{}'`),
  email: text("email"),
  phone: text("phone"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_hospital_suggestions_status").on(table.status),
]);

export const insertHospitalSuggestionSchema = createInsertSchema(hospitalSuggestions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertHospitalSuggestion = z.infer<typeof insertHospitalSuggestionSchema>;
export type HospitalSuggestion = typeof hospitalSuggestions.$inferSelect;

// Claim Requests table
export const claimRequests = pgTable("claim_requests", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  verificationDoc: text("verification_doc"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_claim_requests_hospital").on(table.hospitalId),
  index("IDX_claim_requests_status").on(table.status),
]);

export const insertClaimRequestSchema = createInsertSchema(claimRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertClaimRequest = z.infer<typeof insertClaimRequestSchema>;
export type ClaimRequest = typeof claimRequests.$inferSelect;

// Relations
export const hospitalsRelations = relations(hospitals, ({ many, one }) => ({
  patientReviews: many(patientReviews),
  employeeReviews: many(employeeReviews),
  claimRequests: many(claimRequests),
  images: many(hospitalImages),
  hospitalSpecialties: many(hospitalSpecialties),
  hospitalComments: many(hospitalComments),
  claimedByUser: one(users, {
    fields: [hospitals.claimedBy],
    references: [users.id],
  }),
}));

export const specialtiesRelations = relations(specialties, ({ many }) => ({
  hospitalSpecialties: many(hospitalSpecialties),
}));

export const hospitalSpecialtiesRelations = relations(hospitalSpecialties, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalSpecialties.hospitalId],
    references: [hospitals.id],
  }),
  specialty: one(specialties, {
    fields: [hospitalSpecialties.specialtyId],
    references: [specialties.id],
  }),
}));

export const hospitalImagesRelations = relations(hospitalImages, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalImages.hospitalId],
    references: [hospitals.id],
  }),
  uploadedByUser: one(users, {
    fields: [hospitalImages.uploadedBy],
    references: [users.id],
  }),
}));

export const patientReviewsRelations = relations(patientReviews, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [patientReviews.hospitalId],
    references: [hospitals.id],
  }),
  user: one(users, {
    fields: [patientReviews.userId],
    references: [users.id],
  }),
}));

export const employeeReviewsRelations = relations(employeeReviews, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [employeeReviews.hospitalId],
    references: [hospitals.id],
  }),
  user: one(users, {
    fields: [employeeReviews.userId],
    references: [users.id],
  }),
}));

export const hospitalSuggestionsRelations = relations(hospitalSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [hospitalSuggestions.userId],
    references: [users.id],
  }),
}));

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [claimRequests.hospitalId],
    references: [hospitals.id],
  }),
  user: one(users, {
    fields: [claimRequests.userId],
    references: [users.id],
  }),
}));

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_bookmarks_user").on(table.userId),
  index("IDX_bookmarks_hospital").on(table.hospitalId),
]);

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  hospital: one(hospitals, {
    fields: [bookmarks.hospitalId],
    references: [hospitals.id],
  }),
}));

// Hospital Comments/Recommendations table
export const hospitalComments = pgTable("hospital_comments", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  commentText: text("comment_text").notNull(),
  recommends: boolean("recommends"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  moderationStatus: text("moderation_status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_hospital_comments_hospital").on(table.hospitalId),
  index("IDX_hospital_comments_user").on(table.userId),
  index("IDX_hospital_comments_created").on(table.createdAt),
  index("IDX_hospital_comments_moderation").on(table.moderationStatus),
]);

export const insertHospitalCommentSchema = createInsertSchema(hospitalComments).omit({
  id: true,
  createdAt: true,
  helpfulCount: true,
});

export type InsertHospitalComment = z.infer<typeof insertHospitalCommentSchema>;
export type HospitalComment = typeof hospitalComments.$inferSelect;

export const hospitalCommentsRelations = relations(hospitalComments, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalComments.hospitalId],
    references: [hospitals.id],
  }),
  user: one(users, {
    fields: [hospitalComments.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  patientReviews: many(patientReviews),
  employeeReviews: many(employeeReviews),
  hospitalSuggestions: many(hospitalSuggestions),
  claimRequests: many(claimRequests),
  claimedHospitals: many(hospitals),
  uploadedImages: many(hospitalImages),
  bookmarks: many(bookmarks),
  reviewFlags: many(reviewFlags),
  hospitalComments: many(hospitalComments),
}));

// Review Flags table - for reporting reviews
export const reviewFlags = pgTable("review_flags", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => patientReviews.id, { onDelete: "cascade" }),
  reviewType: text("review_type").notNull().default("patient"),
  reporterUserId: varchar("reporter_user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_review_flags_review").on(table.reviewId),
  index("IDX_review_flags_status").on(table.status),
  index("IDX_review_flags_reporter").on(table.reporterUserId),
]);

export const insertReviewFlagSchema = createInsertSchema(reviewFlags).omit({
  id: true,
  createdAt: true,
  status: true,
  resolvedBy: true,
  resolvedAt: true,
  resolution: true,
});

export type InsertReviewFlag = z.infer<typeof insertReviewFlagSchema>;
export type ReviewFlag = typeof reviewFlags.$inferSelect;

export const reviewFlagsRelations = relations(reviewFlags, ({ one }) => ({
  review: one(patientReviews, {
    fields: [reviewFlags.reviewId],
    references: [patientReviews.id],
  }),
  reporter: one(users, {
    fields: [reviewFlags.reporterUserId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [reviewFlags.resolvedBy],
    references: [users.id],
  }),
}));

// Verification Tokens table - for email/phone verification
export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull(),
  type: text("type").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_verification_tokens_user").on(table.userId),
  index("IDX_verification_tokens_token").on(table.token),
]);

export const insertVerificationTokenSchema = createInsertSchema(verificationTokens).omit({
  id: true,
  createdAt: true,
  consumedAt: true,
});

export type InsertVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
export type VerificationToken = typeof verificationTokens.$inferSelect;

// Spam Keywords table - for automated spam detection
export const spamKeywords = pgTable("spam_keywords", {
  id: serial("id").primaryKey(),
  phrase: text("phrase").notNull().unique(),
  weight: integer("weight").notNull().default(10),
  category: text("category").notNull().default("general"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_spam_keywords_active").on(table.active),
]);

export const insertSpamKeywordSchema = createInsertSchema(spamKeywords).omit({
  id: true,
  createdAt: true,
});

export type InsertSpamKeyword = z.infer<typeof insertSpamKeywordSchema>;
export type SpamKeyword = typeof spamKeywords.$inferSelect;

// IP Tracking table - for spam prevention
export const ipTracking = pgTable("ip_tracking", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: integer("resource_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_ip_tracking_ip").on(table.ipAddress),
  index("IDX_ip_tracking_created").on(table.createdAt),
]);

export type IpTracking = typeof ipTracking.$inferSelect;

// Admin Audit Log table
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_admin_audit_admin").on(table.adminUserId),
  index("IDX_admin_audit_target").on(table.targetType, table.targetId),
]);

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

// Login Attempts table - for brute force protection
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastAttempt: timestamp("last_attempt").defaultNow(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_login_attempts_identifier").on(table.identifier),
  index("IDX_login_attempts_locked").on(table.lockedUntil),
]);

export type LoginAttempt = typeof loginAttempts.$inferSelect;

// Security Events table - for comprehensive security audit logging
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: varchar("user_id"),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  requestPath: text("request_path"),
  requestMethod: varchar("request_method"),
  statusCode: integer("status_code"),
  severity: text("severity").notNull().default("info"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_security_events_type").on(table.eventType),
  index("IDX_security_events_ip").on(table.ipAddress),
  index("IDX_security_events_severity").on(table.severity),
  index("IDX_security_events_created").on(table.createdAt),
]);

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

// Pending Hospitals table - for scraped hospitals awaiting verification
export const pendingHospitals = pgTable("pending_hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  lga: text("lga"),
  state: text("state"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  type: text("type"), // hospital, clinic, diagnostic center
  ownership: text("ownership"),
  specialties: text("specialties").array().default(sql`'{}'`),
  services: text("services").array().default(sql`'{}'`),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name").notNull(), // google_places, ministry_health, hmo_directory, etc.
  sourceId: text("source_id"), // External ID from source (e.g., Google Place ID)
  rawData: jsonb("raw_data"), // Store original scraped data
  googleRating: doublePrecision("google_rating"),
  googleReviewCount: integer("google_review_count"),
  googlePhotos: text("google_photos").array().default(sql`'{}'`),
  googleOpeningHours: jsonb("google_opening_hours"),
  googleCategories: text("google_categories").array().default(sql`'{}'`),
  googleVerified: boolean("google_verified").default(false),
  completenessScore: doublePrecision("completeness_score"),
  confidenceScore: doublePrecision("confidence_score"),
  autoApproved: boolean("auto_approved").default(false),
  duplicateOfId: integer("duplicate_of_id").references(() => hospitals.id),
  duplicateScore: doublePrecision("duplicate_score"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, duplicate
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_pending_hospitals_status").on(table.status),
  index("IDX_pending_hospitals_source").on(table.sourceName),
  index("IDX_pending_hospitals_state").on(table.state),
  index("IDX_pending_hospitals_created").on(table.createdAt),
  index("IDX_pending_hospitals_source_id").on(table.sourceId),
  index("IDX_pending_hospitals_auto_approved").on(table.autoApproved),
]);

export const insertPendingHospitalSchema = createInsertSchema(pendingHospitals).omit({
  id: true,
  createdAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
});

export type InsertPendingHospital = z.infer<typeof insertPendingHospitalSchema>;
export type PendingHospital = typeof pendingHospitals.$inferSelect;

// Scraping Jobs table - for tracking scraping tasks
export const scrapingJobs = pgTable("scraping_jobs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // google_places, ministry_health, etc.
  targetCity: text("target_city"),
  targetState: text("target_state"),
  jobType: text("job_type").notNull(), // discover, update, verify
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  priority: integer("priority").notNull().default(5),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  itemsProcessed: integer("items_processed").default(0),
  itemsDiscovered: integer("items_discovered").default(0),
  itemsDuplicate: integer("items_duplicate").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_scraping_jobs_status").on(table.status),
  index("IDX_scraping_jobs_source").on(table.source),
  index("IDX_scraping_jobs_scheduled").on(table.scheduledFor),
]);

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  itemsProcessed: true,
  itemsDiscovered: true,
  itemsDuplicate: true,
});

export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;
export type ScrapingJob = typeof scrapingJobs.$inferSelect;

// Scraping Logs table - for detailed activity logging
export const scrapingLogs = pgTable("scraping_logs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => scrapingJobs.id, { onDelete: "cascade" }),
  level: text("level").notNull().default("info"), // debug, info, warn, error
  message: text("message").notNull(),
  source: text("source"),
  url: text("url"),
  responseStatus: integer("response_status"),
  duration: integer("duration"), // milliseconds
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_scraping_logs_job").on(table.jobId),
  index("IDX_scraping_logs_level").on(table.level),
  index("IDX_scraping_logs_created").on(table.createdAt),
]);

export type ScrapingLog = typeof scrapingLogs.$inferSelect;

// Scraping Sources table - for configurable data sources
export const scrapingSources = pgTable("scraping_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull(), // api, web_scraper
  baseUrl: text("base_url"),
  enabled: boolean("enabled").notNull().default(true),
  rateLimit: integer("rate_limit").default(10), // requests per minute
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  scheduleInterval: text("schedule_interval"), // daily, weekly, monthly
  config: jsonb("config"), // Source-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_scraping_sources_enabled").on(table.enabled),
  index("IDX_scraping_sources_next_run").on(table.nextRunAt),
]);

export type ScrapingSource = typeof scrapingSources.$inferSelect;

// Unverified Submissions table - for news/social media discovered hospitals
export const unverifiedSubmissions = pgTable("unverified_submissions", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull(), // rss, news, twitter, facebook, press_release
  sourceName: text("source_name").notNull(), // e.g., "punch_ng", "vanguard"
  sourceUrl: text("source_url").notNull(),
  headline: text("headline"),
  excerpt: text("excerpt"),
  rawText: text("raw_text"),
  publishedAt: timestamp("published_at"),
  hospitalName: text("hospital_name"),
  hospitalAliases: jsonb("hospital_aliases"),
  city: text("city"),
  state: text("state"),
  geoConfidence: doublePrecision("geo_confidence"),
  openingDate: text("opening_date"),
  servicesDetected: text("services_detected").array().default(sql`'{}'`),
  sentimentScore: doublePrecision("sentiment_score"),
  credibilityScore: doublePrecision("credibility_score"),
  extractedEntities: jsonb("extracted_entities"),
  eventType: text("event_type"), // opening, expansion, renovation, closure
  status: text("status").notNull().default("pending"), // pending, verified, ignored, promoted
  promotedToHospitalId: integer("promoted_to_hospital_id").references(() => hospitals.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_unverified_submissions_status").on(table.status),
  index("IDX_unverified_submissions_source").on(table.sourceType),
  index("IDX_unverified_submissions_state").on(table.state),
  index("IDX_unverified_submissions_created").on(table.createdAt),
  index("IDX_unverified_submissions_event").on(table.eventType),
]);

export const insertUnverifiedSubmissionSchema = createInsertSchema(unverifiedSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
  promotedToHospitalId: true,
});

export type InsertUnverifiedSubmission = z.infer<typeof insertUnverifiedSubmissionSchema>;
export type UnverifiedSubmission = typeof unverifiedSubmissions.$inferSelect;

// Relations for scraping tables
export const pendingHospitalsRelations = relations(pendingHospitals, ({ one }) => ({
  duplicateOf: one(hospitals, {
    fields: [pendingHospitals.duplicateOfId],
    references: [hospitals.id],
  }),
  reviewer: one(users, {
    fields: [pendingHospitals.reviewedBy],
    references: [users.id],
  }),
}));

export const scrapingJobsRelations = relations(scrapingJobs, ({ many }) => ({
  logs: many(scrapingLogs),
}));

export const scrapingLogsRelations = relations(scrapingLogs, ({ one }) => ({
  job: one(scrapingJobs, {
    fields: [scrapingLogs.jobId],
    references: [scrapingJobs.id],
  }),
}));

// Email notification preferences
export const emailPreferences = pgTable("email_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  welcomeEmail: boolean("welcome_email").notNull().default(true),
  newReviewOnFollowed: boolean("new_review_on_followed").notNull().default(true),
  reviewResponse: boolean("review_response").notNull().default(true),
  weeklyDigest: boolean("weekly_digest").notNull().default(true),
  reviewMilestones: boolean("review_milestones").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  weeklyDigestDay: integer("weekly_digest_day").notNull().default(1), // 0=Sunday, 1=Monday, etc.
  lastDigestSentAt: timestamp("last_digest_sent_at"),
  unsubscribeToken: varchar("unsubscribe_token").notNull().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_email_preferences_user").on(table.userId),
  index("IDX_email_preferences_unsubscribe").on(table.unsubscribeToken),
]);

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  unsubscribeToken: true,
});

export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

// User followed hospitals
export const followedHospitals = pgTable("followed_hospitals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  notifyNewReviews: boolean("notify_new_reviews").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_followed_hospitals_user").on(table.userId),
  index("IDX_followed_hospitals_hospital").on(table.hospitalId),
]);

export const insertFollowedHospitalSchema = createInsertSchema(followedHospitals).omit({
  id: true,
  createdAt: true,
});

export type InsertFollowedHospital = z.infer<typeof insertFollowedHospitalSchema>;
export type FollowedHospital = typeof followedHospitals.$inferSelect;

// Email outbox for queued emails
export const emailOutbox = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  toEmail: varchar("to_email").notNull(),
  templateType: text("template_type").notNull(), // welcome, new_review, review_response, weekly_digest, milestone, verification, password_reset
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  payload: jsonb("payload"), // Additional data for the email
  status: text("status").notNull().default("pending"), // pending, sent, failed
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sendAfter: timestamp("send_after").defaultNow(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_email_outbox_status").on(table.status),
  index("IDX_email_outbox_user").on(table.userId),
  index("IDX_email_outbox_send_after").on(table.sendAfter),
]);

export const insertEmailOutboxSchema = createInsertSchema(emailOutbox).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  attempts: true,
  lastError: true,
});

export type InsertEmailOutbox = z.infer<typeof insertEmailOutboxSchema>;
export type EmailOutbox = typeof emailOutbox.$inferSelect;

// User review stats for milestone tracking
export const userReviewStats = pgTable("user_review_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalPatientReviews: integer("total_patient_reviews").notNull().default(0),
  totalEmployeeReviews: integer("total_employee_reviews").notNull().default(0),
  lastMilestoneNotified: integer("last_milestone_notified").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_user_review_stats_user").on(table.userId),
]);

export type UserReviewStats = typeof userReviewStats.$inferSelect;

// Review responses from hospitals
export const reviewResponses = pgTable("review_responses", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  reviewType: text("review_type").notNull(), // patient or employee
  responderId: varchar("responder_id").notNull().references(() => users.id),
  responseText: text("response_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_review_responses_review").on(table.reviewId),
  index("IDX_review_responses_responder").on(table.responderId),
]);

export const insertReviewResponseSchema = createInsertSchema(reviewResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReviewResponse = z.infer<typeof insertReviewResponseSchema>;
export type ReviewResponse = typeof reviewResponses.$inferSelect;

// Relations for email/notification tables
export const emailPreferencesRelations = relations(emailPreferences, ({ one }) => ({
  user: one(users, {
    fields: [emailPreferences.userId],
    references: [users.id],
  }),
}));

export const followedHospitalsRelations = relations(followedHospitals, ({ one }) => ({
  user: one(users, {
    fields: [followedHospitals.userId],
    references: [users.id],
  }),
  hospital: one(hospitals, {
    fields: [followedHospitals.hospitalId],
    references: [hospitals.id],
  }),
}));

export const reviewResponsesRelations = relations(reviewResponses, ({ one }) => ({
  responder: one(users, {
    fields: [reviewResponses.responderId],
    references: [users.id],
  }),
}));

// Site Content table - for CMS managed content (homepage, about, FAQs)
export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("html"),
  metadata: jsonb("metadata"),
  isPublished: boolean("is_published").notNull().default(true),
  version: integer("version").notNull().default(1),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_site_content_key").on(table.key),
  index("IDX_site_content_published").on(table.isPublished),
]);

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;

// Site Content History table - for versioning
export const siteContentHistory = pgTable("site_content_history", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => siteContent.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_site_content_history_content").on(table.contentId),
  index("IDX_site_content_history_version").on(table.version),
]);

export type SiteContentHistory = typeof siteContentHistory.$inferSelect;

// Site Settings table - for configuration
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  fieldType: text("field_type").notNull().default("text"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_site_settings_category").on(table.category),
  index("IDX_site_settings_key").on(table.key),
]);

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

// Admin Email Templates table - for customizable email templates
export const adminEmailTemplates = pgTable("admin_email_templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  description: text("description"),
  variables: text("variables").array().default(sql`'{}'`),
  isActive: boolean("is_active").notNull().default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_admin_email_templates_key").on(table.key),
  index("IDX_admin_email_templates_active").on(table.isActive),
]);

export const insertAdminEmailTemplateSchema = createInsertSchema(adminEmailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdminEmailTemplate = z.infer<typeof insertAdminEmailTemplateSchema>;
export type AdminEmailTemplate = typeof adminEmailTemplates.$inferSelect;

// Relations for admin tables
export const siteContentRelations = relations(siteContent, ({ one, many }) => ({
  updatedByUser: one(users, {
    fields: [siteContent.updatedBy],
    references: [users.id],
  }),
  history: many(siteContentHistory),
}));

export const siteContentHistoryRelations = relations(siteContentHistory, ({ one }) => ({
  content: one(siteContent, {
    fields: [siteContentHistory.contentId],
    references: [siteContent.id],
  }),
  changedByUser: one(users, {
    fields: [siteContentHistory.changedBy],
    references: [users.id],
  }),
}));

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [siteSettings.updatedBy],
    references: [users.id],
  }),
}));

export const adminEmailTemplatesRelations = relations(adminEmailTemplates, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [adminEmailTemplates.updatedBy],
    references: [users.id],
  }),
}));

// Review Helpful Votes table - track who found reviews helpful
export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  reviewType: text("review_type").notNull().default("patient"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_review_helpful_votes_review").on(table.reviewId, table.reviewType),
  index("IDX_review_helpful_votes_user").on(table.userId),
]);

export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type InsertReviewHelpfulVote = typeof reviewHelpfulVotes.$inferInsert;

// Hospital Responses table - hospital responses to reviews
export const hospitalResponses = pgTable("hospital_responses", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  reviewType: text("review_type").notNull().default("patient"),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  responderId: varchar("responder_id").notNull().references(() => users.id),
  responderName: text("responder_name").notNull(),
  responderTitle: text("responder_title"),
  responseText: text("response_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_hospital_responses_review").on(table.reviewId, table.reviewType),
  index("IDX_hospital_responses_hospital").on(table.hospitalId),
]);

export const insertHospitalResponseSchema = createInsertSchema(hospitalResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHospitalResponse = z.infer<typeof insertHospitalResponseSchema>;
export type HospitalResponse = typeof hospitalResponses.$inferSelect;

// Testimonials table - featured user testimonials for homepage
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  location: text("location"),
  quote: text("quote").notNull(),
  rating: integer("rating"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_testimonials_active").on(table.isActive),
  index("IDX_testimonials_order").on(table.displayOrder),
]);

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Press Mentions table - media coverage and awards
export const pressMentions = pgTable("press_mentions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  sourceLogoUrl: text("source_logo_url"),
  articleUrl: text("article_url"),
  excerpt: text("excerpt"),
  mentionType: text("mention_type").notNull().default("press"),
  publishedAt: timestamp("published_at"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_press_mentions_active").on(table.isActive),
  index("IDX_press_mentions_type").on(table.mentionType),
]);

export const insertPressMentionSchema = createInsertSchema(pressMentions).omit({
  id: true,
  createdAt: true,
});

export type InsertPressMention = z.infer<typeof insertPressMentionSchema>;
export type PressMention = typeof pressMentions.$inferSelect;

// Platform Stats table - cached platform statistics
export const platformStats = pgTable("platform_stats", {
  id: serial("id").primaryKey(),
  statKey: text("stat_key").notNull().unique(),
  statValue: integer("stat_value").notNull().default(0),
  displayLabel: text("display_label").notNull(),
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_platform_stats_key").on(table.statKey),
]);

export type PlatformStat = typeof platformStats.$inferSelect;
export type InsertPlatformStat = typeof platformStats.$inferInsert;

// Relations for trust building tables
export const reviewHelpfulVotesRelations = relations(reviewHelpfulVotes, ({ one }) => ({
  user: one(users, {
    fields: [reviewHelpfulVotes.userId],
    references: [users.id],
  }),
}));

export const hospitalResponsesRelations = relations(hospitalResponses, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalResponses.hospitalId],
    references: [hospitals.id],
  }),
  responder: one(users, {
    fields: [hospitalResponses.responderId],
    references: [users.id],
  }),
}));

// ============================================
// BLOG SYSTEM TABLES
// ============================================

// Blog Categories table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  parentId: integer("parent_id"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_blog_categories_slug").on(table.slug),
  index("IDX_blog_categories_active").on(table.isActive),
]);

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;

// Blog Tags table
export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_blog_tags_slug").on(table.slug),
  index("IDX_blog_tags_usage").on(table.usageCount),
]);

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogTag = typeof blogTags.$inferSelect;

// Blog article status enum
export const blogArticleStatusEnum = ["draft", "published", "scheduled", "archived"] as const;
export type BlogArticleStatus = typeof blogArticleStatusEnum[number];

// Blog article type enum
export const blogArticleTypeEnum = ["article", "hospital_guide", "specialty_guide", "healthcare_tips", "news"] as const;
export type BlogArticleType = typeof blogArticleTypeEnum[number];

// Blog Articles table
export const blogArticles = pgTable("blog_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  contentHtml: text("content_html"),
  coverImageUrl: text("cover_image_url"),
  coverImageAlt: text("cover_image_alt"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  authorName: text("author_name").notNull(),
  authorBio: text("author_bio"),
  authorAvatarUrl: text("author_avatar_url"),
  categoryId: integer("category_id").references(() => blogCategories.id),
  articleType: text("article_type").notNull().default("article"),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(5),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  allowComments: boolean("allow_comments").notNull().default(true),
  relatedHospitalId: integer("related_hospital_id").references(() => hospitals.id),
  relatedCity: text("related_city"),
  relatedState: text("related_state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_blog_articles_slug").on(table.slug),
  index("IDX_blog_articles_status").on(table.status),
  index("IDX_blog_articles_published").on(table.publishedAt),
  index("IDX_blog_articles_category").on(table.categoryId),
  index("IDX_blog_articles_type").on(table.articleType),
  index("IDX_blog_articles_featured").on(table.isFeatured),
  index("IDX_blog_articles_author").on(table.authorId),
]);

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
});

export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;

// Blog Article Tags junction table
export const blogArticleTags = pgTable("blog_article_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => blogArticles.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
}, (table) => [
  index("IDX_blog_article_tags_article").on(table.articleId),
  index("IDX_blog_article_tags_tag").on(table.tagId),
]);

export type BlogArticleTag = typeof blogArticleTags.$inferSelect;

// Blog Comments table
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => blogArticles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  userAvatarUrl: text("user_avatar_url"),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  likeCount: integer("like_count").notNull().default(0),
  status: text("status").notNull().default("approved"),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_blog_comments_article").on(table.articleId),
  index("IDX_blog_comments_user").on(table.userId),
  index("IDX_blog_comments_parent").on(table.parentId),
  index("IDX_blog_comments_status").on(table.status),
]);

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likeCount: true,
  isEdited: true,
});

export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;

// Blog Relations
export const blogCategoriesRelations = relations(blogCategories, ({ many, one }) => ({
  articles: many(blogArticles),
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
  }),
}));

export const blogArticlesRelations = relations(blogArticles, ({ one, many }) => ({
  author: one(users, {
    fields: [blogArticles.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogArticles.categoryId],
    references: [blogCategories.id],
  }),
  relatedHospital: one(hospitals, {
    fields: [blogArticles.relatedHospitalId],
    references: [hospitals.id],
  }),
  tags: many(blogArticleTags),
  comments: many(blogComments),
}));

export const blogArticleTagsRelations = relations(blogArticleTags, ({ one }) => ({
  article: one(blogArticles, {
    fields: [blogArticleTags.articleId],
    references: [blogArticles.id],
  }),
  tag: one(blogTags, {
    fields: [blogArticleTags.tagId],
    references: [blogTags.id],
  }),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  article: one(blogArticles, {
    fields: [blogComments.articleId],
    references: [blogArticles.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
  }),
  replies: many(blogComments),
}));

// User Engagement System

// Badge Definitions - all possible badges
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  rarity: text("rarity").notNull().default("common"),
  pointsRequired: integer("points_required"),
  reviewsRequired: integer("reviews_required"),
  helpfulVotesRequired: integer("helpful_votes_required"),
  isSecret: boolean("is_secret").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_badges_code").on(table.code),
  index("IDX_badges_category").on(table.category),
]);

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges - badges earned by users
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  notified: boolean("notified").notNull().default(false),
}, (table) => [
  index("IDX_user_badges_user").on(table.userId),
  index("IDX_user_badges_badge").on(table.badgeId),
]);

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
  notified: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// User Points - current point balance and level
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  currentLevel: text("current_level").notNull().default("novice"),
  reviewCount: integer("review_count").notNull().default(0),
  helpfulVotesReceived: integer("helpful_votes_received").notNull().default(0),
  helpfulVotesGiven: integer("helpful_votes_given").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_user_points_user").on(table.userId),
  index("IDX_user_points_total").on(table.totalPoints),
  index("IDX_user_points_level").on(table.currentLevel),
]);

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserPoints = typeof userPoints.$inferSelect;

// Point Transactions - log of all point earnings/deductions
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_point_transactions_user").on(table.userId),
  index("IDX_point_transactions_action").on(table.action),
  index("IDX_point_transactions_created").on(table.createdAt),
]);

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

// Referrals - track referral program
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  status: text("status").notNull().default("pending"),
  pointsAwarded: integer("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("IDX_referrals_referrer").on(table.referrerId),
  index("IDX_referrals_referred").on(table.referredId),
  index("IDX_referrals_code").on(table.referralCode),
  index("IDX_referrals_status").on(table.status),
]);

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  pointsAwarded: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// Achievement Notifications - for showing unlocked achievements
export const achievementNotifications = pgTable("achievement_notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  badgeId: integer("badge_id").references(() => badges.id),
  pointsEarned: integer("points_earned"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_achievement_notifications_user").on(table.userId),
  index("IDX_achievement_notifications_read").on(table.read),
  index("IDX_achievement_notifications_created").on(table.createdAt),
]);

export const insertAchievementNotificationSchema = createInsertSchema(achievementNotifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertAchievementNotification = z.infer<typeof insertAchievementNotificationSchema>;
export type AchievementNotification = typeof achievementNotifications.$inferSelect;

// Featured Reviewers - monthly featured reviewers
export const featuredReviewers = pgTable("featured_reviewers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  reason: text("reason"),
  reviewCount: integer("review_count").notNull().default(0),
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  featuredReviewId: integer("featured_review_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_featured_reviewers_user").on(table.userId),
  index("IDX_featured_reviewers_month_year").on(table.month, table.year),
  index("IDX_featured_reviewers_active").on(table.active),
]);

export const insertFeaturedReviewerSchema = createInsertSchema(featuredReviewers).omit({
  id: true,
  createdAt: true,
});

export type InsertFeaturedReviewer = z.infer<typeof insertFeaturedReviewerSchema>;
export type FeaturedReviewer = typeof featuredReviewers.$inferSelect;

// Engagement Relations
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
  }),
}));

export const achievementNotificationsRelations = relations(achievementNotifications, ({ one }) => ({
  user: one(users, {
    fields: [achievementNotifications.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [achievementNotifications.badgeId],
    references: [badges.id],
  }),
}));

export const featuredReviewersRelations = relations(featuredReviewers, ({ one }) => ({
  user: one(users, {
    fields: [featuredReviewers.userId],
    references: [users.id],
  }),
}));

// Profile levels configuration
export const profileLevels = {
  novice: { name: "Novice", minPoints: 0, color: "gray", description: "Just getting started! Write your first review to begin earning points." },
  contributor: { name: "Contributor", minPoints: 100, color: "blue", description: "Active member helping others find quality healthcare." },
  expert: { name: "Expert", minPoints: 500, color: "purple", description: "Trusted reviewer with valuable healthcare insights." },
  superReviewer: { name: "Super Reviewer", minPoints: 1500, color: "gold", description: "Top contributor making a real difference in healthcare transparency." },
} as const;

export type ProfileLevel = keyof typeof profileLevels;

// Point values for activities
export const pointValues = {
  writeReview: 25,
  receiveHelpfulVote: 5,
  giveHelpfulVote: 2,
  verifiedReview: 10,
  qualityReviewBonus: 15,
  referralComplete: 50,
  firstReview: 20,
  streakBonus: 10,
} as const;

// ==================== HEALTH EDUCATION HUB ====================

// Health Education Categories
export const healthCategories = pgTable("health_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull().default("heart"),
  coverImageUrl: text("cover_image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  articleCount: integer("article_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_health_categories_slug").on(table.slug),
  index("IDX_health_categories_active").on(table.isActive),
]);

export const insertHealthCategorySchema = createInsertSchema(healthCategories).omit({
  id: true,
  createdAt: true,
  articleCount: true,
});

export type InsertHealthCategory = z.infer<typeof insertHealthCategorySchema>;
export type HealthCategory = typeof healthCategories.$inferSelect;

// Health Articles
export const healthArticles = pgTable("health_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  contentHtml: text("content_html"),
  coverImageUrl: text("cover_image_url"),
  coverImageAlt: text("cover_image_alt"),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorCredentials: text("author_credentials"),
  categoryId: integer("category_id").references(() => healthCategories.id),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(5),
  viewCount: integer("view_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isEditorPick: boolean("is_editor_pick").notNull().default(false),
  tableOfContents: jsonb("table_of_contents"),
  relatedDiseases: text("related_diseases").array().notNull().default(sql`'{}'`),
  symptoms: text("symptoms").array().notNull().default(sql`'{}'`),
  keywords: text("keywords").array().notNull().default(sql`'{}'`),
  sources: text("sources").array().notNull().default(sql`'{}'`),
  medicalReviewedBy: text("medical_reviewed_by"),
  medicalReviewedAt: timestamp("medical_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_health_articles_slug").on(table.slug),
  index("IDX_health_articles_category").on(table.categoryId),
  index("IDX_health_articles_status").on(table.status),
  index("IDX_health_articles_featured").on(table.isFeatured),
  index("IDX_health_articles_published").on(table.publishedAt),
]);

export const insertHealthArticleSchema = createInsertSchema(healthArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  bookmarkCount: true,
  shareCount: true,
});

export type InsertHealthArticle = z.infer<typeof insertHealthArticleSchema>;
export type HealthArticle = typeof healthArticles.$inferSelect;

// Disease Library
export const diseases = pgTable("diseases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  alternateNames: text("alternate_names").array().notNull().default(sql`'{}'`),
  description: text("description").notNull(),
  symptoms: text("symptoms").array().notNull().default(sql`'{}'`),
  causes: text("causes"),
  riskFactors: text("risk_factors").array().notNull().default(sql`'{}'`),
  prevention: text("prevention"),
  treatment: text("treatment"),
  whenToSeeDoctor: text("when_to_see_doctor"),
  prevalenceInNigeria: text("prevalence_in_nigeria"),
  iconUrl: text("icon_url"),
  viewCount: integer("view_count").notNull().default(0),
  isCommon: boolean("is_common").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_diseases_slug").on(table.slug),
  index("IDX_diseases_common").on(table.isCommon),
  index("IDX_diseases_name").on(table.name),
]);

export const insertDiseaseSchema = createInsertSchema(diseases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export type InsertDisease = z.infer<typeof insertDiseaseSchema>;
export type Disease = typeof diseases.$inferSelect;

// User Bookmarks for Health Articles
export const healthBookmarks = pgTable("health_bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("article_id").notNull().references(() => healthArticles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_health_bookmarks_user").on(table.userId),
  index("IDX_health_bookmarks_article").on(table.articleId),
]);

export type HealthBookmark = typeof healthBookmarks.$inferSelect;

// Health Tips (daily/weekly)
export const healthTips = pgTable("health_tips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  iconUrl: text("icon_url"),
  displayDate: date("display_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_health_tips_date").on(table.displayDate),
  index("IDX_health_tips_active").on(table.isActive),
]);

export const insertHealthTipSchema = createInsertSchema(healthTips).omit({
  id: true,
  createdAt: true,
});

export type InsertHealthTip = z.infer<typeof insertHealthTipSchema>;
export type HealthTip = typeof healthTips.$inferSelect;

// Newsletter Subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => [
  index("IDX_newsletter_email").on(table.email),
  index("IDX_newsletter_active").on(table.isActive),
]);

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
  unsubscribedAt: true,
});

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Health Education Relations
export const healthCategoriesRelations = relations(healthCategories, ({ many }) => ({
  articles: many(healthArticles),
}));

export const healthArticlesRelations = relations(healthArticles, ({ one, many }) => ({
  author: one(users, {
    fields: [healthArticles.authorId],
    references: [users.id],
  }),
  category: one(healthCategories, {
    fields: [healthArticles.categoryId],
    references: [healthCategories.id],
  }),
  bookmarks: many(healthBookmarks),
}));

export const healthBookmarksRelations = relations(healthBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [healthBookmarks.userId],
    references: [users.id],
  }),
  article: one(healthArticles, {
    fields: [healthBookmarks.articleId],
    references: [healthArticles.id],
  }),
}));
