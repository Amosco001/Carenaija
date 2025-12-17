import {
  users,
  hospitals,
  patientReviews,
  employeeReviews,
  hospitalSuggestions,
  claimRequests,
  bookmarks,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, ilike, or, desc, count } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
