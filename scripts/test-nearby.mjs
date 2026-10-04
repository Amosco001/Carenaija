import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) throw new Error("REPLIT_DEV_DOMAIN is required for browser verification.");
const origin = `https://${domain}`;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
const mapRequest = url => /map-view|leaflet|tile\.openstreetmap\.org/.test(url);
const validCoordinates = h => typeof h.latitude === "number" && Number.isFinite(h.latitude) &&
  Math.abs(h.latitude) <= 90 && typeof h.longitude === "number" &&
  Number.isFinite(h.longitude) && Math.abs(h.longitude) <= 180;
const distance = h => {
  if (!validCoordinates(h)) return Infinity;
  const r = d => d * Math.PI / 180;
  const a = Math.sin(r(h.latitude - 6.45) / 2) ** 2 +
    Math.cos(r(6.45)) * Math.cos(r(h.latitude)) * Math.sin(r(h.longitude - 3.4) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const freshPage = async (permissions = ["geolocation"], width = 1280) => {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(origin, permissions);
  const page = await context.newPage();
  await page.setViewport({ width, height: 900 });
  await page.setGeolocation({ latitude: 6.45, longitude: 3.4 });
  page.on("pageerror", error => errors.push(error.message));
  return { context, page };
};
const cardIds = page => page.$$eval('[data-testid^="card-hospital-"]', cards =>
  cards.map(card => Number(card.dataset.testid.replace("card-hospital-", ""))));
const waitForCards = page => page.waitForSelector('[data-testid^="card-hospital-"]', { timeout: 45000 });

try {
  const { context, page } = await freshPage();
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.evaluateOnNewDocument(() => {
    window.__locationRequests = 0;
    const getPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (...args) => {
      window.__locationRequests++;
      return getPosition(...args);
    };
  });
  await page.goto(`${origin}/search`, { waitUntil: "networkidle2" });
  await waitForCards(page);
  assert.equal(await page.evaluate(() => window.__locationRequests), 0, "no location prompt before clicking");
  assert.equal(requests.some(mapRequest), false, "no map library or tile requests in default list view");
  assert.equal((await page.$$('[data-testid^="distance-"]')).length, 0);
  const hospitals = await page.evaluate(async () => (await fetch("/api/hospitals")).json());
  assert.ok(hospitals.some(validCoordinates), "real hospital coordinates are available");
  await page.click('[data-testid="button-near-me"]');
  await page.waitForSelector('[data-testid^="distance-"]');
  const expected = [...hospitals].sort((a, b) => distance(a) - distance(b)).slice(0, 20).map(h => h.id);
  assert.deepEqual(await cardIds(page), expected, "search hospitals sort nearest first");
  assert.equal(requests.some(mapRequest), false, "near me does not load the map");
  await page.click('[data-testid="button-view-map"]');
  await page.waitForSelector(".leaflet-container");
  await page.waitForSelector(".leaflet-marker-icon");
  assert.equal(await page.$$eval(".leaflet-marker-icon", markers => markers.length), hospitals.filter(validCoordinates).length);
  assert.ok(requests.some(mapRequest), "opening map loads its module and tiles");
  await page.waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 0, { timeout: 30000 });
  await page.click(".leaflet-marker-icon");
  await page.waitForFunction(() => [...document.querySelectorAll("a")].some(a => a.textContent === "View Details"));
  await page.click('[data-testid="button-view-list"]');
  await waitForCards(page);
  await context.overridePermissions(origin, []);
  await page.waitForFunction(() => !document.querySelector('[data-testid^="distance-"]'));
  assert.equal(await page.evaluate(() => localStorage.getItem("carenaija_user_location")), null, "revocation clears cached location");
  await context.close();
  console.log("PASS: search permission, distances, ordering, lazy map, real tiles, markers, revocation");

  const mobile = await freshPage(["geolocation"], 390);
  const mobileRequests = [];
  mobile.page.on("request", request => mobileRequests.push(request.url()));
  await mobile.page.goto(`${origin}/hospitals/lagos`, { waitUntil: "networkidle2" });
  await waitForCards(mobile.page);
  assert.equal(mobileRequests.some(mapRequest), false, "location page map is lazy too");
  await mobile.page.click('[data-testid="button-near-me"]');
  await mobile.page.waitForSelector('[data-testid^="distance-"]');
  const cityIds = await cardIds(mobile.page);
  const cityDistances = cityIds.map(id => distance(hospitals.find(h => h.id === id)));
  assert.ok(cityDistances.every((d, i) => i === 0 || d >= cityDistances[i - 1]), "location list is nearest-first");
  await mobile.page.click('[data-testid="button-view-map"]');
  await mobile.page.waitForSelector(".leaflet-container");
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "mobile has no horizontal page overflow");
  const anotherState = hospitals.find(h => !["lagos", "abuja", "rivers", "oyo", "kano", "enugu", "edo", "cross-river"].includes(h.state.toLowerCase().replace(/\s+/g, "-")));
  if (anotherState) {
    await mobile.page.goto(`${origin}/hospitals/${anotherState.state.toLowerCase().replace(/\s+/g, "-")}`, { waitUntil: "networkidle2" });
    await waitForCards(mobile.page);
    assert.ok((await mobile.page.$eval('[data-testid="text-city-title"]', el => el.textContent)).includes(anotherState.state));
  }
  await mobile.context.close();
  console.log("PASS: mobile location/state pages, distance sort, map controls, no horizontal overflow");

  for (const scenario of ["denied", "timeout", "unavailable"]) {
    const failure = await freshPage(scenario === "denied" ? [] : ["geolocation"]);
    if (scenario === "timeout") await failure.page.evaluateOnNewDocument(() => {
      navigator.geolocation.getCurrentPosition = (_success, error) =>
        error({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    if (scenario === "unavailable") await failure.page.evaluateOnNewDocument(() =>
      Object.defineProperty(navigator, "geolocation", { value: undefined }));
    await failure.page.goto(`${origin}/search`, { waitUntil: "networkidle2" });
    await waitForCards(failure.page);
    await failure.page.click('[data-testid="button-near-me"]');
    const text = scenario === "denied" ? "Location access was blocked" : scenario === "timeout" ? "Location request timed out" : "Geolocation is not supported";
    await failure.page.waitForFunction(text => document.body.textContent.includes(text), {}, text);
    assert.equal((await failure.page.$$('[data-testid^="distance-"]')).length, 0);
    assert.equal(await failure.page.$eval('[data-testid="select-sort"]', el => el.textContent), "Highest Rated");
    await failure.context.close();
    console.log(`PASS: ${scenario} keeps list usable and shows an explicit error`);
  }
  await pause(100);
  assert.deepEqual(errors, [], "no browser runtime errors");
} finally {
  await browser.close();
}