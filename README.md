# CareerNavIQ Job Match Command Center

CareerNavIQ collects open positions from employer career systems, public job APIs, remote-job feeds, government sources, and web discovery, then removes duplicates and ranks each opportunity against a user's career profile and primary résumé.

## Job-search coverage

The universal `/api/jobs/search` pipeline now combines:

- JSearch / Google Jobs publishers
- Remotive, Remote OK, Jobicy, and Himalayas
- Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee, and Workable
- Saved employer career-page watches and the curated employer catalog
- USAJOBS
- Adzuna and Jooble when configured
- Brave Search discovery of employer job pages
- Schema.org `JobPosting` JSON-LD parsing for career pages without a direct connector
- ATS detection for Workday, iCIMS, Taleo, Oracle Recruiting, SuccessFactors, GovernmentJobs, ADP, UKG, Dayforce, and Paylocity pages

The system prefers direct ATS feeds, then structured employer job pages, and merges duplicate postings before matching.

## Required services

- PostgreSQL
- Redis
- FastAPI backend
- Next.js frontend

The existing APScheduler automation service runs saved searches and notification workflows every 15 minutes. For larger production volume, run scheduled collection in a dedicated Railway worker service rather than in every web instance.

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
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JOOBLE_API_KEY=
```

Connectors with missing credentials remain inactive and appear as setup notices in the search audit rather than causing the entire search to fail.

## Local development

```bash
docker compose up --build
```

Open the frontend at `http://localhost:3000`. The Jobs page continues using `/api/jobs/search`, which is now routed through the maximum-coverage search pipeline.

## Tests

```bash
cd backend
pytest -q
```

## Operational safeguards

The web-discovery parser:

- accepts only public HTTP(S) URLs
- rejects credential-bearing, local, private, reserved, and link-local destinations
- revalidates redirects
- limits downloaded HTML size
- ignores major aggregator pages in the employer-page discovery layer
- caches discovery results to control API cost and repeated crawling

CareerNavIQ should continue to use official APIs and public ATS endpoints whenever available and comply with each source's terms and access rules.
