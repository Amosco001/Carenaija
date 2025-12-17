import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
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
