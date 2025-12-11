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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lga: text("lga").notNull(),
  state: text("state").notNull().default("Lagos"),
  ownership: text("ownership").notNull(),
  bedCapacity: integer("bed_capacity"),
  operatingHours: text("operating_hours"),
  services: text("services").array().notNull().default(sql`'{}'`),
  email: text("email"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  verified: boolean("verified").notNull().default(false),
  claimedBy: varchar("claimed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;

// Patient Reviews table
export const patientReviews = pgTable("patient_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
  reviewerRole: text("reviewer_role").notNull(),
  rating: integer("rating").notNull(),
  waitTime: text("wait_time"),
  cleanliness: integer("cleanliness"),
  staffAttitude: integer("staff_attitude"),
  facilities: integer("facilities"),
  reviewText: text("review_text").notNull(),
  wouldRecommend: boolean("would_recommend").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatientReviewSchema = createInsertSchema(patientReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertPatientReview = z.infer<typeof insertPatientReviewSchema>;
export type PatientReview = typeof patientReviews.$inferSelect;

// Employee Reviews table
export const employeeReviews = pgTable("employee_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
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
  wouldRecommend: boolean("would_recommend").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeReviewSchema = createInsertSchema(employeeReviews).omit({
  id: true,
  createdAt: true,
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
});

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
});

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
  claimedByUser: one(users, {
    fields: [hospitals.claimedBy],
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

export const usersRelations = relations(users, ({ many }) => ({
  patientReviews: many(patientReviews),
  employeeReviews: many(employeeReviews),
  hospitalSuggestions: many(hospitalSuggestions),
  claimRequests: many(claimRequests),
  claimedHospitals: many(hospitals),
}));
