import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
import { eq, and, inArray } from "drizzle-orm";
import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import { users, hospitals, patientReviews, employeeReviews, reviewThankYouDeliveries, reviewHelpfulVotes, emailPreferences } from "../shared/schema";
import { registerReviewEngagementRoutes } from "../server/review-engagement-routes";
import { reviewerStats } from "../server/services/review-engagement";
import { processReviewThankYous } from "../server/services/review-thank-you";

test("approval outbox, helpful votes, profile privacy and poster ownership use real storage", async () => {
  const reviewerId = randomUUID(), voterId = randomUUID();
  const patientIds: number[] = [], employeeIds: number[] = [];
  let hospitalId: number | undefined;
  const oldUrl = process.env.PUBLIC_APP_URL;
  let server: ReturnType<express.Express["listen"]> | undefined;
  try {
    // No reachable contact address, and all messaging is opted out.
    await db.insert(users).values([{ id: reviewerId, firstName: "Test reviewer" }, { id: voterId, firstName: "Test voter" }]);
    const [hospital] = await db.insert(hospitals).values({ name: 'Test Hospital <script>alert("x")</script>', address: "Test address", lga: "Test LGA", state: "Lagos", ownership: "Private", claimedBy: reviewerId }).returning();
    hospitalId = hospital.id;
    await storage.createEmailPreferences(reviewerId);
    await storage.updateEmailPreferences(reviewerId, { reviewThankYouEmail: false, reviewThankYouSms: false });
    const base = { hospitalId: hospital.id, userId: reviewerId, reviewerName: "Public Test Reviewer", reviewerRole: "Patient", rating: 1, reviewText: "An honest negative test experience.", wouldRecommend: false };
    const pending = await storage.createPatientReview({ ...base, moderationStatus: "pending" }); patientIds.push(pending.id);
    const deliveries = () => db.select().from(reviewThankYouDeliveries).where(and(eq(reviewThankYouDeliveries.reviewId, pending.id), eq(reviewThankYouDeliveries.reviewType, "patient")));
    assert.equal((await deliveries()).length, 0, "pending reviews do not trigger thank-yous");
    await storage.updateReviewModerationStatus(pending.id, "approved", reviewerId);
    assert.equal((await deliveries()).length, 2, "negative reviews get both delivery records on approval");
    await storage.updateReviewModerationStatus(pending.id, "approved", reviewerId);
    await storage.updateReviewModerationStatus(pending.id, "hidden", reviewerId);
    await storage.updateReviewModerationStatus(pending.id, "approved", reviewerId);
    assert.equal((await deliveries()).length, 2, "repeated approvals and re-approval cannot create duplicates");
    const automatic = await storage.createPatientReview({ ...base, rating: 5, wouldRecommend: true }); patientIds.push(automatic.id);
    const anonymous = await storage.createPatientReview({ ...base, isAnonymous: true, reviewerName: "Never expose this name" }); patientIds.push(anonymous.id);
    const hidden = await storage.createPatientReview({ ...base, moderationStatus: "hidden" }); patientIds.push(hidden.id);
    const employee = await storage.createEmployeeReview({ hospitalId: hospital.id, userId: reviewerId, reviewerName: "Employee Test Reviewer", position: "Nurse", employmentStatus: "current", rating: 2, reviewText: "An honest employee test experience.", wouldRecommend: false }); employeeIds.push(employee.id);
    await storage.addHelpfulVote(pending.id, "patient", voterId);
    await storage.addHelpfulVote(employee.id, "employee", voterId);
    const [p, e] = await Promise.all([storage.getUserPatientReviews(reviewerId), storage.getUserEmployeeReviews(reviewerId)]);
    assert.equal(reviewerStats(p, e, true).reviewCount, 3);
    assert.equal(reviewerStats(p, e, false).reviewCount, 4);
    assert.equal(reviewerStats(p, e, true).helpfulVotesReceived, 2);
    await storage.removeHelpfulVote(pending.id, "patient", voterId);
    assert.equal(reviewerStats(await storage.getUserPatientReviews(reviewerId), e, true).helpfulVotesReceived, 1);
    // Never process another user's queued messages during verification.
    await processReviewThankYous((await deliveries()).map(delivery => delivery.id));
    assert.ok((await deliveries()).every(d => d.status === "skipped"), "opted-out reviewers never contact a provider");

    // This isolated test server supplies test sessions; main app auth is unchanged.
    const app = express();
    app.use((req: any, _res, next) => { req.session = { userId: req.headers["x-test-user"] }; next(); });
    registerReviewEngagementRoutes(app);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server!.on("listening", resolve));
    const address = server.address() as { port: number };
    const origin = `http://127.0.0.1:${address.port}`;
    const publicRes = await fetch(`${origin}/api/reviewers/${reviewerId}`);
    assert.equal(publicRes.status, 200);
    const publicData = await publicRes.json();
    assert.deepEqual(Object.keys(publicData).sort(), ["displayName", "helpfulVotesReceived", "reviewCount"]);
    assert.equal(publicData.reviewCount, 3);
    assert.equal(publicData.helpfulVotesReceived, 1);
    assert.equal((await fetch(`${origin}/api/reviewers/${randomUUID()}`)).status, 404);
    assert.equal((await fetch(`${origin}/api/user/reviewer-stats`)).status, 401);
    const own = await fetch(`${origin}/api/user/reviewer-stats`, { headers: { "x-test-user": reviewerId } });
    assert.equal((await own.json()).reviewCount, 4);
    assert.equal((await fetch(`${origin}/api/hospitals/${hospital.id}/review-poster`)).status, 401);
    assert.equal((await fetch(`${origin}/api/hospitals/${hospital.id}/review-poster`, { headers: { "x-test-user": voterId } })).status, 403);
    process.env.PUBLIC_APP_URL = "https://example.org";
    const posterRes = await fetch(`${origin}/api/hospitals/${hospital.id}/review-poster`, { headers: { "x-test-user": reviewerId } });
    assert.equal(posterRes.status, 200);
    const poster = await posterRes.text();
    assert.ok(poster.includes(`https://example.org/write-review/patient/${hospital.id}`));
    assert.ok(poster.includes("data:image/png;base64,"));
    assert.ok(poster.includes("window.print()"));
    assert.ok(poster.includes("positive, mixed, or negative"));
    assert.ok(!poster.includes('<script>alert("x")</script>'), "poster escapes hospital names");
    delete process.env.PUBLIC_APP_URL;
    assert.equal((await fetch(`${origin}/api/hospitals/${hospital.id}/review-poster`, { headers: { "x-test-user": reviewerId } })).status, 503);
  } finally {
    if (oldUrl === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = oldUrl;
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
    if (patientIds.length) {
      await db.delete(reviewThankYouDeliveries).where(and(eq(reviewThankYouDeliveries.reviewType, "patient"), inArray(reviewThankYouDeliveries.reviewId, patientIds)));
      await db.delete(patientReviews).where(inArray(patientReviews.id, patientIds));
    }
    if (employeeIds.length) {
      await db.delete(reviewThankYouDeliveries).where(and(eq(reviewThankYouDeliveries.reviewType, "employee"), inArray(reviewThankYouDeliveries.reviewId, employeeIds)));
      await db.delete(employeeReviews).where(inArray(employeeReviews.id, employeeIds));
    }
    await db.delete(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.userId, voterId));
    await db.delete(emailPreferences).where(eq(emailPreferences.userId, reviewerId));
    if (hospitalId) await db.delete(hospitals).where(eq(hospitals.id, hospitalId));
    await db.delete(users).where(inArray(users.id, [reviewerId, voterId]));
    await pool.end();
  }
});