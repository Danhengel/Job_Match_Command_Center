from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, health, profiles, resumes, dashboard, jobs, job_search_all, tailoring, applications, intelligence, automation, recruiting, enterprise

from app.services.scheduler import start_scheduler

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "https://desirable-creation-production-f5ee.up.railway.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(resumes.router)
app.include_router(dashboard.router)
# Register universal search before the legacy router so /api/jobs/search
# keeps the existing frontend contract while using the expanded pipeline.
app.include_router(job_search_all.router)
app.include_router(jobs.router)

app.include_router(tailoring.router)

app.include_router(applications.router)

app.include_router(intelligence.router)

app.include_router(automation.router)


@app.on_event("startup")
def startup_event():
    start_scheduler()

app.include_router(recruiting.router)

app.include_router(enterprise.router)
