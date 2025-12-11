import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertHospitalSchema,
  insertPatientReviewSchema,
  insertEmployeeReviewSchema,
  insertHospitalSuggestionSchema,
  insertClaimRequestSchema,
} from "@shared/schema";

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
      const { search } = req.query;
      
      if (search && typeof search === "string") {
        const results = await storage.searchHospitals(search);
        res.json(results);
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

  return httpServer;
}
