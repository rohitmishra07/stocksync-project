from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from celery import Celery
import logging

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """
    Simulated health check for Backend, DB, Redis and Celery.
    Used for load balancer and infrastructure monitoring.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        health_status = {
            "status": "ok",
            "version": "1.0.0",
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": "unknown",
                "redis": "unknown",
                "celery": "unknown"
            }
        }
        
        is_healthy = True

        # 1. Database Check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health_status["services"]["database"] = "ok"
        except Exception as e:
            logger.error(f"Health Check Failure: Database - {str(e)}")
            health_status["services"]["database"] = "error"
            is_healthy = False

        # 2. Redis Check
        try:
            cache.set("_health_check", "ok", 10)
            if cache.get("_health_check") == "ok":
                health_status["services"]["redis"] = "ok"
            else:
                raise Exception("Cache Get failed")
        except Exception as e:
            logger.error(f"Health Check Failure: Redis - {str(e)}")
            health_status["services"]["redis"] = "error"
            is_healthy = False

        # 3. Celery Check
        try:
            # We use the Celery app initialized in the project
            from config.celery import app
            # inspect().active() returns active tasks per worker
            # This ensures at least one worker is alive
            inspect = app.control.inspect(timeout=1.0)
            active_workers = inspect.active()
            if active_workers:
                health_status["services"]["celery"] = "ok"
            else:
                health_status["services"]["celery"] = "no_workers"
                is_healthy = False
        except Exception as e:
            logger.error(f"Health Check Failure: Celery - {str(e)}")
            health_status["services"]["celery"] = "error"
            is_healthy = False

        if not is_healthy:
            health_status["status"] = "unhealthy"
            return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(health_status, status=status.HTTP_200_OK)
