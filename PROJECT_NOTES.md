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

## Latest verification
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