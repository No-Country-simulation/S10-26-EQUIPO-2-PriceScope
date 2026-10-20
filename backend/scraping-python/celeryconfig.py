import os

from celery.schedules import crontab

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
timezone = "UTC"
enable_utc = True
imports = ("tasks",)

beat_schedule = {
    "run-scrapers-daily": {
        "task": "tasks.run_all_scrapers",
        "schedule": crontab(hour=0, minute=0),
    },
}
