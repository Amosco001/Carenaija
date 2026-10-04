import type { Express } from "express";
import QRCode from "qrcode";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { escapeHtml, getPublicAppUrl, reviewerStats } from "./services/review-engagement";

export function registerReviewEngagementRoutes(app: Express): void {
  app.get("/api/user/reviewer-stats", isAuthenticated, async (req: any, res) => {
    try {
      const [patient, employee] = await Promise.all([
        storage.getUserPatientReviews(req.userId), storage.getUserEmployeeReviews(req.userId),
      ]);
      res.setHeader("Cache-Control", "no-store");
      res.json(reviewerStats(patient, employee, false));
    } catch {
      res.status(500).json({ message: "Could not load reviewer statistics." });
    }
  });
  app.get("/api/reviewers/:userId", async (req, res) => {
    try {
      const [patient, employee] = await Promise.all([
        storage.getUserPatientReviews(req.params.userId), storage.getUserEmployeeReviews(req.params.userId),
      ]);
      const stats = reviewerStats(patient, employee, true);
      if (!stats.reviewCount) return res.status(404).json({ message: "No public reviewer profile is available." });
      // Explicit allowlist: no contact info, proof attachments, anonymous review counts, or user record.
      res.setHeader("Cache-Control", "no-store");
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Could not load reviewer profile." });
    }
  });
  app.get("/api/hospitals/:id/review-poster", isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).send("Invalid hospital.");
      const hospital = await storage.getHospitalById(id);
      if (!hospital) return res.status(404).send("Hospital not found.");
      if (hospital.claimedBy !== req.userId) return res.status(403).send("Only this hospital's verified owner can print its review poster.");
      let baseUrl: string;
      try { baseUrl = getPublicAppUrl(); } catch {
        return res.status(503).send("The published CareNaija URL must be configured before printing a QR poster. No preview-only QR code has been generated.");
      }
      const reviewUrl = `${baseUrl}/write-review/patient/${id}`;
      const qr = await QRCode.toDataURL(reviewUrl, { errorCorrectionLevel: "M", margin: 4, width: 600 });
      res.setHeader("Cache-Control", "no-store");
      res.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Share your experience — ${escapeHtml(hospital.name)}</title><style>
body{font-family:Arial,sans-serif;color:#0f172a;background:white;margin:0;padding:32px;text-align:center}main{max-width:640px;margin:auto;border:2px solid #047857;border-radius:12px;padding:36px}h1{font-size:32px}h2{font-size:22px}.brand{color:#047857;font-weight:bold}img{display:block;width:300px;max-width:100%;height:auto;margin:24px auto}a{color:#047857;overflow-wrap:anywhere}button{font:inherit;padding:12px 24px;cursor:pointer;border:1px solid #047857;border-radius:6px;background:#047857;color:white;margin-bottom:24px}@media print{body{padding:0}button{display:none}main{break-inside:avoid}@page{size:A4;margin:20mm}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><main><p class="brand">CareNaija</p><h1>Share your experience</h1><h2>${escapeHtml(hospital.name)}</h2><p>Scan to write an honest review of your care.</p><img src="${qr}" alt="QR code linking to this hospital's CareNaija review page"><p>Every honest review is welcome — positive, mixed, or negative.</p><p>Your feedback helps others make informed healthcare decisions.</p><p><a href="${escapeHtml(reviewUrl)}">${escapeHtml(reviewUrl)}</a></p></main></body></html>`);
    } catch {
      res.status(500).send("Could not generate the review poster. Please try again.");
    }
  });
}