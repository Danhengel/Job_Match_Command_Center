from apscheduler.schedulers.background import BackgroundScheduler
from app.db.session import SessionLocal
from app.models.automation import SavedSearch
from app.services.automation_service import run_saved_search


scheduler = BackgroundScheduler(timezone="UTC")


def run_due_saved_searches():
    db = SessionLocal()
    try:
        searches = db.query(SavedSearch).filter(
            SavedSearch.active.is_(True),
            SavedSearch.cadence == "daily",
        ).all()
        for search in searches:
            try:
                run_saved_search(db, search)
            except Exception:
                db.rollback()
    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(
        run_due_saved_searches,
        "cron",
        hour=12,
        minute=0,
        id="daily_saved_searches",
        replace_existing=True,
    )
    scheduler.start()
