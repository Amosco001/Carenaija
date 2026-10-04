import type { PatientReview, EmployeeReview } from "@shared/schema";

export function getPublicAppUrl(): string {
  const value = process.env.PUBLIC_APP_URL;
  if (!value) throw new Error("The published CareNaija URL must be configured before sharing or sending thank-yous.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("PUBLIC_APP_URL must be a public HTTPS URL.");
  }
  return url.origin;
}

export function whatsappShareUrl(reviewUrl: string): string {
  // No reviewer identity, review excerpts, medical details, or positive-rating language.
  return `https://wa.me/?text=${encodeURIComponent(`Read honest healthcare experiences on CareNaija: ${reviewUrl}`)}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

export function reviewerStats(
  patient: PatientReview[], employee: EmployeeReview[], publicOnly: boolean
) {
  const visible = [
    ...patient.filter(review => review.moderationStatus === "approved"),
    ...employee,
  ].filter(review => !publicOnly || !review.isAnonymous);
  const latest = [...visible].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
  return {
    displayName: latest?.reviewerName || "Reviewer",
    reviewCount: visible.length,
    helpfulVotesReceived: visible.reduce((sum, review) => sum + Math.max(0, review.helpfulCount || 0), 0),
  };
}