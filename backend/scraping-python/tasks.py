from celery.utils.log import get_task_logger

from celery_app import app
from scrapers import SCRAPERS

logger = get_task_logger(__name__)


@app.task
def run_all_scrapers() -> None:
    """Run each registered store scraper once."""
    for scraper in SCRAPERS:
        try:
            scraper.scrape()
        except Exception:
            logger.exception("Scraper %s failed", scraper.name)
