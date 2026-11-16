# CareNaija project notes

Created from the current app patterns with the user's permission.

## Project and change rules
- CareNaija is an existing Nigerian hospital review/directory app. Preserve its production UI.
- Read this file and `DESIGN_LOCK.md` before implementation; update these notes after completing a change.
- Keep work limited to the current request and reuse approved styles. Ask before unrelated redesigns.
- Never invent hospital data or expose credentials.

## Current structure
- React/TypeScript client, Wouter routes, TanStack Query, Tailwind, and existing shadcn-style UI components.
- Express server, PostgreSQL, Drizzle schema in `shared/schema.ts`.
- Search listings: `client/src/pages/search.tsx`.
- Location listings: `/hospitals/:city` uses `client/src/pages/city-hospitals.tsx`.
- Shared hospital cards: `client/src/components/hospital-card.tsx`.
- Existing geolocation helpers: `client/src/hooks/useGeolocation.ts`.
- Development: `npm run dev`; type check: `npm run check`; production build: `npm run build`.

## Nearby hospitals and maps
- Search and location/state listings now have a “Hospitals near me” control; successful browser location requests select nearest-first sorting.
- Location state is shared across hospital cards. Cached coordinates are used only while current browser permission is granted, and revocation clears them.
- Search and location/state map views use Leaflet/OpenStreetMap. Both Leaflet JavaScript and its CSS are separate lazy chunks, loaded only when map view opens.
- Maps show database coordinates only. Missing or invalid coordinates are not plotted; those hospitals remain available in the unfiltered list and sort after known distances.
- Distance labels are straight-line estimates, not driving distances.
- The existing location page also supports state slugs found in the hospital dataset, keeping its existing page layout.
- No hospital records or database schema were changed.

## Nearby-feature verification (historical)
- `npm run test:distance`: four passing tests for coordinate validation, distance calculation, formatting, and unknown-distance sorting.
- `npm run test:nearby`: passing browser checks using the actual hospital API for consent, ordering, lazy loading, real OSM tiles, marker details, revocation, mobile overflow, and location failure states.
- `npm run build`: passed; separate map JavaScript/CSS chunks confirmed.
- `npm run check`: still reports 12 errors in unchanged admin dashboard, hospital dashboard, hospital details, and server storage files. No errors were reported in nearby/map files.
- Preview check: open `/search` or `/hospitals/lagos`, select “Hospitals near me”, grant permission, then switch between list and map. Blocking permission keeps the list usable and displays an error.

## Verification expectations
- Check permission granted, denied, unavailable, and timeout handling.
- Check distance sorting, hospitals without coordinates, list/map switching, and mobile controls.
- Confirm the map library and tiles are not requested before opening map view.
- Report changed files, verification results, and how to test in preview.

## Review engagement
- Patient thank-yous are queued atomically on automatic approval or admin approval. Employee reviews have no moderation field and are published immediately, so creation queues their thank-yous.
- Each review has one delivery record per channel. Repeated approval does not create duplicates. Historical reviews are not backfilled.
- Email uses the existing SendGrid service. SMS uses the connected Twilio account and an existing SMS-capable sender; it never purchases a number or changes provider settings.
- `/profile` now includes approved-review and helpful-vote totals, thank-you email/SMS settings, and actual phone-code verification. SMS defaults off and requires explicit consent and verified phone ownership. Phone changes invalidate verification and older codes; OTPs are cryptographically generated and stored as hashes bound to the user and phone.
- `/reviewer/:userId` exposes only the public reviewer name, approved non-anonymous review count, and helpful votes on those reviews. Private profile totals include the user's own anonymous approved reviews. Neither public profile data nor share text exposes account contact information, review proofs, or anonymous contributions.
- Named patient-review authors on hospital details and named authors in ReviewCard link to public profiles. Anonymous authors have no profile link.
- Claimed-hospital dashboards open an ownership-protected printable “Share your experience” poster, including a locally generated QR image and Print / Save as PDF. QR targets the hospital's patient-review form. Poster copy welcomes positive, mixed, and negative feedback equally.
- New outbound links require `PUBLIC_APP_URL` containing the confirmed published HTTPS origin. Until it is configured, delivery records remain pending and poster generation returns an explicit setup error rather than producing a QR for a development domain.
- The user has now configured the confirmed published address through `PUBLIC_APP_URL`; QR posters and share links use that origin. The app was restarted to load it.
- Delivery failures or uncertain provider responses are retained for manual inspection, not automatically resent. A committed sending claim prevents a crash from causing an automatic duplicate.
- Additive database changes are recorded in `migrations/20261004_review_engagement.sql` and applied to development. Apply these additive changes to production through the publishing schema-update process before activating the feature.
- No rewards or positive-review incentives were added.

### Review engagement verification
- Production build passed. `npm run check` reports 10 pre-existing errors in admin dashboard, hospital dashboard, and server storage; new feature files have no errors. The patient-review type was corrected for anonymous-link handling.
- Seven unit tests passed for profile privacy/totals, neutral share text, HTML escaping, phone normalization, and explicit public URL configuration.
- One database/API integration test passed for automatic/admin approval queuing, repeated approvals, low-rating eligibility, helpful-vote additions/removals, public/private profile data, anonymous filtering, poster ownership, QR generation, print markup, hospital-name escaping, and missing URL errors. Test records are removed afterward.
- Browser checks passed using normal login and temporary, cleaned-up test records: public/private counts, anonymous author links, SMS opt-in, invalid-phone errors, claimed-owner poster access, mobile overflow, and no uncaught browser errors.
- After URL setup, the running app returned a printable poster with a rendered QR image and the correct published-domain review-form link. Signed-in poster rendering was captured and visually checked separately from the public screenshot tool.
- Screenshot checked the public mobile reviewer-not-found state. A pre-existing analytics-script CSP warning remains outside this feature.
- Actual outbound email/SMS delivery has not been tested. No messages were sent to real users during verification.
- Twilio's read-only SDK lookup currently returns HTTP 401 / code 8001, “actor doesn't have any assertions,” before reaching sender discovery. The attached connection is API-key based, so OAuth reauthorization is not applicable. SMS activation is blocked until the existing connection's runtime authorization works.
- A second supported connector access method returns the same authorization error; no provider credentials were exposed or changed.

### Changed files and preview checks
- Server: `server/routes.ts`, `server/storage.ts`, `server/scheduler.ts`, `server/review-engagement-routes.ts`, and `server/services/{review-engagement,review-thank-you,sms}.ts`.
- Data/dependencies: `shared/schema.ts`, the additive migration, `package.json`, and `package-lock.json`.
- Client: `client/src/App.tsx`, `client/src/lib/{auth.tsx,types.ts}`, profile/reviewer/hospital-dashboard/hospital-details pages, and review-card/reviewer-settings/notification-preferences components.
- Tests: `tests/review-engagement.test.ts`, `tests/review-engagement.integration.test.ts`, `scripts/test-reviewer-ui.mjs`.
- Preview: sign in and open `/profile` for private stats and messaging preferences. Open a named hospital-review author for public stats; anonymous authors remain unlinked. Claimed hospital owners can open their poster from `/hospital-dashboard` after the published URL is configured.

## Dependency security maintenance
- Updated the application and mockup-sandbox Node dependency graphs, plus the Python scraper dependency graph, without changing ratings, reviews, hospital data, or adding monetization.
- The Node runtime is now 22, with an application engine minimum of 22.12.0. The patched Puppeteer release requires this runtime and no longer pulls in the unpatched `extract-zip` dependency.
- Removed unused application dependencies `lighthouse` and `fast-glob`. Replaced the sandbox's `fast-glob` discovery with maintained `glob`, retaining private/hidden-file exclusions and deterministic component ordering.
- Updated Google Cloud Storage, Drizzle ORM, DOMPurify, Vite, PostCSS, Axios, and other affected direct/transitive dependencies. Narrow compatibility-tested overrides cover Google HTTP-client UUID, CSRF cookies, the legacy Drizzle tooling loader's esbuild, and minimatch.
- Updated Python minimums for aiohttp, Pillow, urllib3, lxml, lxml-html-clean, requests, idna, python-dotenv, and soupsieve, with bounded major versions and a refreshed lockfile. Installed the locked packages in the existing `.pythonlibs` environment, not a new virtual environment.

### Security verification
- The fresh dependency scanner originally found 246 findings across all scanned dependency graphs, including findings beyond the assigned list. Its final scan (2026-10-05 UTC) reports zero critical, high, moderate, low, or informational findings.
- `npm audit`: zero vulnerabilities in the main application and in `artifacts/mockup-sandbox`.
- Clean application `npm ci` succeeded; the resolved esbuild graph matches the overrides. Python dependency compatibility check passed.
- `npm run test:dependencies`: five passing compatibility tests for Google/browser APIs, CommonJS UUID use, the Drizzle TypeScript loader, valid/invalid CSRF tokens, and nested/private mockup discovery.
- `npm run test:distance` and `npm run test:review-engagement`: twelve passing tests, including the real development database/API integration test.
- Production application build passed. Both workflows restarted and serve requests. Reviewer-profile/QR and nearby-hospital browser suites passed after the updates, including normal login, privacy, mobile layouts, consent, map loading, and error states. Public `/search` screenshot checked.
- Application type checking reports the same ten diagnostic locations/codes as before the dependency updates; no new type errors.
- Python HTTP-client imports, HTML parsing/cleaning/extraction, and a Pillow image round trip passed without network requests or database writes.
- Full scraper imports are blocked by an existing source error: `scraper/sources/__init__.py` imports `NIGERIAN_CITIES`, which is not defined in `scraper/sources/google_places.py`. No scraper source files were changed.
- The sandbox type check has an existing undefined icon identifier in `src/components/mockups/carenaija-hospital/Mobile.tsx`, confirmed in the original source. Its production build timed out during transformation in two bounded attempts; that build is not verified. The sandbox development workflow starts successfully.
- The existing analytics-script CSP warning remains unchanged.

### Security changed files and preview checks
- `.replit`: Node 22 runtime.
- `package.json`, `package-lock.json`: updated application dependencies, removed unused vulnerable dependency chains, runtime requirement, narrow overrides, and the compatibility-test command.
- `pyproject.toml`, `uv.lock`: safe Python version minimums and reproducible resolution.
- `artifacts/mockup-sandbox/package.json`, `artifacts/mockup-sandbox/package-lock.json`: updated sandbox dependencies and maintained glob implementation.
- `artifacts/mockup-sandbox/mockupPreviewPlugin.ts`: equivalent component discovery using the replacement glob library, with stable ordering.
- `tests/dependency-compatibility.test.mjs`: regression checks for changed library APIs and override compatibility.
- `PROJECT_NOTES.md` and agent memory: verification results and the non-obvious requirement to verify both locked and installed dependencies after override changes.
- Preview: open `/search`, use nearby sorting/list/map controls, sign in to `/profile`, and open a claimed hospital's QR poster from its dashboard. No production publishing or database migration occurred.

## TypeScript error fixes — current verification
- Fixed all nine errors recorded in the improvement-plan baseline. `npm run check` now passes with zero errors.
- `client/src/pages/admin-dashboard.tsx`: profile-photo descriptions use the existing first/last name fields, with email and generic fallbacks, instead of a nonexistent username.
- `client/src/pages/hospital-dashboard.tsx`: patient and employee cards display the existing `rating` field; patient text uses `reviewText`. Removed unsupported department lookups rather than inventing department data.
- Existing styling, rating calculations, review queries/filtering, moderation, anonymity handling, and response actions were not changed. No schema changes, fixture records, or publishing were performed.
- Verification passed: the production application build, seven review-engagement unit tests, four distance tests, and five dependency compatibility tests. Tests ran with database writes blocked.
- The application workflow restarted successfully. The public hospital-dashboard route shows its expected login requirement; the signed-in dashboard UI was not visually verified.
- With the user's subsequent approval for temporary development records, `npm run test:review-engagement` passed all eight tests, including the real database/API integration test. `npm run test:reviewer-ui` passed normal login, public/private profile counts, anonymous links, SMS consent, invalid-phone handling, claimed-owner poster access, mobile overflow, and browser-error checks.
- Verified cleanup against a pre-test development snapshot: hospitals 186, patient reviews 201, employee reviews 0, and users 33 before and after; zero matching temporary fixture users, hospitals, or reviews remained. No production access, publishing, real email, or real SMS was used for these tests.
- Changed files: the two dashboard pages and these project notes.
- Preview checks: as an admin, open `/admin` and its Users section to check profile-photo descriptions. As a claimed-hospital owner, open `/hospital-dashboard`, select a hospital's Reviews tab, and check patient/employee ratings and patient text.