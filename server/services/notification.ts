import { storage } from "../storage";
import { emailTemplates, sendEmail, getUnsubscribeUrl } from "./email";
import type { Hospital, PatientReview, EmployeeReview } from "@shared/schema";

interface BasicUser {
  id: string;
  email: string | null;
  firstName: string | null;
}

const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

export class NotificationService {
  async sendWelcomeEmail(user: BasicUser): Promise<void> {
    if (!user.email) return;
    
    let prefs = await storage.getEmailPreferences(user.id);
    if (!prefs) {
      prefs = await storage.createEmailPreferences(user.id);
    }

    if (!prefs.welcomeEmail) return;

    const unsubscribeUrl = getUnsubscribeUrl(prefs.unsubscribeToken, "welcome");
    const template = emailTemplates.welcome({
      userName: user.firstName || user.email.split("@")[0],
      unsubscribeUrl,
    });

    await storage.queueEmail({
      userId: user.id,
      toEmail: user.email,
      templateType: "welcome",
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
    });
  }

  async notifyNewReviewOnFollowedHospital(review: PatientReview | EmployeeReview, hospital: Hospital, reviewer: BasicUser): Promise<void> {
    const followers = await storage.getFollowersOfHospital(hospital.id);
    
    for (const follower of followers) {
      if (!follower.email || follower.userId === review.userId) continue;
      
      const prefs = await storage.getEmailPreferences(follower.userId);
      if (!prefs?.newReviewOnFollowed) continue;

      const unsubscribeUrl = getUnsubscribeUrl(prefs.unsubscribeToken, "new_review");
      const template = emailTemplates.newReviewOnFollowed({
        hospitalName: hospital.name,
        reviewerName: reviewer.firstName || "Anonymous",
        reviewText: "reviewText" in review ? review.reviewText : "",
        rating: review.rating,
        unsubscribeUrl,
      });

      await storage.queueEmail({
        userId: follower.userId,
        toEmail: follower.email,
        templateType: "new_review",
        subject: template.subject,
        htmlContent: template.html,
        textContent: template.text,
      });
    }
  }

  async notifyReviewResponse(
    review: PatientReview | EmployeeReview,
    responseText: string,
    hospital: Hospital
  ): Promise<void> {
    const reviewer = await storage.getUser(review.userId);
    if (!reviewer?.email) return;

    const prefs = await storage.getEmailPreferences(review.userId);
    if (!prefs?.reviewResponse) return;

    const unsubscribeUrl = getUnsubscribeUrl(prefs.unsubscribeToken, "review_response");
    const template = emailTemplates.reviewResponse({
      userName: reviewer.firstName || "there",
      hospitalName: hospital.name,
      responseText,
      unsubscribeUrl,
    });

    await storage.queueEmail({
      userId: review.userId,
      toEmail: reviewer.email,
      templateType: "review_response",
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
    });
  }

  async checkAndNotifyMilestone(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user?.email) return;

    const stats = await storage.getUserReviewStats(userId);
    if (!stats) return;

    const totalReviews = stats.totalPatientReviews + stats.totalEmployeeReviews;
    const nextMilestone = MILESTONES.find(m => m > stats.lastMilestoneNotified && totalReviews >= m);

    if (!nextMilestone) return;

    const prefs = await storage.getEmailPreferences(userId);
    if (!prefs?.reviewMilestones) return;

    await storage.updateLastMilestoneNotified(userId, nextMilestone);

    const unsubscribeUrl = getUnsubscribeUrl(prefs.unsubscribeToken, "milestone");
    const template = emailTemplates.milestone({
      userName: user.firstName || user.email.split("@")[0],
      milestoneCount: nextMilestone,
      unsubscribeUrl,
    });

    await storage.queueEmail({
      userId,
      toEmail: user.email,
      templateType: "milestone",
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
    });
  }

  async sendWeeklyDigests(): Promise<number> {
    const dayOfWeek = new Date().getDay();
    const eligibleUsers = await storage.getUsersForWeeklyDigest(dayOfWeek);
    let sentCount = 0;

    for (const { user, ...prefs } of eligibleUsers) {
      if (!user.email) continue;

      const city = user.location || "Lagos";
      const topHospitals = await storage.getTopRatedHospitals(5, city);

      if (topHospitals.length === 0) continue;

      const unsubscribeUrl = getUnsubscribeUrl(prefs.unsubscribeToken, "weekly_digest");
      const template = emailTemplates.weeklyDigest({
        userName: user.firstName || user.email.split("@")[0],
        topHospitals: topHospitals.map(h => ({
          name: h.name,
          rating: h.averageRating || 0,
          city: h.city || h.lga,
        })),
        unsubscribeUrl,
      });

      await storage.queueEmail({
        userId: user.id,
        toEmail: user.email,
        templateType: "weekly_digest",
        subject: template.subject,
        htmlContent: template.html,
        textContent: template.text,
      });

      await storage.updateLastDigestSent(user.id);
      sentCount++;
    }

    return sentCount;
  }

  async processEmailQueue(): Promise<{ sent: number; failed: number }> {
    const pendingEmails = await storage.getPendingEmails(50);
    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      const result = await sendEmail(
        email.toEmail,
        email.subject,
        email.htmlContent,
        email.textContent || undefined
      );

      if (result.success) {
        await storage.markEmailSent(email.id);
        sent++;
      } else {
        await storage.markEmailFailed(email.id, result.error || "Unknown error");
        failed++;
      }
    }

    return { sent, failed };
  }
}

export const notificationService = new NotificationService();
