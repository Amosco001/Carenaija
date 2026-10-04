import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";

const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const id = randomUUID();
const email = `reviewer-ui-${id}@example.invalid`;
const password = randomUUID();
let hospitalId, browser;
try {
  await pool.query("INSERT INTO users(id,email,password_hash,first_name) VALUES($1,$2,$3,'UI test reviewer')", [id, email, await bcrypt.hash(password, 10)]);
  await pool.query("INSERT INTO email_preferences(user_id,review_thank_you_email,review_thank_you_sms) VALUES($1,false,false)", [id]);
  const h = await pool.query("INSERT INTO hospitals(name,address,lga,state,ownership,claimed_by) VALUES('UI test hospital','Test address','Test LGA','Lagos','Private',$1) RETURNING id", [id]);
  hospitalId = h.rows[0].id;
  for (const anonymous of [false, true]) {
    // UI fixtures only: no outbox records or external communications.
    await pool.query("INSERT INTO patient_reviews(hospital_id,user_id,reviewer_name,reviewer_role,rating,review_text,would_recommend,is_anonymous,helpful_count) VALUES($1,$2,'UI public reviewer','Patient',2,'An honest test experience.',false,$3,3)", [hospitalId, id, anonymous]);
  }
  browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${origin}/reviewer/${id}`, { waitUntil: "networkidle2" });
  await page.waitForFunction(() => document.body.innerText.includes("UI public reviewer"));
  assert.ok(await page.$eval("body", body => body.innerText.includes("Helpful votes received")));
  await page.setViewport({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "public profile fits mobile");
  const profileRes = await page.evaluate(async () => {
    const res = await fetch(location.pathname.replace("/reviewer/", "/api/reviewers/"));
    return res.json();
  });
  assert.equal(profileRes.reviewCount, 1);
  assert.equal(profileRes.helpfulVotesReceived, 3);
  const loginStatus = await page.evaluate(async (email, password) => {
    const r = await fetch("/api/auth/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    return r.status;
  }, email, password);
  assert.equal(loginStatus, 200, "normal login works without any auth bypass");
  await page.goto(`${origin}/profile`, { waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="notification-preferences"]');
  assert.ok(await page.$eval("body", body => body.innerText.includes("Helpful votes")));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "signed-in profile fits mobile");
  const stats = await page.evaluate(async () => (await fetch("/api/user/reviewer-stats")).json());
  assert.equal(stats.reviewCount, 2);
  assert.equal(stats.helpfulVotesReceived, 6);
  await page.click("#review-thanks-sms");
  assert.ok(await page.$eval("body", body => body.innerText.includes("SMS will be enabled after verification")));
  assert.equal(await page.$eval("#review-thanks-sms", el => el.getAttribute("aria-checked")), "false");
  await page.type("#verification-phone", "invalid");
  await page.click("#verification-phone + button");
  await page.waitForFunction(() => document.body.innerText.includes("Could not send verification code"));
  assert.equal((await pool.query("SELECT review_thank_you_sms FROM email_preferences WHERE user_id=$1", [id])).rows[0].review_thank_you_sms, false);
  await page.goto(`${origin}/hospital-dashboard`, { waitUntil: "networkidle2" });
  await page.waitForSelector(`[data-testid="button-review-poster-${hospitalId}"]`);
  const posterStatus = await page.evaluate(async hospitalId => (await fetch(`/api/hospitals/${hospitalId}/review-poster`)).status, hospitalId);
  assert.equal(posterStatus, process.env.PUBLIC_APP_URL ? 200 : 503, "poster fails explicitly without a published URL");
  await page.goto(`${origin}/hospital/${hospitalId}`, { waitUntil: "networkidle2" });
  assert.equal((await page.$$(`a[href="/reviewer/${id}"]`)).length, 1, "only the named review links to a public profile");
  assert.deepEqual(errors, []);
  console.log("PASS: real login, public/private profile counts, anonymous links, SMS consent, invalid-phone handling, claimed-owner poster access, mobile overflow, browser errors");
} finally {
  if (browser) await browser.close();
  await pool.query("DELETE FROM patient_reviews WHERE user_id=$1", [id]);
  if (hospitalId) await pool.query("DELETE FROM hospitals WHERE id=$1", [hospitalId]);
  await pool.query("DELETE FROM sessions WHERE sess->>'userId'=$1", [id]).catch(() => {});
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
  await pool.end();
}