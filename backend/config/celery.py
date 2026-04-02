"""Celery configuration for StockSync."""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("stocksync")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Periodic tasks
app.conf.beat_schedule = {
    "check-low-stock-every-hour": {
        "task": "apps.alerts.tasks.check_low_stock_levels",
        "schedule": crontab(minute=0),  # Every hour
    },
    "generate-daily-stock-snapshot": {
        "task": "apps.analytics.tasks.generate_daily_snapshot",
        "schedule": crontab(hour=0, minute=30),  # 12:30 AM daily
    },
}
