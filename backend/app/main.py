from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, health, profiles, resumes, dashboard, jobs, tailoring, applications, intelligence, automation, recruiting, enterprise
from app.services.scheduler import start_scheduler

app = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/docs" if settings.environment != "production" else None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


for router in [health.router, auth.router, profiles.router, resumes.router, dashboard.router, jobs.router, tailoring.router, applications.router, intelligence.router, automation.router, recruiting.router, enterprise.router]:
    app.include_router(router)


@app.on_event("startup")
def startup_event():
    if settings.scheduler_enabled:
        start_scheduler()
