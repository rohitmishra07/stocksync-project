from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule

class Command(BaseCommand):
    help = "Sets up the Celery Beat periodic task for Shopify synchronization."

    def handle(self, *args, **options):
        # Create 15-minute interval
        schedule, created = IntervalSchedule.objects.get_or_create(
            every=15,
            period=IntervalSchedule.MINUTES,
        )

        # Create/Update Periodic Task
        task_name = "Sync All Shopify Stores"
        PeriodicTask.objects.update_or_create(
            name=task_name,
            defaults={
                "interval": schedule,
                "task": "apps.channels_sync.tasks.sync_all_shopify_stores",
                "enabled": True,
            },
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully configured: {task_name}"))
