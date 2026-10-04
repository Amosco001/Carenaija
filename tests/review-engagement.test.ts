import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, getPublicAppUrl, reviewerStats, whatsappShareUrl } from "../server/services/review-engagement";
import { normalizePhone } from "../server/services/sms";
import type { PatientReview, EmployeeReview } from "../shared/schema";

const patient = (data: Partial<PatientReview>) => ({
  reviewerName: "Public Reviewer", helpfulCount: 2, moderationStatus: "approved",
  isAnonymous: false, createdAt: new Date("2026-01-01"), ...data,
}) as PatientReview;
const employee = (data: Partial<EmployeeReview>) => ({
  reviewerName: "Employee Reviewer", helpfulCount: 3, isAnonymous: false,
  createdAt: new Date("2026-02-01"), ...data,
}) as EmployeeReview;

test("public profiles exclude anonymous and all non-approved patient reviews", () => {
  assert.deepEqual(reviewerStats([
    patient({}), patient({ isAnonymous: true, helpfulCount: 100, reviewerName: "PRIVATE" }),
    patient({ moderationStatus: "hidden", helpfulCount: 200 }),
    patient({ moderationStatus: "pending" }), patient({ moderationStatus: "rejected" }),
  ], [employee({}), employee({ isAnonymous: true, helpfulCount: 300 })], true), {
    displayName: "Employee Reviewer", reviewCount: 2, helpfulVotesReceived: 5,
  });
});
test("own stats include approved anonymous reviews but exclude pending and hidden", () => {
  const stats = reviewerStats([patient({}), patient({ isAnonymous: true }), patient({ moderationStatus: "pending" })], [employee({ isAnonymous: true })], false);
  assert.equal(stats.reviewCount, 3);
  assert.equal(stats.helpfulVotesReceived, 7);
});
test("profiles handle no public reviews and negative legacy vote counts", () => {
  assert.equal(reviewerStats([patient({ isAnonymous: true })], [], true).reviewCount, 0);
  assert.equal(reviewerStats([patient({ helpfulCount: -10 })], [], true).helpfulVotesReceived, 0);
});
test("WhatsApp share links encode URLs and never include sensitive review text or ratings", () => {
  const url = "https://example.org/hospital/4";
  const link = new URL(whatsappShareUrl(url));
  assert.equal(link.origin, "https://wa.me");
  assert.equal(link.searchParams.get("text"), `Read honest healthcare experiences on CareNaija: ${url}`);
});
test("HTML escaping protects printable hospital names", () => {
  assert.equal(escapeHtml('<script>"A&B"</script>'), "&lt;script&gt;&quot;A&amp;B&quot;&lt;/script&gt;");
});
test("phone numbers require E.164 and support Nigerian local normalization", () => {
  assert.equal(normalizePhone("0801 234 5678"), "+2348012345678");
  assert.equal(normalizePhone("+234 (801) 234-5678"), "+2348012345678");
  assert.equal(normalizePhone("bad"), null);
  assert.equal(normalizePhone("+00"), null);
  assert.equal(normalizePhone({}), null);
});
test("shared URLs require explicit HTTPS configuration, never an invented domain", () => {
  const previous = process.env.PUBLIC_APP_URL;
  try {
    delete process.env.PUBLIC_APP_URL;
    assert.throws(getPublicAppUrl, /published CareNaija URL/);
    process.env.PUBLIC_APP_URL = "http://example.org";
    assert.throws(getPublicAppUrl, /public HTTPS/);
    process.env.PUBLIC_APP_URL = "https://example.org/";
    assert.equal(getPublicAppUrl(), "https://example.org");
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = previous;
  }
});