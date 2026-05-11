# Threat Model

## Project Overview

CareNaija is a React + Express healthcare review platform for Nigeria. It serves public hospital and health-content pages, authenticated user features such as reviews, comments, bookmarks, referrals, and notification preferences, and a large admin surface for moderation, analytics, user management, content management, and scraper control. The production stack uses Express sessions backed by PostgreSQL, a shared Drizzle schema, and optional third-party services such as SendGrid and Google Places.

Production scan assumptions for this repository:
- Only production-reachable code is in scope.
- `NODE_ENV=production` in deployed environments.
- Replit deployment provides TLS at the platform edge.
- Mock/demo sandbox paths should be ignored unless production reachability is demonstrated.

## Assets

- **User accounts and session state** — email addresses, password hashes, session cookies, verification state, suspension state, and role data. Compromise allows impersonation and privilege abuse.
- **Healthcare review and profile data** — patient reviews, employee reviews, comments, hospital claim requests, bookmarks, and hospital response records. This data affects user privacy and platform trust.
- **Administrative capabilities** — moderation tools, user management, analytics, scraper controls, content/settings management, and audit logs. Abuse could alter platform data at scale.
- **Verification and notification tokens** — password reset tokens, email/phone verification tokens, and unsubscribe tokens. Disclosure allows account workflow abuse or unauthorized preference changes.
- **Application secrets and integrations** — database credentials, session secret, SendGrid key, Google Places key, and any object-storage credentials exposed through server-side integrations.
- **Operational data** — logs, security events, scraping logs, queued emails, and admin audit history. These can contain PII, tokens, and internal state.

## Trust Boundaries

- **Browser to Express API** — all client input is untrusted and must be validated server-side. Session-bearing requests cross this boundary on nearly every protected route.
- **Express API to PostgreSQL** — the server has broad database access through `server/storage.ts` and auth storage. Any injection or authorization mistake here exposes most application data.
- **Public to authenticated user boundary** — public browsing endpoints sit next to review, profile, bookmark, notification, and referral features that require a valid session.
- **Authenticated user to admin boundary** — `/api/admin/*` routes, moderation workflows, and scraper controls require strict server-side privilege enforcement.
- **Express to external services** — SendGrid, Google Places, and scraper network access cross into third-party systems and require secret handling, output validation, and safe request limits.
- **Application to operational logs** — API responses and security events are copied into logs. Sensitive fields must not cross this boundary unnecessarily.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/replit_integrations/auth/replitAuth.ts`, `server/storage.ts`, `client/src/lib/queryClient.ts`, `client/src/lib/auth.tsx`
- **Highest-risk code areas:** auth/session handling, verification/password-reset flows, blanket response logging in `server/index.ts`, admin and moderation routes in `server/routes.ts`, scraper execution in `server/scheduler.ts` and `scraper/runner.py`
- **Public surfaces:** hospital search/details, blog/health content, newsletter/unsubscribe, public engagement/leaderboard endpoints
- **Authenticated surfaces:** reviews, comments, bookmarks, claim requests, notifications, profile updates, referrals, engagement profile
- **Admin surfaces:** `/api/admin/*` routes for users, hospitals, moderation, analytics, content, settings, email templates, scraper control
- **Usually dev-only or currently unproven in production:** `server/replit_integrations/object_storage/routes.ts` is present but not currently registered from the main server path, so ignore unless reachability changes

## Threat Categories

### Spoofing

The app relies on session cookies stored in PostgreSQL. Protected routes must always bind actions to `req.session.userId`, and admin routes must re-check role or admin state on the server. Verification, reset, and unsubscribe tokens must be unpredictable, scoped to the correct account or action, and never exposed through logs or API responses beyond what the workflow requires.

### Tampering

Users can submit reviews, comments, suggestions, claim requests, profile updates, and notification changes. The server must validate and constrain every state-changing request, enforce ownership checks server-side, and avoid trusting client-supplied identifiers, moderation state, or admin-controlled content without schema validation.

### Information Disclosure

The platform stores PII, password hashes, tokens, moderation data, and internal operational records. API responses, logs, admin exports, and error paths must not leak credentials, password hashes, verification tokens, unsubscribe tokens, or unnecessary user details. Public endpoints must expose only intentionally public profile or content fields.

### Denial of Service

The service exposes many public read endpoints plus authenticated write paths and admin-triggered scraper execution. Authentication, form submission, and scraper-trigger routes require rate limiting and bounded work. Expensive queries, unbounded pagination, and repeated external-service triggers must not allow a single user to degrade service availability.

### Elevation of Privilege

This codebase has a large `/api/admin/*` surface and several ownership-based features such as claimed hospital management and user-specific notifications. Every sensitive route must enforce authorization in the handler or storage layer, and helper code must not assume client-side route protection is sufficient. Any missing privilege check in admin, moderation, or ownership flows could lead to full platform compromise.
