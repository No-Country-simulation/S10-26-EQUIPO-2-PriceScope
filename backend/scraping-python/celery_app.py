from celery import Celery

app = Celery("store_scrapers")
app.config_from_object("celeryconfig")
