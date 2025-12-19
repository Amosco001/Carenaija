// @ts-ignore - SendGrid types
import sgMail from "@sendgrid/mail";
import type { EmailOutbox, User, Hospital, EmailPreferences } from "@shared/schema";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@carenaija.com";
const FROM_NAME = "CareNaija";
const APP_URL = process.env.REPLIT_DEPLOYMENT_URL || "https://carenaija.replit.app";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailTemplateData {
  userName?: string;
  hospitalName?: string;
  reviewerName?: string;
  reviewText?: string;
  rating?: number;
  responseText?: string;
  milestoneCount?: number;
  topHospitals?: Array<{ name: string; rating: number; city: string }>;
  unsubscribeUrl?: string;
  verificationUrl?: string;
  resetUrl?: string;
  appUrl?: string;
}

const BRAND_COLORS = {
  primary: "#16a34a",
  primaryDark: "#15803d",
  white: "#ffffff",
  gray: "#f3f4f6",
  textDark: "#1f2937",
  textLight: "#6b7280",
};

function getEmailLayout(content: string, unsubscribeUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareNaija</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.gray};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND_COLORS.gray};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: ${BRAND_COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: ${BRAND_COLORS.white}; font-size: 28px; font-weight: bold;">
                🏥 CareNaija
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Your trusted healthcare companion
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.gray}; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">
                CareNaija - Find Quality Healthcare Across Nigeria
              </p>
              <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px;">
                <a href="${APP_URL}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Visit CareNaija</a>
                ${unsubscribeUrl ? ` | <a href="${unsubscribeUrl}" style="color: ${BRAND_COLORS.textLight}; text-decoration: underline;">Unsubscribe</a>` : ""}
              </p>
              <p style="margin: 15px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 11px;">
                © ${new Date().getFullYear()} CareNaija. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getButton(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
      <tr>
        <td style="background-color: ${BRAND_COLORS.primary}; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 14px 28px; color: ${BRAND_COLORS.white}; text-decoration: none; font-weight: bold; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const stars = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  return `<span style="color: #fbbf24; font-size: 18px;">${stars}</span> <span style="color: ${BRAND_COLORS.textDark}; font-weight: bold;">${rating.toFixed(1)}</span>`;
}

export const emailTemplates = {
  welcome: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        Welcome to CareNaija, ${data.userName || "there"}! 🎉
      </h2>
      <p style="margin: 0 0 15px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        Thank you for joining Nigeria's trusted healthcare review platform. We're excited to have you as part of our community!
      </p>
      <p style="margin: 0 0 15px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        With CareNaija, you can:
      </p>
      <ul style="margin: 0 0 20px 0; padding-left: 20px; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.8;">
        <li>Search and compare hospitals across Nigeria</li>
        <li>Read honest patient reviews</li>
        <li>Share your healthcare experiences</li>
        <li>Follow hospitals and get notified of new reviews</li>
      </ul>
      ${getButton("Explore Hospitals", `${APP_URL}/search`)}
      <p style="margin: 20px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">
        If you have any questions, feel free to reach out to our support team.
      </p>`;
    
    return {
      subject: "Welcome to CareNaija! 🏥",
      html: getEmailLayout(content, data.unsubscribeUrl),
      text: `Welcome to CareNaija, ${data.userName || "there"}! Thank you for joining Nigeria's trusted healthcare review platform. Visit ${APP_URL} to explore hospitals.`,
    };
  },

  newReviewOnFollowed: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        New Review for ${data.hospitalName} 📝
      </h2>
      <p style="margin: 0 0 15px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        A hospital you follow just received a new review!
      </p>
      <div style="background-color: ${BRAND_COLORS.gray}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${BRAND_COLORS.textDark};">
          ${data.reviewerName || "Anonymous"} left a review
        </p>
        ${data.rating ? `<p style="margin: 0 0 10px 0;">${getRatingStars(data.rating)}</p>` : ""}
        <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-style: italic; line-height: 1.6;">
          "${data.reviewText?.substring(0, 200)}${(data.reviewText?.length || 0) > 200 ? "..." : ""}"
        </p>
      </div>
      ${getButton("Read Full Review", `${APP_URL}/hospital/${data.hospitalName}`)}`;
    
    return {
      subject: `New review for ${data.hospitalName}`,
      html: getEmailLayout(content, data.unsubscribeUrl),
      text: `New review for ${data.hospitalName} by ${data.reviewerName}: "${data.reviewText?.substring(0, 100)}..."`,
    };
  },

  reviewResponse: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        ${data.hospitalName} Responded to Your Review 💬
      </h2>
      <p style="margin: 0 0 15px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        Great news! The hospital has responded to your review.
      </p>
      <div style="background-color: ${BRAND_COLORS.gray}; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${BRAND_COLORS.primary};">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${BRAND_COLORS.primary};">
          Response from ${data.hospitalName}:
        </p>
        <p style="margin: 0; color: ${BRAND_COLORS.textDark}; line-height: 1.6;">
          "${data.responseText}"
        </p>
      </div>
      ${getButton("View Response", `${APP_URL}/hospital/${data.hospitalName}`)}`;
    
    return {
      subject: `${data.hospitalName} responded to your review`,
      html: getEmailLayout(content, data.unsubscribeUrl),
      text: `${data.hospitalName} responded to your review: "${data.responseText}"`,
    };
  },

  weeklyDigest: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const hospitalList = (data.topHospitals || []).map((h, i) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center;">
            <span style="background-color: ${BRAND_COLORS.primary}; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">${i + 1}</span>
            <div>
              <p style="margin: 0; font-weight: bold; color: ${BRAND_COLORS.textDark};">${h.name}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.textLight};">${h.city}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${getRatingStars(h.rating)}
        </td>
      </tr>`).join("");

    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        Your Weekly Healthcare Digest 📊
      </h2>
      <p style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        Here are the top-rated hospitals in your area this week:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: ${BRAND_COLORS.gray};">
            <th style="padding: 12px 15px; text-align: left; color: ${BRAND_COLORS.textDark}; font-size: 14px;">Hospital</th>
            <th style="padding: 12px 15px; text-align: right; color: ${BRAND_COLORS.textDark}; font-size: 14px;">Rating</th>
          </tr>
        </thead>
        <tbody>
          ${hospitalList || "<tr><td colspan='2' style='padding: 20px; text-align: center; color: #6b7280;'>No hospitals to show this week.</td></tr>"}
        </tbody>
      </table>
      ${getButton("Explore All Hospitals", `${APP_URL}/search`)}`;
    
    return {
      subject: "Your Weekly CareNaija Healthcare Digest",
      html: getEmailLayout(content, data.unsubscribeUrl),
      text: `Your Weekly CareNaija Digest: Check out the top-rated hospitals in your area at ${APP_URL}/search`,
    };
  },

  milestone: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        🎉 Congratulations, ${data.userName}!
      </h2>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); width: 120px; height: 120px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: white; font-size: 48px; font-weight: bold;">${data.milestoneCount}</span>
        </div>
        <h3 style="margin: 0; color: ${BRAND_COLORS.textDark}; font-size: 20px;">
          You've written ${data.milestoneCount} reviews!
        </h3>
      </div>
      <p style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6; text-align: center;">
        Your contributions help fellow Nigerians make informed healthcare decisions. Thank you for being such an active member of our community!
      </p>
      ${getButton("Keep Reviewing", `${APP_URL}/search`)}`;
    
    return {
      subject: `🎉 You've reached ${data.milestoneCount} reviews on CareNaija!`,
      html: getEmailLayout(content, data.unsubscribeUrl),
      text: `Congratulations! You've written ${data.milestoneCount} reviews on CareNaija. Thank you for your contributions!`,
    };
  },

  verification: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        Verify Your Email Address ✉️
      </h2>
      <p style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        Hi ${data.userName || "there"}! Please verify your email address to complete your CareNaija account setup and unlock all features.
      </p>
      ${getButton("Verify Email", data.verificationUrl || `${APP_URL}/verify`)}
      <p style="margin: 20px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">
        If you didn't create an account on CareNaija, you can safely ignore this email.
      </p>
      <p style="margin: 10px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 12px;">
        This link will expire in 24 hours.
      </p>`;
    
    return {
      subject: "Verify your CareNaija email address",
      html: getEmailLayout(content),
      text: `Verify your email address by visiting: ${data.verificationUrl}`,
    };
  },

  passwordReset: (data: EmailTemplateData): { subject: string; html: string; text: string } => {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textDark}; font-size: 24px;">
        Reset Your Password 🔐
      </h2>
      <p style="margin: 0 0 20px 0; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      ${getButton("Reset Password", data.resetUrl || `${APP_URL}/reset-password`)}
      <p style="margin: 20px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <p style="margin: 10px 0 0 0; color: ${BRAND_COLORS.textLight}; font-size: 12px;">
        This link will expire in 1 hour.
      </p>`;
    
    return {
      subject: "Reset your CareNaija password",
      html: getEmailLayout(content),
      text: `Reset your password by visiting: ${data.resetUrl}`,
    };
  },
};

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured, email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await sgMail.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
      text: text || subject,
    });
    return { success: true };
  } catch (error: any) {
    console.error("SendGrid error:", error?.response?.body || error);
    return { 
      success: false, 
      error: error?.response?.body?.errors?.[0]?.message || error?.message || "Failed to send email" 
    };
  }
}

export function getUnsubscribeUrl(token: string, category?: string): string {
  const params = new URLSearchParams({ token });
  if (category) params.set("category", category);
  return `${APP_URL}/unsubscribe?${params.toString()}`;
}
