# CareerNavIQ Job Match Command Center

CareerNavIQ collects open positions from employer career systems, public job APIs, remote-job feeds, government sources, and web discovery, then removes duplicates and ranks each opportunity against a user's career profile and primary résumé.

## Job-search coverage

The universal `/api/jobs/search` pipeline combines:

- JSearch / Google Jobs publishers
- Remotive, Remote OK, Jobicy, and Himalayas
- Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee, and Workable
- Saved employer career-page watches and the curated employer catalog
- USAJOBS
- CareerOneStop / National Labor Exchange when configured
- Adzuna and Jooble when configured
- Brave Search discovery of employer job pages
- Schema.org `JobPosting` JSON-LD parsing for career pages without a direct connector
- ATS detection for Workday, iCIMS, Taleo, Oracle Recruiting, SuccessFactors, GovernmentJobs, ADP, UKG, Dayforce, and Paylocity pages

The system prefers direct ATS feeds, then structured employer job pages, and merges duplicate postings before matching.

## Employer universe

CareerNavIQ scans a curated company-first universe instead of relying only on job-title searches. The direct ATS catalog includes fintech, lending, servicing, credit, mortgage, and real-estate finance employers. The expanded Greenhouse universe includes Mission Lane, Ocrolus, LendingTree, Enova International, Upgrade, Amount, and Hometap in addition to the existing employer set.

Direct employer boards are downloaded once per cache window and filtered locally against the user's search titles. This helps uncover relevant roles with unexpected titles and avoids dependence on search-engine indexing.

## CareerOneStop / NLx

The CareerOneStop Jobs V2 connector queries the U.S. Department of Labor-backed National Labor Exchange and participating state job banks. It supports keyword or O*NET searches, city/state/ZIP or nationwide coverage, radius, posting-age limits, sorting, and pagination.

The connector:

- requests up to three pages of recent postings
- includes description snippets for résumé matching
- normalizes company, location, posting date, URL, and remote indicators
- caches results for six hours
- appears in source-level search audits
- runs in both manual and scheduled saved searches

## Automated saved searches

Scheduled and manually-run saved searches use the same expanded source strategy instead of the original limited collector. Depending on configuration, an automated search can check:

- all enabled remote-job feeds
- JSearch publishers
- USAJOBS, CareerOneStop / NLx, Adzuna, and Jooble
- Brave employer-page discovery
- the curated employer catalog
- each active career page saved by the user

Each run returns source-level request, result, and failure counts. Saved career-page watches also record their latest check time, matching-job count, and last error.

The existing APScheduler automation service runs saved-search and notification workflows every 15 minutes. For larger production volume, run scheduled collection in a dedicated Railway worker service rather than in every web instance.

## Job freshness verification

Migration `0015` adds these job-record fields:

- `verified_at`
- `closed_at`
- `verification_status`

The scheduler checks a conservative batch of older active postings. Jobs are deactivated only when CareerNavIQ receives an explicit closure signal, including:

- HTTP 404 or 410
- an invalid or unsafe application URL
- a page stating that the job expired
- a page stating that the position was filled
- a page stating that the role is no longer available or accepting applications

Blocked, rate-limited, and temporarily unavailable pages remain active and are labeled for later rechecking.

Authenticated freshness endpoints:

- `GET /api/jobs/freshness` — database-wide freshness totals
- `POST /api/jobs/verify-stale?limit=25` — run an on-demand verification batch

## Required services

- PostgreSQL
- Redis
- FastAPI backend
- Next.js frontend

## Environment variables

Copy `.env.example` to `.env` and configure the sources you want enabled.

```env
SECRET_KEY=replace-with-a-long-random-secret-before-production
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql+psycopg://jobmatch:jobmatch@db:5432/jobmatch
REDIS_URL=redis://redis:6379/0

RAPIDAPI_KEY=
BRAVE_SEARCH_API_KEY=
USAJOBS_API_KEY=
USAJOBS_EMAIL=
CAREERONESTOP_USER_ID=
CAREERONESTOP_API_TOKEN=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JOOBLE_API_KEY=
```

Connectors with missing credentials remain inactive and appear as setup notices in the search audit rather than causing the entire search to fail.

## Local development

```bash
docker compose up --build
```

Open the frontend at `http://localhost:3000`. The Jobs page continues using `/api/jobs/search`, which is routed through the maximum-coverage search pipeline.

## Tests

```bash
cd backend
pytest -q
```

The focused tests cover web discovery, Schema.org job parsing, private-network URL blocking, expanded saved-search collection, CareerOneStop normalization, and job-closure classification.

## Operational safeguards

The web-discovery and freshness parsers:

- accept only public HTTP(S) URLs
- reject credential-bearing, local, private, reserved, and link-local destinations
- revalidate redirects
- limit downloaded HTML size
- ignore major aggregator pages in the employer-page discovery layer
- cache discovery results to control API cost and repeated crawling
- do not deactivate postings merely because they are old

CareerNavIQ should continue to use official APIs and public ATS endpoints whenever available and comply with each source's terms and access rules.
