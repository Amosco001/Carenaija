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
- **Authentication**: Custom email/password auth with bcrypt and express-session
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL (provisioned via Replit)
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Email/password authenticated users with profile information
- **Hospitals**: Nigerian hospitals with location, services, ownership details, accepted HMOs/insurance
- **Patient Reviews**: Ratings for care quality, cleanliness, staff attitude
- **Employee Reviews**: Workplace ratings, salary info, pros/cons
- **Hospital Suggestions**: User-submitted hospital additions
- **Claim Requests**: Hospital profile verification requests
- **Diagnostic Centers**: Lab/imaging centers with services, accreditations, and test pricing
- **Diagnostic Tests**: Individual tests with pricing, sample types, preparation notes, turnaround times
- **Physicians**: Doctor profiles with specialty, qualifications, experience, consultation fees
- **Physician Affiliations**: Links physicians to hospitals with availability schedules
- **Pharmacies**: Verified pharmacy directory with delivery, 24hr service, insurance acceptance, and online ordering features

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
- **Custom Auth**: Email/password authentication with bcrypt hashing (12 rounds)
- **Sessions**: PostgreSQL-backed sessions via connect-pg-simple
- **Required secrets**: `SESSION_SECRET`
- **Auth Endpoints**: POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/user`

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
   - Searches all 36 Nigerian states with neighborhood-level coverage for major cities
   - Extracts: name, address, phone, website, coordinates, rating, reviews, photos, opening hours, place_id
   - Supports 14+ search queries (hospital, clinic, diagnostic center, etc.)
   - Requires `GOOGLE_PLACES_API_KEY` secret (billed API)
   
2. **Web Directory Scrapers** (`scraper/sources/web_directory.py`)
   - Scrapes Nigerian health ministry and HMO directories
   - Respects robots.txt and uses polite rate limiting

**Data Quality Scoring:**
- **Completeness Score (0-100%)**: Measures available data fields (name, phone, website, hours, etc.)
- **Confidence Score (0-100%)**: Measures data trustworthiness (review count, verification, rating)
- Scores displayed in admin dashboard with visual progress bars

**Auto-Approval Logic:**
Facilities are auto-approved if they meet ALL criteria:
- Google verified listing
- 10+ user reviews
- Completeness score ≥ 60%
- No duplicate match detected

**Deduplication:**
- Fuzzy matching on hospital name (85% threshold)
- Address similarity check (80% threshold)
- Phone number exact matching
- Duplicate score shown to admins for manual review

**Caching:**
- API responses cached to `/scraper/cache/` directory
- 7-day cache TTL to minimize API costs
- Cache stats available via `scraper.utils.cache.get_cache_stats()`

**Cost Estimation:**
```python
from scraper.sources.google_places import get_cost_estimate
estimate = get_cost_estimate(num_cities=36)
# Returns: searches, estimated_places, total_estimated_cost, monthly_cost_daily_runs
```

**Running the Scraper:**
```bash
cd scraper && python runner.py --source google_places
cd scraper && python runner.py --source all
cd scraper && python -c "from scraper.sources.google_places import get_cost_estimate; print(get_cost_estimate())"
```

**Workflow:**
1. Scraper discovers hospitals → calculates scores → saves to `pending_hospitals`
2. Auto-approved hospitals marked for fast-track review
3. Admin reviews in dashboard → approves/rejects/marks as duplicate
4. Approved hospitals → copied to main `hospitals` table with Google data

### News/Social Media Monitoring System
Automated system to discover new hospital openings from Nigerian news sources.

**News Sources Monitored:**
- Punch Nigeria (Health section RSS)
- Vanguard Nigeria (Health section RSS)
- Guardian Nigeria (Health section RSS)
- Premium Times (Health section RSS)
- This Day Live (News RSS)

**Monitoring Features:**
- RSS feed parsing with feedparser
- Article content extraction with newspaper3k
- Hospital name extraction via regex patterns
- Location detection (Nigerian states and cities)
- Event type classification (opening, expansion, renovation, closure)
- Credibility scoring based on source reputation

**Data Storage:**
- Discoveries stored in `unverified_submissions` table
- Admin review via "News Discoveries" API endpoints
- Promotes verified discoveries to main hospitals table

**Running the Monitor:**
```bash
cd scraper && python -c "from sources.news_monitor import NewsMonitorScraper; NewsMonitorScraper().scrape()"
```

### Analytics Dashboard
Comprehensive platform analytics available at `/admin/analytics`.

**Dashboard Features:**
- Summary stats: total hospitals, reviews, users, average rating
- Reviews over time chart (configurable: 7/30/90/365 days)
- Hospitals by state pie chart
- Ratings by category bar chart
- Top rated hospitals list
- Most reviewed hospitals list
- Recent activity feed
- CSV export capability

**API Endpoints (Admin Only):**
- `GET /api/admin/analytics/summary` - Platform statistics
- `GET /api/admin/analytics/reviews-over-time` - Review trends
- `GET /api/admin/analytics/top-hospitals` - Top rated facilities
- `GET /api/admin/analytics/most-reviewed` - Most reviewed facilities
- `GET /api/admin/analytics/ratings-by-category` - Category breakdown
- `GET /api/admin/analytics/recent-activity` - Activity feed
- `GET /api/admin/analytics/hospitals-by-state` - Geographic distribution