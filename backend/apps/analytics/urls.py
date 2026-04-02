"""Analytics URL configurations."""

from django.urls import path
from . import views

app_name = "analytics"

urlpatterns = [
    path("dashboard/", views.DashboardAnalyticsView.as_view(), name="dashboard"),
    path("sales/", views.SalesAnalyticsView.as_view(), name="sales-list"),
    path("top-products/", views.TopProductsAnalyticsView.as_view(), name="top-products"),
    path("forecast/", views.ForecastResultListView.as_view(), name="forecast-list"),
    path("margins/", views.MarginAnalyticsView.as_view(), name="margin-list"),
    path("anomalies/", views.AnomaliesView.as_view(), name="anomalies-list"),
    path("gst-report/", views.GSTReportView.as_view(), name="gst-report"),
]
