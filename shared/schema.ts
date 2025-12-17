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
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_users_email").on(table.email),
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
  index("IDX_hospitals_state").on(table.state),
  index("IDX_hospitals_city").on(table.city),
  index("IDX_hospitals_verified").on(table.verified),
  index("IDX_hospitals_average_rating").on(table.averageRating),
]);

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

// Patient Reviews table (enhanced with title, visit_date, verified_visit, helpful_count)
export const patientReviews = pgTable("patient_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
  reviewerRole: text("reviewer_role").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_patient_reviews_hospital").on(table.hospitalId),
  index("IDX_patient_reviews_user").on(table.userId),
  index("IDX_patient_reviews_rating").on(table.rating),
  index("IDX_patient_reviews_created").on(table.createdAt),
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

export const usersRelations = relations(users, ({ many }) => ({
  patientReviews: many(patientReviews),
  employeeReviews: many(employeeReviews),
  hospitalSuggestions: many(hospitalSuggestions),
  claimRequests: many(claimRequests),
  claimedHospitals: many(hospitals),
  uploadedImages: many(hospitalImages),
  bookmarks: many(bookmarks),
}));
