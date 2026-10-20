FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY celery_app.py celeryconfig.py tasks.py ./
COPY scrapers/ ./scrapers/