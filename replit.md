# CareNaija - Hospital Review Platform

## Overview

CareNaija is a web platform for reviewing hospitals and clinics in Nigeria, combining features similar to Healthgrades (patient reviews) and Glassdoor (employee reviews/salary info). The platform allows patients to search hospitals, view ratings, and read/write reviews about care quality, while employees can anonymously rate their workplace and share salary information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL (provisioned via Replit)
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Replit Auth-managed users with profile information
- **Hospitals**: Nigerian hospitals with location, services, ownership details
- **Patient Reviews**: Ratings for care quality, cleanliness, staff attitude
- **Employee Reviews**: Workplace ratings, salary info, pros/cons
- **Hospital Suggestions**: User-submitted hospital additions
- **Claim Requests**: Hospital profile verification requests

### Project Structure
```
/client          - React frontend (Vite)
  /src
    /components  - Reusable UI components
    /pages       - Route page components
    /hooks       - Custom React hooks
    /lib         - Utilities, auth, API client
/server          - Express backend
/shared          - Shared types and schema
/migrations      - Database migrations
```

### Build & Development
- Development: `npm run dev` starts Express server with Vite middleware
- Production: `npm run build` bundles client with Vite, server with esbuild
- Database: `npm run db:push` applies schema changes

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Required secrets**: `SESSION_SECRET`, `REPL_ID`, `ISSUER_URL`

### UI Components
- **shadcn/ui**: Component library built on Radix UI primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling

### Third-Party Services
- Google Maps integration for hospital location display (client-side only, no API key required for basic embed)
- Google Places API for hospital discovery (requires `GOOGLE_PLACES_API_KEY` secret)

### Hospital Discovery System (Web Scraping)
The platform includes an automated hospital discovery system using Python scrapers.

**Architecture:**
- Location: `/scraper` directory (Python 3.11)
- Database: Stores discovered hospitals in `pending_hospitals` table
- Admin Review: Admins approve/reject hospitals via "Discovered Hospitals" tab

**Scrapers Available:**
1. **Google Places API** (`scraper/sources/google_places.py`)
   - Searches major Nigerian cities: Lagos, Abuja, Port Harcourt, Kano, Ibadan, etc.
   - Requires `GOOGLE_PLACES_API_KEY` secret (billed API)
   
2. **Web Directory Scrapers** (`scraper/sources/web_directory.py`)
   - Scrapes Nigerian health ministry and HMO directories
   - Respects robots.txt and uses polite rate limiting

**Deduplication:**
- Fuzzy matching on hospital name (85% threshold)
- Address similarity check (80% threshold)
- Phone number exact matching
- Duplicate score shown to admins for manual review

**Running the Scraper:**
```bash
cd scraper && python runner.py --source google_places
cd scraper && python runner.py --source all
```

**Workflow:**
1. Scraper discovers hospitals → saves to `pending_hospitals` (status: pending)
2. Admin reviews in dashboard → approves/rejects/marks as duplicate
3. Approved hospitals → copied to main `hospitals` table