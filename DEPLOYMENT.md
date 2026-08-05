# CareerOS v1 Beta Deployment

## Required services

- PostgreSQL database
- Redis instance
- Backend container/service
- Frontend container/service
- HTTPS-enabled public domains

## Environment

Copy `.env.production.example` into the deployment platform's secret manager. Never commit real credentials. Use a long random `SECRET_KEY`, production database credentials, explicit allowed origins, and a short access-token lifetime.

## Release sequence

1. Build backend and frontend images from the merged `main` branch.
2. Run `alembic upgrade head` against the production database.
3. Start the backend with one scheduler-enabled process. Set `SCHEDULER_ENABLED=false` on additional web replicas to avoid duplicate background cycles.
4. Start the frontend with `NEXT_PUBLIC_API_URL` pointing to the public API.
5. Verify `/api/health`, login, Daily Brief, saved searches, notifications, calendar, and weekly report.
6. Create a database backup before every schema migration.

## Security checks

- Confirm HTTPS and HSTS.
- Confirm API documentation is disabled in production.
- Confirm CORS contains only approved frontend domains.
- Confirm default secrets are rejected.
- Confirm database and Redis are not publicly exposed.
- Review logs for tokens, passwords, résumé text, and other personal information.

## Monitoring

Monitor service health, application errors, scheduler status, database capacity, failed search providers, and backup completion. Configure alerts for repeated restarts, migration failures, elevated 5xx responses, and scheduler failures.

## Rollback

Keep the previous application images available. Roll back application images first. Reverse database migrations only after reviewing the migration's downgrade safety and restoring a backup when necessary.
