import { and, eq, inArray, lte } from "drizzle-orm";
import { db, pool } from "../db";
import { storage } from "../storage";
import { patientReviews, employeeReviews, reviewThankYouDeliveries } from "@shared/schema";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { escapeHtml, getPublicAppUrl, whatsappShareUrl } from "./review-engagement";

export async function processReviewThankYous(onlyDeliveryIds?: number[]): Promise<void> {
  if (onlyDeliveryIds?.length === 0) return;
  // Session lock plus committed claims: a crash after sending must not resend a thank-you.
  // Failed/ambiguous deliveries require a provider-log check before any manual retry.
  const client = await pool.connect();
  let acquired = false;
  try {
    const lock = await client.query("SELECT pg_try_advisory_lock(21404, 1) AS acquired");
    acquired = lock.rows[0]?.acquired === true;
    if (!acquired) return;
    const deliveries = await db.select().from(reviewThankYouDeliveries).where(and(
      eq(reviewThankYouDeliveries.status, "pending"),
      lte(reviewThankYouDeliveries.nextAttemptAt, new Date()),
      onlyDeliveryIds ? inArray(reviewThankYouDeliveries.id, onlyDeliveryIds) : undefined,
    )).limit(20);
    for (const delivery of deliveries) {
      const table = delivery.reviewType === "patient" ? patientReviews : employeeReviews;
      const [review] = await db.select().from(table).where(eq(table.id, delivery.reviewId));
      if (!review || ("moderationStatus" in review && review.moderationStatus !== "approved")) {
        await db.update(reviewThankYouDeliveries).set({ status: "skipped" }).where(eq(reviewThankYouDeliveries.id, delivery.id));
        continue;
      }
      const [user, prefs] = await Promise.all([
        storage.getUser(review.userId), storage.getEmailPreferences(review.userId),
      ]);
      const eligible = delivery.channel === "email"
        ? user?.email && prefs?.reviewThankYouEmail !== false
        : user?.phoneNumber && user.phoneVerifiedAt && prefs?.reviewThankYouSms === true;
      if (!eligible) {
        await db.update(reviewThankYouDeliveries).set({ status: "skipped" }).where(eq(reviewThankYouDeliveries.id, delivery.id));
        continue;
      }
      let baseUrl: string;
      try { baseUrl = getPublicAppUrl(); } catch {
        // Configuration errors stay pending without using up an attempt.
        continue;
      }
      const reviewUrl = `${baseUrl}/hospital/${review.hospitalId}`;
      const shareUrl = whatsappShareUrl(reviewUrl);
      const message = `Thank you for sharing your honest experience on CareNaija. Your review is approved. Every honest review matters, whatever the rating. Sharing is optional: ${shareUrl}`;
      await db.update(reviewThankYouDeliveries).set({ status: "sending", attempts: delivery.attempts + 1 }).where(eq(reviewThankYouDeliveries.id, delivery.id));
      try {
        if (delivery.channel === "email") {
          const html = `<p>Thank you for sharing your honest experience on CareNaija.</p><p>Your review is approved. Every honest review matters, whatever the rating.</p><p>Sharing is optional.</p><p><a href="${escapeHtml(shareUrl)}">Share on WhatsApp</a></p><p><a href="${escapeHtml(reviewUrl)}">View hospital reviews</a></p><p>You can turn off review thank-yous in your <a href="${baseUrl}/profile">profile settings</a>.</p>`;
          const result = await sendEmail(user!.email!, "Thank you for your honest CareNaija review", html, message);
          if (!result.success) throw new Error("Email provider did not confirm delivery");
        } else {
          await sendSms(user!.phoneNumber!, message);
        }
        await db.update(reviewThankYouDeliveries).set({ status: "sent", sentAt: new Date() }).where(eq(reviewThankYouDeliveries.id, delivery.id));
      } catch {
        await db.update(reviewThankYouDeliveries).set({ status: "failed" }).where(eq(reviewThankYouDeliveries.id, delivery.id));
        console.error(`[review-thank-you] ${delivery.channel} delivery ${delivery.id} failed; check provider delivery logs before retrying`);
      }
    }
  } finally {
    if (acquired) await client.query("SELECT pg_advisory_unlock(21404, 1)");
    client.release();
  }
}

export function dispatchReviewThankYous(): void {
  void processReviewThankYous().catch(() => console.error("[review-thank-you] Processing failed"));
}