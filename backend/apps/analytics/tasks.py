"""Analytics Celery tasks."""

from celery import shared_task
from celery.schedules import crontab
from config.celery import app
from .forecasting import recalculate_all_forecasts


@shared_task(name="recalculate_all_forecasts")
def compute_all_forecasts():
    """Recalculate demand forecasts across all active products."""
    recalculate_all_forecasts()


# Task schedule configuration is typically handled in config/celery_beat.py or via setup_periodic_tasks command
# but for simplicity, we'll let the management command handle it.
