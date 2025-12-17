import {
  users,
  hospitals,
  patientReviews,
  employeeReviews,
  hospitalSuggestions,
  claimRequests,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllHospitals(): Promise<Hospital[]>;
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

  async getAllHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals).orderBy(hospitals.name);
  }

  async getHospitalById(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

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
    return newHospital;
  }

  async updateHospital(id: number, hospital: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const [updated] = await db
      .update(hospitals)
      .set({ ...hospital, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
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
}

export const storage = new DatabaseStorage();
